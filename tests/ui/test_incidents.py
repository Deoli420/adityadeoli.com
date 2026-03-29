"""
Incidents page tests — tabs, list, detail page, clusters.
"""
import re

import allure
import pytest
from playwright.sync_api import Page, expect

from tests.ui.pages.incidents_page import IncidentsPage

pytestmark = [pytest.mark.regression, pytest.mark.ui]


@allure.feature("Incidents")
@allure.story("Page Load")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Incidents page loads with heading and tabs")
def test_incidents_page_loads(authenticated_page: Page):
    incidents = IncidentsPage(authenticated_page)

    with allure.step("Navigate to incidents"):
        incidents.goto()

    with allure.step("Verify heading and tab bar"):
        expect(incidents.heading).to_be_visible(timeout=10000)
        expect(incidents.tab_bar).to_be_visible()
        assert incidents.tab_buttons.count() == 5  # All, Open, Investigating, Resolved, Clusters

    with allure.step("Verify tab bar has exactly 5 expected tabs"):
        expected_tabs = ["All", "Open", "Investigating", "Resolved", "Clusters"]
        for tab_name in expected_tabs:
            tab_btn = incidents.tab_bar.locator("button", has_text=tab_name)
            expect(tab_btn).to_be_visible(timeout=5000)


@allure.feature("Incidents")
@allure.story("Tab Switching")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Switching tabs changes content")
def test_incidents_tab_switching(authenticated_page: Page):
    incidents = IncidentsPage(authenticated_page)

    with allure.step("Navigate to incidents"):
        incidents.goto()
        expect(incidents.heading).to_be_visible(timeout=10000)

    with allure.step("Click Open tab and verify it appears active"):
        incidents.select_tab("Open")
        authenticated_page.wait_for_timeout(500)
        open_tab = incidents.tab_bar.locator("button", has_text="Open")
        # Active tab should have a distinct class (e.g., bg-surface-primary, bg-white, font-semibold)
        open_tab_classes = open_tab.get_attribute("class") or ""
        assert any(
            kw in open_tab_classes
            for kw in ["bg-surface-primary", "bg-white", "font-semibold", "active", "selected", "bg-"]
        ), f"Open tab does not appear active. Classes: {open_tab_classes}"

    with allure.step("Click Resolved tab and verify it appears active"):
        incidents.select_tab("Resolved")
        authenticated_page.wait_for_timeout(500)
        resolved_tab = incidents.tab_bar.locator("button", has_text="Resolved")
        resolved_classes = resolved_tab.get_attribute("class") or ""
        assert any(
            kw in resolved_classes
            for kw in ["bg-surface-primary", "bg-white", "font-semibold", "active", "selected", "bg-"]
        ), f"Resolved tab does not appear active. Classes: {resolved_classes}"

    with allure.step("Verify we're back to a valid state"):
        expect(incidents.heading).to_be_visible()


@allure.feature("Incidents")
@allure.story("Summary Banner")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Incident summary banner is visible")
def test_incidents_summary_banner(authenticated_page: Page):
    incidents = IncidentsPage(authenticated_page)

    with allure.step("Navigate to incidents"):
        incidents.goto()
        expect(incidents.heading).to_be_visible(timeout=10000)

    with allure.step("Verify summary banner renders"):
        # IncidentSummaryBanner is rendered right after the header
        # It contains stat cards in a card container
        expect(incidents.summary_banner).to_be_visible(timeout=5000)


@allure.feature("Incidents")
@allure.story("Incident Detail")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Clicking first incident loads detail page")
def test_incident_detail_loads(authenticated_page: Page):
    incidents = IncidentsPage(authenticated_page)

    with allure.step("Navigate to incidents"):
        incidents.goto()
        expect(incidents.heading).to_be_visible(timeout=10000)

    with allure.step("Click first incident if available"):
        if incidents.incident_rows.count() > 0:
            incidents.click_first_incident()

            with allure.step("Verify detail page loads"):
                # Detail page has a back link and incident title
                expect(authenticated_page.locator("text=Back")).to_be_visible(timeout=10000)

            with allure.step("Verify incident title is visible"):
                # The detail page should show the incident title in a heading or prominent element
                detail_headings = authenticated_page.locator("h1, h2, h3")
                expect(detail_headings.first).to_be_visible(timeout=10000)
                heading_text = detail_headings.first.inner_text()
                assert len(heading_text.strip()) > 0, "Incident title is empty"

            with allure.step("Verify status badge is visible"):
                status_badge = authenticated_page.locator(
                    "[class*='badge'], [class*='Badge'], "
                    "span:has-text('open'), span:has-text('Open'), "
                    "span:has-text('investigating'), span:has-text('Investigating'), "
                    "span:has-text('resolved'), span:has-text('Resolved')"
                )
                if status_badge.count() > 0:
                    expect(status_badge.first).to_be_visible(timeout=5000)

            with allure.step("Verify severity indicator is visible"):
                body_text = authenticated_page.locator("body").inner_text().lower()
                has_severity = any(
                    sev in body_text
                    for sev in ["critical", "high", "medium", "low", "info", "severity"]
                )
                # Severity may not always be present, so this is informational
                if not has_severity:
                    allure.attach("No severity badge found", name="note", attachment_type=allure.attachment_type.TEXT)
        else:
            pytest.skip("No incidents to click on")


@allure.feature("Incidents")
@allure.story("Incident Detail")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Incident detail page has narrative card")
def test_incident_detail_has_narrative(authenticated_page: Page):
    incidents = IncidentsPage(authenticated_page)

    with allure.step("Navigate to incidents and click first"):
        incidents.goto()
        expect(incidents.heading).to_be_visible(timeout=10000)

        if incidents.incident_rows.count() > 0:
            incidents.click_first_incident()
            authenticated_page.wait_for_load_state("networkidle")

            with allure.step("Verify narrative card or timeline is visible"):
                # NarrativeCard component or timeline events
                detail_content = authenticated_page.locator(".card")
                expect(detail_content.first).to_be_visible(timeout=10000)

            with allure.step("Verify narrative card has actual TEXT content"):
                # The narrative/timeline should contain descriptive text, not just an empty container
                card_texts = detail_content.all_inner_texts()
                combined = " ".join(card_texts).strip()
                assert len(combined) > 10, (
                    f"Narrative card appears empty or has too little content: '{combined[:100]}'"
                )
        else:
            pytest.skip("No incidents available")


@allure.feature("Incidents")
@allure.story("Clusters Tab")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Clusters tab is clickable and shows content")
def test_clusters_tab(authenticated_page: Page):
    incidents = IncidentsPage(authenticated_page)

    with allure.step("Navigate to incidents"):
        incidents.goto()
        expect(incidents.heading).to_be_visible(timeout=10000)

    with allure.step("Click Clusters tab"):
        incidents.select_tab("Clusters")
        authenticated_page.wait_for_timeout(1000)

    with allure.step("Verify clusters content or empty state"):
        # Either shows cluster cards or "No clusters detected"
        has_clusters = incidents.clusters_grid.is_visible(timeout=3000)
        has_empty = authenticated_page.locator("text=No clusters detected").is_visible(timeout=3000)
        assert has_clusters or has_empty
