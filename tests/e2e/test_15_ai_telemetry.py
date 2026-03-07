"""AI Telemetry — LLM usage stats (AI disabled in test env, verify structure)."""

import pytest
from playwright.sync_api import APIRequestContext


class TestAiTelemetry:
    def test_get_telemetry_stats(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/ai-telemetry/stats")
        assert resp.ok
        data = resp.json()
        assert isinstance(data, dict)

    def test_telemetry_requires_auth(self, api: APIRequestContext):
        resp = api.get("/api/v1/ai-telemetry/stats")
        assert resp.status == 401
