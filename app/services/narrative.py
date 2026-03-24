import logging
from typing import Any

from app.ai.llm_client import LLMClient
from app.ai.prompt_templates import NARRATIVE_SYSTEM_PROMPT, build_narrative_prompt

logger = logging.getLogger(__name__)


class NarrativeService:
    """Generates human-readable incident narratives from structured data."""

    def __init__(self, llm: LLMClient | None = None) -> None:
        self._llm = llm

    async def generate(
        self,
        *,
        endpoint_name: str,
        severity: str,
        signal_flags: list[str],
        status_code: int | None = None,
        response_time_ms: float | None = None,
        anomaly_reasoning: str | None = None,
        occurrence_count: int = 1,
        avg_resolution_ms: int | None = None,
        last_resolution_notes: str | None = None,
        cross_endpoint_count: int = 0,
    ) -> str:
        """Generate narrative. Tries LLM if conditions met, falls back to template."""

        # Decide whether to use LLM
        use_llm = (
            self._llm is not None
            and anomaly_reasoning
            and (occurrence_count > 1 or len(signal_flags) >= 3 or cross_endpoint_count > 0)
        )

        if use_llm:
            result = await self._llm_narrative(
                endpoint_name=endpoint_name,
                signal_flags=signal_flags,
                severity=severity,
                status_code=status_code,
                response_time_ms=response_time_ms,
                anomaly_reasoning=anomaly_reasoning,
                occurrence_count=occurrence_count,
                avg_resolution_ms=avg_resolution_ms,
                last_resolution_notes=last_resolution_notes,
                cross_endpoint_count=cross_endpoint_count,
            )
            if result:
                return result

        # Fallback: template narrative
        return self._template_narrative(
            endpoint_name=endpoint_name,
            severity=severity,
            signal_flags=signal_flags,
            status_code=status_code,
            response_time_ms=response_time_ms,
            occurrence_count=occurrence_count,
            avg_resolution_ms=avg_resolution_ms,
            last_resolution_notes=last_resolution_notes,
        )

    def _template_narrative(
        self,
        *,
        endpoint_name: str,
        severity: str,
        signal_flags: list[str],
        status_code: int | None,
        response_time_ms: float | None,
        occurrence_count: int,
        avg_resolution_ms: int | None,
        last_resolution_notes: str | None,
    ) -> str:
        # Signal summary
        signal_labels = {
            "status_mismatch": f"status {status_code or 'error'}",
            "latency_spike": f"latency spike ({response_time_ms:.0f}ms)" if response_time_ms else "latency spike",
            "schema_drift": "schema drift",
            "security_finding": "security finding",
            "contract_violation": "contract violation",
            "ai_anomaly": "AI-detected anomaly",
        }
        signals = [signal_labels.get(f, f) for f in signal_flags]
        signal_text = ", ".join(signals) if signals else "monitoring alert"

        # First sentence: what happened
        parts = [f"{endpoint_name} triggered a {severity.lower()} incident: {signal_text}."]

        # Second sentence: recurrence
        if occurrence_count > 1:
            parts.append(f"This is occurrence #{occurrence_count} of this pattern.")
        else:
            parts.append("This is the first occurrence of this pattern.")

        # Third sentence: resolution
        if last_resolution_notes:
            time_part = ""
            if avg_resolution_ms:
                minutes = avg_resolution_ms / 60000
                if minutes < 60:
                    time_part = f" in ~{minutes:.0f}m"
                else:
                    hours = minutes / 60
                    time_part = f" in ~{hours:.1f}h"
            notes_preview = last_resolution_notes[:150].rstrip(".")
            parts.append(f"Previously resolved{time_part}: {notes_preview}.")
        elif occurrence_count > 1:
            parts.append("No resolution notes from previous occurrences.")

        return " ".join(parts)

    async def _llm_narrative(self, **kwargs: Any) -> str | None:
        """Call LLM for a richer narrative. Returns None on failure."""
        try:
            user_prompt = build_narrative_prompt(**kwargs)
            result = await self._llm.analyse(
                system_prompt=NARRATIVE_SYSTEM_PROMPT,
                user_prompt=user_prompt,
            )
            if result and isinstance(result, dict):
                narrative = result.get("narrative", "")
                action = result.get("suggested_action")
                if narrative:
                    if action:
                        return f"{narrative} Suggested action: {action}"
                    return narrative
        except Exception:
            logger.exception("LLM narrative generation failed")
        return None
