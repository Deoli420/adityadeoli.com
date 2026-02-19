from typing import Any

from fastapi import APIRouter, Depends

from app.alerts.webhook import webhook_client
from app.core.auth import CurrentUser, require_role
from app.core.config import settings
from app.models.user import UserRole

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get(
    "/config",
    summary="Get alert system configuration and status",
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def get_alert_config() -> dict[str, Any]:
    """
    Return the current alert/webhook configuration.

    Useful for debugging webhook connectivity and verifying
    that the alert system is properly configured.
    """
    return {
        "webhook_enabled": settings.WEBHOOK_ENABLED,
        "webhook_url_configured": bool(settings.WEBHOOK_URL),
        "webhook_client_available": webhook_client.available,
        "webhook_timeout_seconds": settings.WEBHOOK_TIMEOUT_SECONDS,
        "alert_min_risk_level": settings.ALERT_MIN_RISK_LEVEL,
    }


@router.post(
    "/test",
    summary="Send a test webhook to verify connectivity",
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
async def test_webhook() -> dict[str, Any]:
    """
    Send a test payload to the configured webhook URL.

    Returns whether the webhook was delivered successfully.
    Use this to verify n8n connectivity before relying on real alerts.
    """
    if not webhook_client.available:
        return {
            "success": False,
            "reason": "Webhook client not available. "
                      "Set WEBHOOK_ENABLED=true and WEBHOOK_URL.",
        }

    test_payload = {
        "event": "sentinel_test",
        "message": "This is a test alert from SentinelAI.",
        "webhook_url": settings.WEBHOOK_URL,
    }

    delivered = await webhook_client.send(test_payload)

    return {
        "success": delivered,
        "payload_sent": test_payload,
    }
