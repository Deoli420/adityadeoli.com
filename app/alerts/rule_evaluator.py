"""
Rule evaluator — checks each active alert rule against the latest pipeline result.

For each active rule on the endpoint:
  1. Evaluate the condition (latency, failure, status code, drift, risk, SLA).
  2. If the condition matches, increment the consecutive counter.
  3. If consecutive counter >= required count, trigger the rule (fire webhook + reset).
  4. If the condition does NOT match, reset the consecutive counter.

This module is called by the scheduler after each pipeline run.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.alerts.webhook import webhook_client
from app.models.alert_rule import AlertRule
from app.monitoring.runner_service import PipelineResult
from app.repositories.alert_rule import AlertRuleRepository

logger = logging.getLogger(__name__)


class RuleEvaluator:
    """Evaluate all active alert rules for a given endpoint against a pipeline result."""

    def __init__(self, session: AsyncSession) -> None:
        self._repo = AlertRuleRepository(session)

    async def evaluate(
        self,
        endpoint_id: "uuid.UUID",
        pipeline: PipelineResult,
        tenant_id: "uuid.UUID",
    ) -> list[dict[str, Any]]:
        """
        Evaluate all active rules for endpoint_id.

        Returns a list of result dicts for logging/debugging.
        This method **never raises**.
        """
        import uuid as _uuid  # avoid name clash with parameter annotation

        results: list[dict[str, Any]] = []

        try:
            rules = await self._repo.get_active_rules_for_endpoint(endpoint_id)
        except Exception:
            logger.exception("Failed to load alert rules for endpoint %s", endpoint_id)
            return results

        for rule in rules:
            try:
                result = await self._evaluate_single(rule, pipeline, tenant_id)
                results.append(result)
            except Exception:
                logger.exception("Rule evaluation failed for rule %s", rule.id)
                results.append({"rule_id": str(rule.id), "error": True})

        return results

    async def _evaluate_single(
        self,
        rule: AlertRule,
        pipeline: PipelineResult,
        tenant_id: "uuid.UUID",
    ) -> dict[str, Any]:
        """Evaluate a single rule and manage its consecutive counter."""
        condition_met = self._check_condition(rule, pipeline, tenant_id)

        if condition_met:
            rule.current_consecutive += 1

            if rule.current_consecutive >= rule.consecutive_count:
                # Threshold met — trigger the rule
                await self._trigger(rule, pipeline)
                rule.last_triggered_at = datetime.now(timezone.utc)
                rule.current_consecutive = 0
                await self._repo.update(rule)
                return {
                    "rule_id": str(rule.id),
                    "name": rule.name,
                    "triggered": True,
                    "condition_type": rule.condition_type,
                }
            else:
                await self._repo.update(rule)
                return {
                    "rule_id": str(rule.id),
                    "name": rule.name,
                    "triggered": False,
                    "consecutive": f"{rule.current_consecutive}/{rule.consecutive_count}",
                }
        else:
            if rule.current_consecutive > 0:
                rule.current_consecutive = 0
                await self._repo.update(rule)
            return {
                "rule_id": str(rule.id),
                "name": rule.name,
                "triggered": False,
                "condition_met": False,
            }

    def _check_condition(
        self,
        rule: AlertRule,
        pipeline: PipelineResult,
        tenant_id: "uuid.UUID",
    ) -> bool:
        """Return True if the rule's condition is currently met."""
        ct = rule.condition_type
        run = pipeline.run

        if ct == "LATENCY_ABOVE":
            return (run.response_time_ms or 0) > rule.threshold

        if ct == "FAILURE_COUNT":
            # Condition met when run is NOT successful
            return not run.is_success

        if ct == "STATUS_CODE":
            return run.status_code == int(rule.threshold)

        if ct == "SCHEMA_CHANGE":
            drift = pipeline.schema_drift
            return drift is not None and drift.has_drift

        if ct == "RISK_ABOVE":
            risk = pipeline.risk
            return risk is not None and risk.calculated_score > rule.threshold

        if ct == "SLA_BREACH":
            # SLA breach is handled separately in _check_sla_breach;
            # here we just check if the run failed (proxy for breach contribution)
            return not run.is_success

        if ct == "CREDENTIAL_LEAK":
            scan = pipeline.security_scan
            return scan is not None and scan.has_findings

        logger.warning("Unknown condition_type: %s", ct)
        return False

    async def _trigger(self, rule: AlertRule, pipeline: PipelineResult) -> None:
        """Send webhook for a triggered rule."""
        if not webhook_client.available:
            logger.debug("Webhook unavailable; skipping rule trigger for %s", rule.name)
            return

        payload: dict[str, Any] = {
            "event": "alert_rule_triggered",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "rule": {
                "id": str(rule.id),
                "name": rule.name,
                "condition_type": rule.condition_type,
                "threshold": rule.threshold,
                "consecutive_count": rule.consecutive_count,
            },
            "endpoint": {
                "id": str(pipeline.run.endpoint_id),
                "name": pipeline.endpoint_name,
                "url": pipeline.endpoint_url,
                "method": pipeline.endpoint_method,
            },
            "run": {
                "id": str(pipeline.run.id),
                "status_code": pipeline.run.status_code,
                "response_time_ms": pipeline.run.response_time_ms,
                "is_success": pipeline.run.is_success,
            },
        }

        if pipeline.risk:
            payload["risk"] = {
                "score": pipeline.risk.calculated_score,
                "level": pipeline.risk.risk_level,
            }

        logger.info(
            "Alert rule triggered: %s (%s > %s) for %s",
            rule.name,
            rule.condition_type,
            rule.threshold,
            pipeline.endpoint_name,
        )

        await webhook_client.send(payload)
