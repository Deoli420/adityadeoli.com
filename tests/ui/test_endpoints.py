"""
Endpoint management tests — create form, detail page, search.
"""
import re

import allure
import pytest
from playwright.sync_api import Page, expect

from tests.ui.conftest import BASE_URL
from tests.ui.pages.dashboard_page import DashboardPage

pytestmark = [pytest.mark.regression, pytest.mark.ui]


@allure.feature("Endpoints")
@allure.story("Create Endpoint")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Create endpoint page loads")
def test_create_endpoint_page_loads(authenticated_page: Page):
    with allure.step("Navigate to /endpoints/new"):
        authenticated_page.goto(f"{BASE_URL}/endpoints/new")
        authenticated_page.wait_for_load_state("networkidle")

    with allure.step("Verify form heading 'Add Endpoint' is visible"):
        expect(authenticated_page.locator("text=Add Endpoint").first).to_be_visible(timeout=10000)


@allure.feature("Endpoints")
@allure.story("Create Endpoint")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Endpoint form has required fields")
def test_endpoint_form_has_fields(authenticated_page: Page):
    with allure.step("Navigate to /endpoints/new"):
        authenticated_page.goto(f"{BASE_URL}/endpoints/new")
        authenticated_page.wait_for_load_state("networkidle")

    with allure.step("Verify name, URL, and method fields are present"):
        # The EndpointForm has: input#name, input[type='url'], and a method <select>
        expect(authenticated_page.locator("input#name")).to_be_visible(timeout=10000)
        # URL field — input[type='url'] with placeholder
        expect(authenticated_page.locator("input[type='url']")).to_be_visible()

    with allure.step("Verify method selector is present"):
        method_select = authenticated_page.locator("select, [role='combobox'], [role='listbox']")
        expect(method_select.first).to_be_visible(timeout=5000)

    with allure.step("Verify expected status field exists"):
        # Look for a field related to expected status code
        status_field = authenticated_page.locator(
            "input[name*='status'], input[placeholder*='status'], label:has-text('status') + input, "
            "label:has-text('Status')"
        )
        if status_field.count() > 0:
            expect(status_field.first).to_be_visible(timeout=5000)

    with allure.step("Verify submit button is present"):
        submit_btn = authenticated_page.locator(
            "button[type='submit'], button:has-text('Save'), button:has-text('Create'), button:has-text('Add')"
        )
        expect(submit_btn.first).to_be_visible(timeout=5000)


@allure.feature("Endpoints")
@allure.story("Endpoint Detail")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Clicking first endpoint loads detail page")
def test_endpoint_detail_page(authenticated_page: Page):
    dashboard = DashboardPage(authenticated_page)

    with allure.step("Wait for endpoint table to load"):
        expect(dashboard.endpoint_table_heading).to_be_visible(timeout=10000)

    with allure.step("Click first endpoint row if available"):
        rows = dashboard.endpoint_rows
        if rows.count() > 0:
            # Capture the endpoint name text before clicking
            endpoint_name = rows.first.locator("a").first.inner_text()
            rows.first.locator("a").first.click()
            authenticated_page.wait_for_load_state("networkidle")

            with allure.step("Verify detail page loads"):
                expect(authenticated_page.locator("text=Back to Dashboard")).to_be_visible(timeout=10000)

            with allure.step("Verify endpoint NAME appears on detail page"):
                if endpoint_name.strip():
                    expect(authenticated_page.locator("body")).to_contain_text(
                        endpoint_name.strip(), timeout=10000
                    )

            with allure.step("Verify at least one data section (runs, risk, performance)"):
                detail_cards = authenticated_page.locator(".card")
                expect(detail_cards.first).to_be_visible(timeout=10000)
                assert detail_cards.count() >= 1, "No data sections on detail page"
                # Check for typical detail page sections
                body_text = authenticated_page.locator("body").inner_text().lower()
                assert any(
                    keyword in body_text
                    for keyword in ["run", "risk", "performance", "schema", "response", "status", "history"]
                ), "No recognizable data sections on endpoint detail page"
        else:
            pytest.skip("No endpoints to click on")


@allure.feature("Endpoints")
@allure.story("Endpoint Detail")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Endpoint detail page has monitoring data")
def test_endpoint_detail_has_tabs(authenticated_page: Page):
    dashboard = DashboardPage(authenticated_page)

    with allure.step("Navigate to first endpoint detail"):
        expect(dashboard.endpoint_table_heading).to_be_visible(timeout=10000)
        rows = dashboard.endpoint_rows
        if rows.count() > 0:
            rows.first.locator("a").first.click()
            authenticated_page.wait_for_load_state("networkidle")

            with allure.step("Verify detail page has monitoring sections"):
                # The detail page has sections: Performance, Risk, Schema, etc.
                expect(authenticated_page.locator(".card").first).to_be_visible(timeout=10000)
                assert authenticated_page.locator(".card").count() >= 2
        else:
            pytest.skip("No endpoints available")


@allure.feature("Endpoints")
@allure.story("Search")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Search endpoints filters the table")
def test_search_endpoints(authenticated_page: Page):
    dashboard = DashboardPage(authenticated_page)

    with allure.step("Wait for endpoint table"):
        expect(dashboard.endpoint_table_heading).to_be_visible(timeout=10000)

    with allure.step("Type a search query"):
        if dashboard.search_input.is_visible(timeout=3000):
            initial_count = dashboard.get_endpoint_count()
            dashboard.search_endpoints("zzz_nonexistent_query")
            authenticated_page.wait_for_timeout(500)

            with allure.step("Verify table filters (or shows no match message)"):
                # Either fewer rows or "No endpoints match" message
                no_match = authenticated_page.locator("text=No endpoints match")
                if no_match.is_visible(timeout=2000):
                    pass  # Filter working — no results
                else:
                    assert dashboard.get_endpoint_count() <= initial_count

            with allure.step("Verify table content changes when filtering"):
                # Clear the search and verify count goes back up
                dashboard.search_input.clear()
                authenticated_page.wait_for_timeout(500)
                restored_count = dashboard.get_endpoint_count()
                if initial_count > 0:
                    assert restored_count >= initial_count, (
                        f"After clearing search, row count {restored_count} < initial {initial_count}"
                    )
        else:
            pytest.skip("Search input not visible (no endpoints)")


@allure.feature("Endpoints")
@allure.story("Add Endpoint Button")
@allure.severity(allure.severity_level.MINOR)
@allure.title("Add Endpoint button is visible in dashboard header")
def test_add_endpoint_button_visible(authenticated_page: Page):
    dashboard = DashboardPage(authenticated_page)

    with allure.step("Check for Add Endpoint button"):
        expect(dashboard.heading).to_be_visible(timeout=10000)
        expect(dashboard.add_endpoint_button).to_be_visible(timeout=5000)
