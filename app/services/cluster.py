import uuid
import logging
from datetime import datetime, timezone

from app.models.incident import Incident
from app.models.incident_cluster import IncidentCluster
from app.repositories.cluster import ClusterRepository

logger = logging.getLogger(__name__)


def jaccard_similarity(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 0.0
    intersection = a & b
    union = a | b
    return len(intersection) / len(union) if union else 0.0


def generate_cluster_title(shared_signals: list[str], endpoint_count: int) -> str:
    signal_labels = {
        "status_mismatch": "status errors",
        "latency_spike": "latency spikes",
        "schema_drift": "schema drift",
        "security_finding": "security findings",
        "contract_violation": "contract violations",
        "ai_anomaly": "AI anomalies",
    }
    labels = [signal_labels.get(s, s) for s in shared_signals[:3]]
    signal_text = ", ".join(labels) if labels else "correlated failures"
    return f"Cascading failure: {signal_text} across {endpoint_count} endpoints"


class ClusterService:
    def __init__(self, repo: ClusterRepository) -> None:
        self._repo = repo

    async def detect_and_assign(
        self,
        new_incident: Incident,
        signal_flags: list[str],
        tenant_id: uuid.UUID,
    ) -> IncidentCluster | None:
        """Auto-detect cluster for a newly created incident."""
        if not signal_flags:
            return None

        # Find recent open incidents on OTHER endpoints within 15 min window
        candidates = await self._repo.get_recent_open_incidents(
            tenant_id, window_minutes=15, exclude_endpoint_id=new_incident.endpoint_id
        )

        if not candidates:
            return None

        new_signals = set(signal_flags)
        matching_incidents = []

        for candidate in candidates:
            # Get candidate's signal flags from fingerprint cache or incident events
            candidate_signals = await self._get_signal_flags(candidate)
            if not candidate_signals:
                continue
            similarity = jaccard_similarity(new_signals, set(candidate_signals))
            if similarity >= 0.5:
                matching_incidents.append((candidate, candidate_signals))

        if not matching_incidents:
            return None

        # Check if any matching incident already belongs to an ACTIVE cluster
        existing_cluster = None
        for inc, _ in matching_incidents:
            if inc.cluster_id:
                cluster = await self._repo.get_by_id(inc.cluster_id, tenant_id)
                if cluster and cluster.status == "ACTIVE":
                    existing_cluster = cluster
                    break

        if existing_cluster:
            # Add new incident to existing cluster
            new_incident.cluster_id = existing_cluster.id
            # Update shared signals (intersection of all member signals)
            all_member_signals = [set(existing_cluster.shared_signals)]
            all_member_signals.append(new_signals)
            shared = set.intersection(*all_member_signals) if all_member_signals else set()
            existing_cluster.shared_signals = sorted(shared) if shared else existing_cluster.shared_signals
            member_count = await self._repo.get_member_count(existing_cluster.id)
            existing_cluster.title = generate_cluster_title(existing_cluster.shared_signals, member_count + 1)
            await self._repo.update(existing_cluster)
            logger.info("Added incident %s to existing cluster %s", new_incident.id, existing_cluster.id)
            return existing_cluster
        else:
            # Create new cluster
            all_signals = [new_signals]
            all_signals.extend(set(flags) for _, flags in matching_incidents)
            shared = set.intersection(*all_signals) if all_signals else set()
            shared_list = sorted(shared) if shared else signal_flags

            endpoint_count = len(set(
                [new_incident.endpoint_id] + [inc.endpoint_id for inc, _ in matching_incidents]
            ))

            cluster = IncidentCluster(
                organization_id=tenant_id,
                title=generate_cluster_title(shared_list, endpoint_count),
                shared_signals=shared_list,
                detected_at=datetime.now(timezone.utc),
            )
            cluster = await self._repo.create(cluster)

            # Assign all matching incidents + new incident to cluster
            new_incident.cluster_id = cluster.id
            for inc, _ in matching_incidents:
                if not inc.cluster_id:
                    inc.cluster_id = cluster.id

            logger.info(
                "Created cluster %s with %d incidents: %s",
                cluster.id, endpoint_count, cluster.title,
            )
            return cluster

    async def check_auto_resolve(self, cluster_id: uuid.UUID) -> IncidentCluster | None:
        """Auto-resolve cluster if all member incidents are resolved."""
        is_all_resolved = await self._repo.check_all_resolved(cluster_id)
        if not is_all_resolved:
            return None

        # Need to get the cluster — we don't have tenant_id here, so query directly
        from sqlalchemy import select
        result = await self._repo._session.execute(
            select(IncidentCluster).where(IncidentCluster.id == cluster_id)
        )
        cluster = result.scalar_one_or_none()
        if cluster and cluster.status == "ACTIVE":
            cluster.status = "RESOLVED"
            cluster.resolved_at = datetime.now(timezone.utc)
            await self._repo.update(cluster)
            logger.info("Auto-resolved cluster %s", cluster.id)
            return cluster
        return None

    async def _get_signal_flags(self, incident: Incident) -> list[str]:
        """Extract signal flags from incident's fingerprint cache."""
        if not incident.fingerprint:
            return []
        from app.models.fingerprint_cache import IncidentFingerprintCache
        from sqlalchemy import select
        result = await self._repo._session.execute(
            select(IncidentFingerprintCache.signal_flags).where(
                IncidentFingerprintCache.fingerprint == incident.fingerprint,
                IncidentFingerprintCache.endpoint_id == incident.endpoint_id,
            )
        )
        row = result.scalar_one_or_none()
        return row if row else []
