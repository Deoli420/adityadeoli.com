"""
Schema snapshot service — business logic for schema versioning.

Creates a new snapshot only when the schema hash changes, ensuring an
efficient history of structural changes over time.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schema_snapshot import SchemaSnapshot
from app.repositories.schema_snapshot import SchemaSnapshotRepository
from app.utils.schema_diff import (
    _count_fields,
    compute_diff,
    compute_schema_hash,
)

logger = logging.getLogger(__name__)


async def snapshot_if_changed(
    endpoint_id: uuid.UUID,
    org_id: uuid.UUID,
    response_body: dict[str, Any] | None,
    session: AsyncSession,
) -> SchemaSnapshot | None:
    """
    Create a new schema snapshot if the response body's hash differs
    from the latest stored snapshot.

    Returns the new snapshot if created, or ``None`` if no change.
    """
    if response_body is None or not isinstance(response_body, dict):
        return None

    schema_hash = compute_schema_hash(response_body)
    repo = SchemaSnapshotRepository(session)

    latest = await repo.get_latest(endpoint_id, org_id)

    # No change — same hash as the latest snapshot
    if latest is not None and latest.schema_hash == schema_hash:
        logger.debug(
            "Schema unchanged for endpoint %s (hash=%s…)",
            endpoint_id,
            schema_hash[:12],
        )
        return None

    # Compute diff from previous snapshot (if one exists)
    diff_from_previous: dict[str, Any] | None = None
    if latest is not None and isinstance(latest.schema_body, dict):
        diff_result = compute_diff(
            expected=latest.schema_body,
            actual=response_body,
        )
        diff_from_previous = diff_result.to_summary_dict()

    field_count = _count_fields(response_body)

    snapshot = SchemaSnapshot(
        endpoint_id=endpoint_id,
        organization_id=org_id,
        schema_hash=schema_hash,
        schema_body=response_body,
        diff_from_previous=diff_from_previous,
        field_count=field_count,
    )
    saved = await repo.create(snapshot)

    logger.info(
        "Schema snapshot created for endpoint %s (hash=%s… fields=%d diff=%s)",
        endpoint_id,
        schema_hash[:12],
        field_count,
        "yes" if diff_from_previous else "initial",
    )

    return saved
