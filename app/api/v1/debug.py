"""
Debug Assistant API — AI-powered debugging suggestions for endpoints.

Endpoints:
  POST /debug/{endpoint_id}/suggest  → trigger AI debug analysis
  GET  /debug/{endpoint_id}/latest   → cached latest suggestion
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, TenantId
from app.db.session import get_session
from app.services.debug_assistant import generate_debug_suggestions

router = APIRouter(prefix="/debug", tags=["debug"])


class DebugSuggestionResponse(BaseModel):
    diagnosis: str
    steps: list[str]
    likely_root_cause: str
    severity_assessment: str
    related_patterns: list[str]


# In-memory cache: {(tenant_id, endpoint_id): suggestion_dict}
_latest_cache: dict[tuple[str, str], dict] = {}


@router.post(
    "/{endpoint_id}/suggest",
    response_model=DebugSuggestionResponse,
)
async def trigger_debug_analysis(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
    session: AsyncSession = Depends(get_session),
):
    """Trigger AI debug analysis for an endpoint. Returns suggestions."""
    result = await generate_debug_suggestions(endpoint_id, tenant_id, session)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI debug assistant unavailable — LLM not configured or call failed",
        )

    # Cache the result
    cache_key = (str(tenant_id), str(endpoint_id))
    _latest_cache[cache_key] = result

    return DebugSuggestionResponse(
        diagnosis=result.get("diagnosis", ""),
        steps=result.get("steps", []),
        likely_root_cause=result.get("likely_root_cause", ""),
        severity_assessment=result.get("severity_assessment", ""),
        related_patterns=result.get("related_patterns", []),
    )


@router.get(
    "/{endpoint_id}/latest",
    response_model=DebugSuggestionResponse | None,
)
async def get_latest_suggestion(
    endpoint_id: uuid.UUID,
    user: CurrentUser,
    tenant_id: TenantId,
):
    """Return the cached latest debug suggestion for an endpoint."""
    cache_key = (str(tenant_id), str(endpoint_id))
    result = _latest_cache.get(cache_key)

    if result is None:
        return None

    return DebugSuggestionResponse(
        diagnosis=result.get("diagnosis", ""),
        steps=result.get("steps", []),
        likely_root_cause=result.get("likely_root_cause", ""),
        severity_assessment=result.get("severity_assessment", ""),
        related_patterns=result.get("related_patterns", []),
    )
