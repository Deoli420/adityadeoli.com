"""
Async HTTP execution engine.

Responsibilities:
  - Execute a single HTTP request against a registered API endpoint.
  - Measure response time with sub-millisecond precision.
  - Parse JSON responses safely (non-JSON bodies are captured as null).
  - Retry failed requests with configurable attempts and backoff.
  - Timeout protection per request.
  - Return a structured result dataclass — never raise on HTTP errors.

This module is intentionally I/O-only.  It does NOT touch the database.
Persistence is handled by the runner service that calls this.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# ─── defaults ───────────────────────────────────────────────────────────
DEFAULT_TIMEOUT_SECONDS = 30.0
DEFAULT_MAX_RETRIES = 2
DEFAULT_RETRY_BACKOFF_SECONDS = 1.0
MAX_RESPONSE_BODY_BYTES = 512 * 1024  # 512 KB cap on stored body


@dataclass(frozen=True, slots=True)
class RunResult:
    """Immutable result of a single API execution attempt."""

    status_code: int | None = None
    response_time_ms: float | None = None
    response_body: dict[str, Any] | None = None
    is_success: bool = False
    error_message: str | None = None


@dataclass(slots=True)
class RunnerConfig:
    """Per-request knobs — callers can override defaults."""

    timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS
    max_retries: int = DEFAULT_MAX_RETRIES
    retry_backoff_seconds: float = DEFAULT_RETRY_BACKOFF_SECONDS


class ApiRunner:
    """
    Async HTTP execution engine.

    Holds a shared ``httpx.AsyncClient`` with connection pooling.
    Created once at app startup, reused across all requests.
    """

    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    # ── lifecycle ────────────────────────────────────────────────────────

    async def startup(self) -> None:
        """Create the shared HTTP client.  Call once during app lifespan."""
        self._client = httpx.AsyncClient(
            follow_redirects=True,
            limits=httpx.Limits(
                max_connections=100,
                max_keepalive_connections=20,
                keepalive_expiry=30,
            ),
            headers={"User-Agent": "SentinelAI/0.1.0"},
        )
        logger.info("ApiRunner HTTP client started")

    async def shutdown(self) -> None:
        """Close the shared HTTP client.  Call once during app shutdown."""
        if self._client:
            await self._client.aclose()
            self._client = None
            logger.info("ApiRunner HTTP client closed")

    # ── public API ───────────────────────────────────────────────────────

    async def execute(
        self,
        *,
        url: str,
        method: str,
        expected_status: int,
        config: RunnerConfig | None = None,
        headers: dict[str, str] | None = None,
        params: dict[str, str] | None = None,
        content: str | None = None,
        content_type: str | None = None,
    ) -> RunResult:
        """
        Execute an HTTP request with retries and return a ``RunResult``.

        This method **never raises**.  Network errors, timeouts, and
        unexpected status codes are all captured in the result object.

        Optional V2 parameters:
          - headers: additional HTTP headers to send.
          - params: query string parameters to append.
          - content: raw request body (string).
          - content_type: body Content-Type header (set automatically for JSON).
        """
        cfg = config or RunnerConfig()
        last_result: RunResult | None = None

        for attempt in range(1, cfg.max_retries + 1):
            last_result = await self._single_attempt(
                url=url,
                method=method,
                expected_status=expected_status,
                timeout=cfg.timeout_seconds,
                headers=headers,
                params=params,
                content=content,
                content_type=content_type,
            )

            # Success or non-retryable HTTP response → return immediately.
            if last_result.is_success or last_result.status_code is not None:
                return last_result

            # Network / timeout error → log and back off before retry.
            logger.warning(
                "Attempt %d/%d failed for %s %s: %s",
                attempt,
                cfg.max_retries,
                method,
                url,
                last_result.error_message,
            )
            if attempt < cfg.max_retries:
                import asyncio

                await asyncio.sleep(cfg.retry_backoff_seconds * attempt)

        # All retries exhausted.
        return last_result  # type: ignore[return-value]

    # ── internals ────────────────────────────────────────────────────────

    async def _single_attempt(
        self,
        *,
        url: str,
        method: str,
        expected_status: int,
        timeout: float,
        headers: dict[str, str] | None = None,
        params: dict[str, str] | None = None,
        content: str | None = None,
        content_type: str | None = None,
    ) -> RunResult:
        """Execute one HTTP request and measure its response time."""
        if self._client is None:
            return RunResult(
                error_message="ApiRunner not started — call startup() first"
            )

        try:
            # Build request kwargs
            kwargs: dict[str, Any] = {
                "method": method,
                "url": url,
                "timeout": timeout,
            }
            if headers:
                kwargs["headers"] = headers
            if params:
                kwargs["params"] = params
            if content is not None and method not in ("GET", "HEAD"):
                kwargs["content"] = content
                # Set Content-Type if provided and not already in headers
                if content_type and (not headers or "Content-Type" not in headers):
                    kwargs.setdefault("headers", {})
                    kwargs["headers"]["Content-Type"] = content_type

            start = time.perf_counter()
            response = await self._client.request(**kwargs)
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

            body = self._safe_parse_json(response)
            is_success = response.status_code == expected_status

            if not is_success:
                logger.info(
                    "%s %s returned %d (expected %d) in %.1f ms",
                    method,
                    url,
                    response.status_code,
                    expected_status,
                    elapsed_ms,
                )

            return RunResult(
                status_code=response.status_code,
                response_time_ms=elapsed_ms,
                response_body=body,
                is_success=is_success,
            )

        except httpx.TimeoutException as exc:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
            return RunResult(
                response_time_ms=elapsed_ms,
                error_message=f"Timeout after {timeout}s: {exc}",
            )

        except httpx.ConnectError as exc:
            return RunResult(error_message=f"Connection error: {exc}")

        except httpx.HTTPError as exc:
            return RunResult(error_message=f"HTTP error: {exc}")

        except Exception as exc:
            logger.exception("Unexpected error calling %s %s", method, url)
            return RunResult(error_message=f"Unexpected error: {exc}")

    @staticmethod
    def _safe_parse_json(response: httpx.Response) -> dict[str, Any] | None:
        """
        Attempt to parse the response body as JSON.

        Returns ``None`` if:
        - Content-Type is not JSON.
        - Body exceeds size cap.
        - Body is not valid JSON.
        """
        content_type = response.headers.get("content-type", "")
        if "json" not in content_type:
            return None

        if len(response.content) > MAX_RESPONSE_BODY_BYTES:
            logger.warning(
                "Response body too large (%d bytes), skipping JSON parse",
                len(response.content),
            )
            return None

        try:
            data = response.json()
            # Only store dicts at top level — lists / primitives are wrapped.
            if isinstance(data, dict):
                return data
            return {"_value": data}
        except Exception:
            return None


# ─── module-level singleton ─────────────────────────────────────────────
# Imported in main.py lifespan; injected into services via Depends.

api_runner = ApiRunner()
