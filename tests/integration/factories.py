"""Test data factories -- generate valid payloads with sensible defaults."""
import uuid


def endpoint_payload(**overrides) -> dict:
    defaults = {
        "name": f"Test API {uuid.uuid4().hex[:6]}",
        "url": "https://api.example.com/health",
        "method": "GET",
        "expected_status": 200,
        "monitoring_interval_seconds": 300,
    }
    defaults.update(overrides)
    return defaults


def incident_payload(endpoint_id: str, **overrides) -> dict:
    defaults = {
        "endpoint_id": endpoint_id,
        "title": f"Test Incident {uuid.uuid4().hex[:6]}",
        "severity": "MEDIUM",
        "trigger_type": "manual",
    }
    defaults.update(overrides)
    return defaults


def alert_rule_payload(endpoint_id: str, **overrides) -> dict:
    defaults = {
        "endpoint_id": endpoint_id,
        "name": f"Test Rule {uuid.uuid4().hex[:6]}",
        "condition_type": "LATENCY_ABOVE",
        "threshold": 1000.0,
    }
    defaults.update(overrides)
    return defaults


def sla_payload(endpoint_id: str, **overrides) -> dict:
    defaults = {
        "endpoint_id": endpoint_id,
        "sla_target_percent": 99.9,
        "uptime_window": "24h",
    }
    defaults.update(overrides)
    return defaults


def invite_payload(**overrides) -> dict:
    defaults = {
        "email": f"invite-{uuid.uuid4().hex[:6]}@test.com",
        "role": "MEMBER",
    }
    defaults.update(overrides)
    return defaults
