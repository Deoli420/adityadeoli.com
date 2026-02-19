"""
Async webhook client for outbound alert delivery.

Mirrors the ``ApiRunner`` pattern: one shared httpx.AsyncClient with
connection pooling, initialised at app startup, torn down at shutdown.

Responsibilities:
  - POST JSON payloads to the configured webhook URL.
  - Timeout protection per request.
  - Never raise — log failures and return a result bool.

Design:
  - Separate from the API runner client because webhook traffic has
    different pool sizes, timeouts, and retry needs.
  - Stateless per-call — no session or queue, just fire-and-forget.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class WebhookClient:
    """
    Async webhook sender with managed httpx.AsyncClient lifecycle.

    Call ``startup()`` at app startup and ``shutdown()`` at app shutdown.
    """

    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    # ── lifecycle ────────────────────────────────────────────────────

    def startup(self) -> None:
        """Create the shared httpx client.  Idempotent."""
        if not settings.webhook_available:
            logger.info(
                "Webhook client disabled — WEBHOOK_ENABLED=%s, WEBHOOK_URL=%s",
                settings.WEBHOOK_ENABLED,
                "set" if settings.WEBHOOK_URL else "empty",
            )
            return

        if self._client is not None:
            return

        self._client = httpx.AsyncClient(
            timeout=settings.WEBHOOK_TIMEOUT_SECONDS,
            limits=httpx.Limits(
                max_connections=10,
                max_keepalive_connections=5,
                keepalive_expiry=30,
            ),
            headers={
                "User-Agent": f"SentinelAI/{settings.APP_VERSION}",
                "Content-Type": "application/json",
            },
        )
        logger.info(
            "Webhook client started (url=%s, timeout=%.0fs)",
            settings.WEBHOOK_URL,
            settings.WEBHOOK_TIMEOUT_SECONDS,
        )

    async def shutdown(self) -> None:
        """Close the httpx client."""
        if self._client is not None:
            await self._client.aclose()
            self._client = None
            logger.info("Webhook client closed")

    # ── public API ───────────────────────────────────────────────────

    @property
    def available(self) -> bool:
        return self._client is not None

    async def send(self, payload: dict[str, Any]) -> bool:
        """
        POST a JSON payload to the configured webhook URL.

        Returns True on success (2xx), False on any failure.
        This method **never raises**.
        """
        if self._client is None:
            logger.debug("Webhook send skipped — client not available")
            return False

        url = settings.WEBHOOK_URL
        try:
            response = await self._client.post(url, json=payload)

            if response.is_success:
                logger.info(
                    "Webhook delivered: %d %s (%d bytes)",
                    response.status_code,
                    url,
                    len(response.content),
                )
                return True

            logger.warning(
                "Webhook rejected: %d %s — %s",
                response.status_code,
                url,
                response.text[:200],
            )
            return False

        except httpx.TimeoutException:
            logger.error("Webhook timed out: %s", url)
            return False

        except Exception as exc:
            logger.error("Webhook send failed: %s — %s", url, exc)
            return False


# ─── module-level singleton ─────────────────────────────────────────────

webhook_client = WebhookClient()
