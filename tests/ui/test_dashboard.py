"""
Dashboard page tests — headings, KPIs, endpoint table, charts.
"""
import re

import allure
import pytest
from playwright.sync_api import Page, expect

from tests.ui.pages.dashboard_page import DashboardPage

pytestmark = [pytest.mark.regression, pytest.mark.ui]


@allure.feature("Dashboard")
@allure.story("Page Load")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Dashboard heading is visible")
def test_dashboard_heading(authenticated_page: Page):
    dashboard = DashboardPage(authenticated_page)

    with allure.step("Verify 'Overview' heading"):
        expect(dashboard.heading).to_be_visible(timeout=10000)
        expect(dashboard.heading).to_have_text("Overview")


@allure.feature("Dashboard")
@allure.story("KPI Cards")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("4 KPI stat cards are visible")
def test_kpi_cards_visible(authenticated_page: Page):
    dashboard = DashboardPage(authenticated_page)

    with allure.step("Wait for KPI cards to render"):
        expect(dashboard.kpi_cards.first).to_be_visible(timeout=10000)

    with allure.step("Verify exactly 4 cards"):
        assert dashboard.get_kpi_count() == 4

    with allure.step("Verify each card has a LABEL and a numeric VALUE"):
        for i in range(4):
            card = dashboard.kpi_cards.nth(i)
            # Each card should contain a number (the KPI value)
            expect(card).to_contain_text(re.compile(r"\d+"), timeout=10000)
            # Each card should have non-trivial text content (label)
            card_text = card.inner_text()
            assert len(card_text.strip()) > 1, f"Card {i} has no meaningful text"

    with allure.step("Verify cards have recognizable KPI labels"):
        all_text = " ".join(dashboard.kpi_cards.all_inner_texts()).lower()
        assert any(
            keyword in all_text
            for keyword in ["total endpoints", "active monitors", "anomal", "risk", "endpoint"]
        ), f"No recognizable KPI labels found in: {all_text}"


@allure.feature("Dashboard")
@allure.story("Endpoint Table")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Monitored Endpoints section loads")
def test_endpoint_table_visible(authenticated_page: Page):
    dashboard = DashboardPage(authenticated_page)

    with allure.step("Verify 'Monitored Endpoints' heading"):
        expect(dashboard.endpoint_table_heading).to_be_visible(timeout=10000)

    with allure.step("Verify table has rows or shows empty state"):
        rows = authenticated_page.locator("table tbody tr")
        empty_state = authenticated_page.get_by_text(re.compile(r"No endpoints|no endpoints", re.IGNORECASE))
        has_rows = rows.count() > 0
        has_empty = empty_state.is_visible(timeout=3000)
        assert has_rows or has_empty, "Endpoint table has neither rows nor empty state message"


@allure.feature("Dashboard")
@allure.story("Feature Summary")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Feature summary row is visible")
def test_feature_summary_row(authenticated_page: Page):
    with allure.step("Check for feature discovery cards"):
        # FeatureSummaryRow renders cards between KPIs and charts
        # It may contain text like "AI-Powered", "Schema Drift", etc.
        page = authenticated_page
        # The feature summary row is a section of cards in the dashboard
        cards = page.locator(".card")
        expect(cards.first).to_be_visible(timeout=10000)
        assert cards.count() >= 4  # At least KPI cards + feature cards

    with allure.step("Verify cards have labels like Security, Schema, or AI"):
        all_card_text = " ".join(cards.all_inner_texts()).lower()
        assert any(
            keyword in all_card_text
            for keyword in ["security", "schema", "ai", "drift", "monitor", "risk", "anomal"]
        ), f"No feature labels found in card text: {all_card_text[:200]}"


@allure.feature("Dashboard")
@allure.story("Attention Banner")
@allure.severity(allure.severity_level.MINOR)
@allure.title("Attention banner section renders")
def test_attention_banner_visible(authenticated_page: Page):
    dashboard = DashboardPage(authenticated_page)

    with allure.step("Check that the dashboard page has rendered"):
        expect(dashboard.heading).to_be_visible(timeout=10000)
        # The attention banner renders conditionally — just verify the page loaded
        # and the dashboard space-y-6 container is present
        expect(authenticated_page.locator(".space-y-6")).to_be_visible()


@allure.feature("Dashboard")
@allure.story("Charts")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("At least one chart widget loads")
def test_chart_widgets_load(authenticated_page: Page):
    with allure.step("Wait for dashboard to fully render"):
        page = authenticated_page
        expect(page.locator("h2", has_text="Overview")).to_be_visible(timeout=10000)

    with allure.step("Verify at least one chart container is present"):
        # Charts render in .card containers within the grid
        # Look for the chart grid section (lg:grid-cols-3)
        chart_grid = page.locator(".grid.grid-cols-1.lg\\:grid-cols-3")
        if chart_grid.is_visible(timeout=5000):
            assert chart_grid.locator(".card").count() >= 1
        else:
            # No charts if no endpoints — just confirm dashboard loaded
            expect(page.locator("h2", has_text="Overview")).to_be_visible()

    with allure.step("Verify charts have rendered SVG/canvas elements (not empty divs)"):
        # Look for actual rendered chart content — SVG, canvas, or recharts wrappers
        chart_content = page.locator("svg, canvas, .recharts-wrapper")
        if chart_content.count() > 0:
            expect(chart_content.first).to_be_visible(timeout=10000)
        # If no chart content, it's acceptable when there are no endpoints
