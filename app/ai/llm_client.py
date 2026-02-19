"""
Async LLM client wrapper with retry, fallback, and observability.

Responsibilities:
  - Manage an async OpenAI client with proper lifecycle.
  - Send structured prompts and parse JSON responses.
  - Retry with exponential backoff on transient failures.
  - Track metrics (latency, success/failure counts, token usage).
  - Fail gracefully — never crash the monitoring pipeline.

Design:
  - Thin wrapper around the official ``openai`` SDK.
  - Returns parsed dict on success, None on any failure.
  - Retries up to MAX_RETRIES on timeout/network errors.
  - No retries on auth errors or invalid responses (non-recoverable).
"""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, field
from typing import Any

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


# ── Metrics tracking ───────────────────────────────────────────────────────

@dataclass
class LLMMetrics:
    """Observable metrics for the LLM client."""

    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    retried_calls: int = 0
    total_tokens_used: int = 0
    total_latency_ms: float = 0.0
    last_error: str | None = None

    @property
    def success_rate(self) -> float:
        if self.total_calls == 0:
            return 0.0
        return self.successful_calls / self.total_calls

    @property
    def avg_latency_ms(self) -> float:
        if self.successful_calls == 0:
            return 0.0
        return self.total_latency_ms / self.successful_calls

    def to_dict(self) -> dict[str, Any]:
        return {
            "total_calls": self.total_calls,
            "successful_calls": self.successful_calls,
            "failed_calls": self.failed_calls,
            "retried_calls": self.retried_calls,
            "success_rate": round(self.success_rate, 3),
            "avg_latency_ms": round(self.avg_latency_ms, 1),
            "total_tokens_used": self.total_tokens_used,
            "last_error": self.last_error,
        }


# ── Retry configuration ───────────────────────────────────────────────────

MAX_RETRIES = 3
RETRY_BASE_DELAY_S = 1.0  # 1s, 2s, 4s exponential backoff

# Errors worth retrying (transient)
_RETRYABLE_ERRORS = (
    "timeout",
    "connection",
    "rate_limit",
    "server_error",
    "overloaded",
    "503",
    "502",
    "504",
    "529",
)


def _is_retryable(error: Exception) -> bool:
    """Check if an error is transient and worth retrying."""
    error_str = str(error).lower()
    return any(keyword in error_str for keyword in _RETRYABLE_ERRORS)


class LLMClient:
    """Async wrapper around OpenAI chat completions with retry and metrics."""

    def __init__(self) -> None:
        self._client: AsyncOpenAI | None = None
        self.metrics = LLMMetrics()

    # ── lifecycle ────────────────────────────────────────────────────

    def startup(self) -> None:
        """Initialise the async client.  Call once at app startup."""
        if not settings.ai_available:
            logger.warning("AI disabled — no OPENAI_API_KEY configured")
            return

        self._client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            timeout=settings.OPENAI_TIMEOUT_SECONDS,
        )
        logger.info(
            "LLMClient started (model=%s, timeout=%.0fs, max_retries=%d)",
            settings.OPENAI_MODEL,
            settings.OPENAI_TIMEOUT_SECONDS,
            MAX_RETRIES,
        )

    async def shutdown(self) -> None:
        """Close the underlying httpx client."""
        if self._client is not None:
            await self._client.close()
            self._client = None
            logger.info("LLMClient closed — final metrics: %s", self.metrics.to_dict())

    # ── public API ───────────────────────────────────────────────────

    @property
    def available(self) -> bool:
        return self._client is not None

    async def analyse(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
    ) -> dict[str, Any] | None:
        """
        Send a prompt pair and return the parsed JSON response.

        Retries up to MAX_RETRIES on transient failures with exponential
        backoff.  Returns ``None`` if all attempts fail.

        This method **never raises**.
        """
        if self._client is None:
            logger.debug("LLM call skipped — client not available")
            return None

        self.metrics.total_calls += 1
        last_error: Exception | None = None

        for attempt in range(1, MAX_RETRIES + 1):
            start_time = time.monotonic()
            try:
                result = await self._do_call(system_prompt, user_prompt)
                elapsed_ms = (time.monotonic() - start_time) * 1000

                if result is not None:
                    self.metrics.successful_calls += 1
                    self.metrics.total_latency_ms += elapsed_ms
                    logger.info(
                        "LLM call succeeded (attempt=%d, latency=%.0fms)",
                        attempt,
                        elapsed_ms,
                    )
                    return result

                # result is None — LLM returned unparseable response
                self.metrics.failed_calls += 1
                self.metrics.last_error = "Unparseable LLM response"
                return None  # Don't retry parse failures

            except Exception as exc:
                elapsed_ms = (time.monotonic() - start_time) * 1000
                last_error = exc

                if attempt < MAX_RETRIES and _is_retryable(exc):
                    delay = RETRY_BASE_DELAY_S * (2 ** (attempt - 1))
                    self.metrics.retried_calls += 1
                    logger.warning(
                        "LLM call failed (attempt=%d/%d, latency=%.0fms, error=%s). "
                        "Retrying in %.1fs...",
                        attempt,
                        MAX_RETRIES,
                        elapsed_ms,
                        exc,
                        delay,
                    )
                    import asyncio
                    await asyncio.sleep(delay)
                    continue

                # Non-retryable or last attempt
                self.metrics.failed_calls += 1
                self.metrics.last_error = str(exc)
                logger.error(
                    "LLM call failed permanently (attempt=%d/%d, latency=%.0fms): %s",
                    attempt,
                    MAX_RETRIES,
                    elapsed_ms,
                    exc,
                )
                return None

        # Should not reach here, but safety net
        self.metrics.failed_calls += 1
        self.metrics.last_error = str(last_error) if last_error else "Unknown"
        return None

    # ── internal ─────────────────────────────────────────────────────

    async def _do_call(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> dict[str, Any] | None:
        """
        Single LLM call attempt.  Returns parsed dict or None.
        Raises on network/API errors (caller handles retry).
        """
        assert self._client is not None

        response = await self._client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        if not content:
            logger.warning("LLM returned empty content")
            return None

        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as exc:
            logger.error("LLM returned invalid JSON: %s", exc)
            return None

        if not isinstance(parsed, dict):
            logger.warning("LLM returned non-dict JSON: %s", type(parsed))
            return None

        # Track token usage
        tokens = response.usage.total_tokens if response.usage else 0
        self.metrics.total_tokens_used += tokens
        logger.debug("LLM response parsed (%d tokens)", tokens)

        return parsed


# ─── module-level singleton ─────────────────────────────────────────────

llm_client = LLMClient()
