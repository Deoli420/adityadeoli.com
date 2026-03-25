import logging
import uuid
from typing import Any

from app.ai.llm_client import LLMClient
from app.models.ai_memory import AiMemory
from app.models.incident import Incident
from app.repositories.ai_memory import AiMemoryRepository

logger = logging.getLogger(__name__)

MEMORY_EXTRACTION_SYSTEM = """You are an incident resolution analyst for SentinelAI, an API monitoring platform.

Given an incident's details and resolution context, extract a concise learning.

Respond in JSON:
{
  "learning": "1-3 sentence summary of what happened and what fixed it",
  "resolution_action": "The specific action that resolved the issue (1 sentence, or null if unclear)",
  "confidence": 0.0 to 1.0 (how confident you are this learning is useful for future incidents)
}

Rules:
- Be specific: mention endpoint names, error types, signal patterns
- Focus on actionable knowledge: what would help someone seeing this pattern again?
- If resolution notes are vague, set confidence lower
- If no clear resolution action, set resolution_action to null"""


def _build_extraction_prompt(
    endpoint_name: str,
    incident_title: str,
    severity: str,
    signal_flags: list[str],
    narrative: str | None,
    notes: str | None,
    resolution_time_str: str | None,
) -> str:
    lines = [
        f"Endpoint: {endpoint_name}",
        f"Incident: {incident_title[:300]}",
        f"Severity: {severity}",
        f"Signals: {', '.join(signal_flags) if signal_flags else 'none'}",
    ]
    if narrative:
        lines.append(f"Narrative: {narrative[:500]}")
    if notes:
        lines.append(f"Resolution notes: {notes[:500]}")
    if resolution_time_str:
        lines.append(f"Resolution time: {resolution_time_str}")
    return "\n".join(lines)


class AiMemoryService:
    def __init__(self, repo: AiMemoryRepository, llm: LLMClient | None = None) -> None:
        self._repo = repo
        self._llm = llm

    async def extract_and_store(
        self,
        incident: Incident,
        endpoint_name: str,
        signal_flags: list[str],
    ) -> AiMemory | None:
        """Extract a learning from a resolved incident and store it."""
        if not incident.fingerprint:
            return None
        if not incident.notes and not incident.narrative:
            return None

        # Check if we already extracted a learning for this incident
        existing = await self._repo.get_by_incident(incident.id)
        if existing:
            return existing

        resolution_time_str = None
        if incident.started_at and incident.resolved_at:
            delta = incident.resolved_at - incident.started_at
            minutes = delta.total_seconds() / 60
            if minutes < 60:
                resolution_time_str = f"{minutes:.0f} minutes"
            else:
                resolution_time_str = f"{minutes / 60:.1f} hours"

        # Try LLM extraction
        learning_text = None
        action_text = None
        confidence = 0.7

        if self._llm:
            try:
                prompt = _build_extraction_prompt(
                    endpoint_name=endpoint_name,
                    incident_title=incident.title,
                    severity=incident.severity,
                    signal_flags=signal_flags,
                    narrative=incident.narrative,
                    notes=incident.notes,
                    resolution_time_str=resolution_time_str,
                )
                result = await self._llm.analyse(
                    system_prompt=MEMORY_EXTRACTION_SYSTEM,
                    user_prompt=prompt,
                )
                if result and isinstance(result, dict):
                    learning_text = result.get("learning")
                    action_text = result.get("resolution_action")
                    confidence = float(result.get("confidence", 0.7))
            except Exception:
                logger.exception("LLM memory extraction failed")

        # Fallback: template-based learning
        if not learning_text:
            signal_labels = {
                "status_mismatch": "status errors",
                "latency_spike": "latency spikes",
                "schema_drift": "schema changes",
                "security_finding": "security issues",
                "contract_violation": "contract violations",
                "ai_anomaly": "anomalous behavior",
            }
            signals_text = ", ".join(signal_labels.get(s, s) for s in signal_flags[:3])
            learning_text = f"{endpoint_name} experienced {signals_text}."
            if incident.notes:
                learning_text += f" Resolution: {incident.notes[:200]}"
            elif incident.narrative:
                learning_text += f" {incident.narrative[:200]}"
            confidence = 0.5

        memory = AiMemory(
            organization_id=incident.organization_id,
            endpoint_id=incident.endpoint_id,
            incident_id=incident.id,
            fingerprint=incident.fingerprint,
            signal_flags=signal_flags,
            learning=learning_text,
            resolution_action=action_text,
            confidence=confidence,
        )
        return await self._repo.create(memory)

    async def get_suggested_fixes(
        self,
        fingerprint: str,
        endpoint_id: uuid.UUID,
        org_id: uuid.UUID,
    ) -> list[dict[str, Any]]:
        """Find relevant learnings for an incident's fingerprint."""
        # Same endpoint first
        same_ep = await self._repo.get_by_fingerprint(fingerprint, endpoint_id, limit=3)
        # Cross-endpoint
        all_org = await self._repo.get_by_fingerprint_org(fingerprint, org_id, limit=5)

        suggestions = []
        seen_ids = set()

        for mem in same_ep:
            if mem.id not in seen_ids:
                seen_ids.add(mem.id)
                suggestions.append({
                    "id": str(mem.id),
                    "learning": mem.learning,
                    "resolution_action": mem.resolution_action,
                    "confidence": mem.confidence,
                    "endpoint_name": None,  # same endpoint
                    "incident_id": str(mem.incident_id),
                    "created_at": mem.created_at.isoformat() if mem.created_at else None,
                    "source": "same_endpoint",
                })

        for mem in all_org:
            if mem.id not in seen_ids:
                seen_ids.add(mem.id)
                ep_name = mem.endpoint.name if mem.endpoint else str(mem.endpoint_id)
                suggestions.append({
                    "id": str(mem.id),
                    "learning": mem.learning,
                    "resolution_action": mem.resolution_action,
                    "confidence": mem.confidence,
                    "endpoint_name": ep_name,
                    "incident_id": str(mem.incident_id),
                    "created_at": mem.created_at.isoformat() if mem.created_at else None,
                    "source": "cross_endpoint",
                })

        # Sort by confidence desc
        suggestions.sort(key=lambda x: x["confidence"], reverse=True)
        return suggestions[:5]
