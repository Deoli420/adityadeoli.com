"""
Async LLM client wrapper.

Responsibilities:
  - Manage an async OpenAI client with proper lifecycle.
  - Send structured prompts and parse JSON responses.
  - Fail gracefully — never crash the monitoring pipeline.
  - Log all failures for observability.

Design:
  - Thin wrapper around the official ``openai`` SDK.
  - Returns parsed dict on success, None on any failure.
  - No retries here — the openai SDK handles retries internally.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMClient:
    """Async wrapper around OpenAI chat completions."""

    def __init__(self) -> None:
        self._client: AsyncOpenAI | None = None

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
            "LLMClient started (model=%s, timeout=%.0fs)",
            settings.OPENAI_MODEL,
            settings.OPENAI_TIMEOUT_SECONDS,
        )

    async def shutdown(self) -> None:
        """Close the underlying httpx client."""
        if self._client is not None:
            await self._client.close()
            self._client = None
            logger.info("LLMClient closed")

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

        Returns ``None`` if:
        - Client is not initialised (no API key).
        - LLM returns invalid JSON.
        - Any network or API error occurs.

        This method **never raises**.
        """
        if self._client is None:
            logger.debug("LLM call skipped — client not available")
            return None

        try:
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

            parsed = json.loads(content)
            if not isinstance(parsed, dict):
                logger.warning("LLM returned non-dict JSON: %s", type(parsed))
                return None

            logger.debug(
                "LLM response received (%d tokens)",
                response.usage.total_tokens if response.usage else 0,
            )
            return parsed

        except json.JSONDecodeError as exc:
            logger.error("LLM returned invalid JSON: %s", exc)
            return None

        except Exception as exc:
            logger.error("LLM call failed: %s", exc)
            return None


# ─── module-level singleton ─────────────────────────────────────────────

llm_client = LLMClient()
