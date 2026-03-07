"""Incidents — create, status transitions, notes, timeline."""

import pytest
from playwright.sync_api import APIRequestContext


class TestIncidentCrud:
    @pytest.mark.crud
    def test_create_manual_incident(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.post("/api/v1/incidents", data={
            "endpoint_id": test_endpoint["id"],
            "title": "E2E Test Incident",
            "severity": "MEDIUM",
            "trigger_type": "manual",
            "notes": "Created by E2E test suite",
            "auto_resolve_after": 5,
        })
        assert resp.status == 201
        data = resp.json()
        assert data["title"] == "E2E Test Incident"
        assert data["status"] == "OPEN"
        assert data["severity"] == "MEDIUM"
        assert data["trigger_type"] == "manual"

    @pytest.mark.crud
    def test_create_high_severity_incident(self, admin_api: APIRequestContext, test_endpoint: dict):
        resp = admin_api.post("/api/v1/incidents", data={
            "endpoint_id": test_endpoint["id"],
            "title": "Critical Outage",
            "severity": "CRITICAL",
        })
        assert resp.status == 201
        assert resp.json()["severity"] == "CRITICAL"

    @pytest.mark.crud
    def test_list_incidents(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/incidents/")
        assert resp.ok
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.crud
    def test_list_incidents_filter_by_status(self, admin_api: APIRequestContext):
        resp = admin_api.get("/api/v1/incidents/?status=OPEN")
        assert resp.ok
        for incident in resp.json():
            assert incident["status"] == "OPEN"

    @pytest.mark.crud
    def test_get_incident_detail(self, admin_api: APIRequestContext):
        incidents = admin_api.get("/api/v1/incidents/").json()
        if incidents:
            resp = admin_api.get(f"/api/v1/incidents/{incidents[0]['id']}")
            assert resp.ok
            assert "title" in resp.json()
            assert "status" in resp.json()


class TestIncidentStatusTransitions:
    @pytest.mark.crud
    def test_transition_to_investigating(self, admin_api: APIRequestContext, test_endpoint: dict):
        create = admin_api.post("/api/v1/incidents", data={
            "endpoint_id": test_endpoint["id"],
            "title": "Status Transition Test",
            "severity": "LOW",
        })
        assert create.status == 201
        iid = create.json()["id"]

        resp = admin_api.patch(f"/api/v1/incidents/{iid}/status", data={"status": "INVESTIGATING"})
        assert resp.ok
        assert resp.json()["status"] == "INVESTIGATING"
        assert resp.json()["acknowledged_at"] is not None

    @pytest.mark.crud
    def test_transition_to_resolved(self, admin_api: APIRequestContext, test_endpoint: dict):
        create = admin_api.post("/api/v1/incidents", data={
            "endpoint_id": test_endpoint["id"],
            "title": "Resolve Test",
            "severity": "LOW",
        })
        iid = create.json()["id"]

        admin_api.patch(f"/api/v1/incidents/{iid}/status", data={"status": "INVESTIGATING"})
        resp = admin_api.patch(f"/api/v1/incidents/{iid}/status", data={"status": "RESOLVED"})
        assert resp.ok
        assert resp.json()["status"] == "RESOLVED"
        assert resp.json()["resolved_at"] is not None


class TestIncidentNotes:
    @pytest.mark.crud
    def test_add_note_to_incident(self, admin_api: APIRequestContext, test_endpoint: dict):
        create = admin_api.post("/api/v1/incidents", data={
            "endpoint_id": test_endpoint["id"],
            "title": "Notes Test",
            "severity": "LOW",
        })
        iid = create.json()["id"]

        resp = admin_api.post(f"/api/v1/incidents/{iid}/notes", data={
            "note": "Investigation started — checking logs",
        })
        assert resp.ok


class TestIncidentTimeline:
    @pytest.mark.crud
    def test_get_incident_timeline(self, admin_api: APIRequestContext, test_endpoint: dict):
        create = admin_api.post("/api/v1/incidents", data={
            "endpoint_id": test_endpoint["id"],
            "title": "Timeline Test",
            "severity": "MEDIUM",
        })
        iid = create.json()["id"]

        # Add some events
        admin_api.patch(f"/api/v1/incidents/{iid}/status", data={"status": "INVESTIGATING"})
        admin_api.post(f"/api/v1/incidents/{iid}/notes", data={"note": "Looking into it"})

        resp = admin_api.get(f"/api/v1/incidents/{iid}/timeline")
        assert resp.ok
        events = resp.json()
        assert isinstance(events, list)
        assert len(events) >= 2  # created + status change
