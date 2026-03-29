"""
Smoke tests — the 5 most critical UI flows.
If any of these fail, the app is fundamentally broken.
"""
import re

import allure
import pytest
from playwright.sync_api import Page, expect

from tests.ui.conftest import BASE_URL, TEST_EMAIL, TEST_PASSWORD, TEST_ORG_SLUG
from tests.ui.pages.login_page import LoginPage
from tests.ui.pages.dashboard_page import DashboardPage
from tests.ui.pages.sidebar import Sidebar

pytestmark = [pytest.mark.smoke, pytest.mark.ui]


@allure.feature("Smoke")
@allure.story("Login")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Login via UI form and see dashboard")
def test_login_and_see_dashboard(page: Page):
    login = LoginPage(page)
    dashboard = DashboardPage(page)
    sidebar = Sidebar(page)

    with allure.step("Navigate to login page"):
        login.goto()
        expect(login.heading).to_be_visible()

    with allure.step("Fill in credentials and submit"):
        login.login(TEST_EMAIL, TEST_PASSWORD, TEST_ORG_SLUG)

    with allure.step("Verify dashboard heading is visible"):
        expect(dashboard.heading).to_be_visible(timeout=10000)

    with allure.step("Verify URL changed to dashboard"):
        expect(page).to_have_url(re.compile(r"/$"), timeout=10000)

    with allure.step("Verify sidebar is visible"):
        expect(sidebar.nav).to_be_visible(timeout=10000)

    with allure.step("Verify user identity appears on page"):
        # The user display name or role should appear somewhere (sidebar user section)
        expect(page.locator("body")).to_contain_text("OWNER", timeout=10000)

    with allure.step("Verify data loaded — at least one 'endpoint' reference"):
        expect(page.locator("text=ndpoint").first).to_be_visible(timeout=10000)


@allure.feature("Smoke")
@allure.story("Dashboard KPIs")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Dashboard KPI cards render")
def test_dashboard_kpis_render(authenticated_page: Page):
    dashboard = DashboardPage(authenticated_page)

    with allure.step("Verify KPI cards are visible"):
        expect(dashboard.kpi_cards.first).to_be_visible(timeout=10000)
        count = dashboard.get_kpi_count()
        assert count >= 4, f"Expected at least 4 KPI cards, got {count}"

    with allure.step("Verify KPI cards contain numeric values"):
        first_card = dashboard.kpi_cards.first
        expect(first_card).to_contain_text(re.compile(r"\d+"), timeout=10000)

    with allure.step("Verify KPI cards have recognizable labels"):
        all_kpi_text = dashboard.kpi_cards.all_inner_texts()
        combined = " ".join(all_kpi_text).lower()
        assert any(
            keyword in combined
            for keyword in ["total endpoints", "active monitors", "anomal", "risk", "endpoint"]
        ), f"KPI labels not found in: {combined}"


@allure.feature("Smoke")
@allure.story("Navigation")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Sidebar navigation to Incidents")
def test_sidebar_navigation_to_incidents(authenticated_page: Page):
    sidebar = Sidebar(authenticated_page)

    with allure.step("Click Incidents in sidebar"):
        sidebar.click_nav("Incidents")

    with allure.step("Verify Incidents page loaded"):
        expect(authenticated_page).to_have_url(re.compile(r"/incidents"), timeout=10000)
        expect(authenticated_page.get_by_text("Incidents").first).to_be_visible(timeout=10000)

    with allure.step("Verify content loaded — incidents or empty state"):
        # Wait for API data to load
        authenticated_page.wait_for_timeout(2000)
        body_text = authenticated_page.locator("body").inner_text()
        assert "Incidents" in body_text, "Incidents page didn't load"


@allure.feature("Smoke")
@allure.story("Navigation")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Sidebar navigation to Security")
def test_sidebar_navigation_to_security(authenticated_page: Page):
    sidebar = Sidebar(authenticated_page)

    with allure.step("Click Security in sidebar"):
        sidebar.click_nav("Security")

    with allure.step("Verify Security page loaded"):
        expect(authenticated_page).to_have_url(re.compile(r"/security"), timeout=10000)
        expect(authenticated_page.get_by_text("Security").first).to_be_visible(timeout=10000)

    with allure.step("Verify security content loaded"):
        authenticated_page.wait_for_timeout(2000)
        body_text = authenticated_page.locator("body").inner_text()
        assert "Security" in body_text, "Security page didn't load"


@allure.feature("Smoke")
@allure.story("Logout")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Logout returns to login page")
def test_logout_returns_to_login(authenticated_page: Page):
    sidebar = Sidebar(authenticated_page)

    with allure.step("Click logout"):
        # Click the Sign out button — might need to expand sidebar first
        logout_btn = authenticated_page.locator("[aria-label='Sign out']")
        if logout_btn.is_visible(timeout=3000):
            logout_btn.click()
        else:
            # Try clicking by title attribute
            authenticated_page.locator("[title='Sign out']").click()

    with allure.step("Verify redirected to login page"):
        expect(authenticated_page).to_have_url(re.compile(r"/login"), timeout=10000)
        expect(authenticated_page.locator("#email")).to_be_visible(timeout=10000)
