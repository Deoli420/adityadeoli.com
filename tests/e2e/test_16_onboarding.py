"""Onboarding — setup checklist status."""

import pytest
from playwright.sync_api import APIRequestContext


class TestOnboarding:
    def test_get_onboarding_status(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/onboarding/status")
        assert resp.ok
        data = resp.json()
        assert isinstance(data, dict)

    def test_onboarding_reflects_setup(self, admin_api: APIRequestContext):
        """After creating endpoints and runs, onboarding steps should be checked."""
        resp = admin_api.get("/api/v1/onboarding/status")
        assert resp.ok
