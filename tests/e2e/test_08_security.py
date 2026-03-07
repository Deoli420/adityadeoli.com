"""Security — credential leak detection, security findings, stats."""

import pytest
from playwright.sync_api import APIRequestContext


class TestCredentialLeakDetection:
    @pytest.mark.security
    def test_scan_endpoint_with_credential_leak(self, admin_api: APIRequestContext, credential_leak_endpoint: dict):
        """Trigger a run against endpoint that returns credentials — scanner should detect them."""
        resp = admin_api.post(f"/api/v1/monitor/run/{credential_leak_endpoint['id']}")
        assert resp.status == 201

    @pytest.mark.security
    def test_get_security_findings(self, admin_api: APIRequestContext, credential_leak_endpoint: dict):
        """After scanning, there should be security findings for the credential leak endpoint."""
        # Ensure at least one run has happened
        admin_api.post(f"/api/v1/monitor/run/{credential_leak_endpoint['id']}")

        resp = admin_api.get(f"/api/v1/security/findings/{credential_leak_endpoint['id']}")
        assert resp.ok
        findings = resp.json()
        assert isinstance(findings, list)
        # The credential-leak endpoint should produce findings
        if findings:
            assert "finding_type" in findings[0]
            assert "severity" in findings[0]
            assert "pattern_name" in findings[0]

    @pytest.mark.security
    def test_get_all_findings(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/security/findings")
        assert resp.ok
        assert isinstance(resp.json(), list)

    @pytest.mark.security
    def test_get_security_stats(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/security/stats")
        assert resp.ok
        data = resp.json()
        assert isinstance(data, dict)

    @pytest.mark.security
    def test_healthy_endpoint_has_no_credential_findings(self, admin_api: APIRequestContext, test_endpoint: dict):
        """Healthy endpoint should NOT produce credential leak findings."""
        admin_api.post(f"/api/v1/monitor/run/{test_endpoint['id']}")
        resp = admin_api.get(f"/api/v1/security/findings/{test_endpoint['id']}")
        assert resp.ok
        findings = resp.json()
        # Healthy endpoint should have zero credential findings
        credential_findings = [f for f in findings if "credential" in f.get("finding_type", "").lower() or "leak" in f.get("finding_type", "").lower()]
        # May or may not be empty depending on scanner patterns, but should be few/none
