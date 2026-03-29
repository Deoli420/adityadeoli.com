"""
Navigation tests — sidebar links, 404, browser history, page headings.
"""
import re

import allure
import pytest
from playwright.sync_api import Page, expect

from tests.ui.conftest import BASE_URL
from tests.ui.pages.sidebar import Sidebar

pytestmark = [pytest.mark.regression, pytest.mark.ui]

# Sidebar nav items and their expected heading text on the target page
SIDEBAR_ROUTES = [
    ("Dashboard", "Overview"),
    ("Incidents", "Incidents"),
    ("Security", "Security"),
    ("Settings", "Settings"),
]


@allure.feature("Navigation")
@allure.story("Sidebar Links")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("All main sidebar links work without error")
def test_all_sidebar_links_work(authenticated_page: Page):
    sidebar = Sidebar(authenticated_page)

    for nav_label, expected_heading in SIDEBAR_ROUTES:
        with allure.step(f"Click '{nav_label}' and verify page loads"):
            sidebar.click_nav(nav_label)
            heading = authenticated_page.locator(
                f"h1:has-text('{expected_heading}'), h2:has-text('{expected_heading}')"
            )
            expect(heading.first).to_be_visible(timeout=10000)

        with allure.step(f"Verify '{nav_label}' page has content beyond just a heading"):
            # Each page should have at least one card, table, or content section
            content = authenticated_page.locator(".card, table, form, [role='tablist']")
            if content.count() > 0:
                expect(content.first).to_be_visible(timeout=10000)
            else:
                # At minimum, the body should have meaningful content
                body_text = authenticated_page.locator("body").inner_text().strip()
                assert len(body_text) > 20, (
                    f"'{nav_label}' page appears to have no content"
                )


@allure.feature("Navigation")
@allure.story("404 Page")
@allure.severity(allure.severity_level.MINOR)
@allure.title("Navigating to nonexistent route shows 404 or redirect")
def test_404_page(authenticated_page: Page):
    with allure.step("Navigate to /nonexistent-page"):
        authenticated_page.goto(f"{BASE_URL}/nonexistent-page-xyz")
        authenticated_page.wait_for_load_state("networkidle")

    with allure.step("Verify 404 content or redirect to known page"):
        # The app may show a 404 page, redirect to dashboard, or show an error
        page_text = authenticated_page.locator("body").inner_text()
        has_404 = "404" in page_text or "not found" in page_text.lower()
        has_dashboard = authenticated_page.locator("h2", has_text="Overview").is_visible(timeout=3000)
        assert has_404 or has_dashboard, "Expected 404 page or redirect to dashboard"

    with allure.step("Verify 404 page has specific text like 'Not Found' or '404'"):
        if not has_dashboard:
            # If we're on the 404 page (not redirected), verify the specific content
            page_text_lower = page_text.lower()
            assert "404" in page_text or "not found" in page_text_lower or "page not found" in page_text_lower, (
                f"404 page does not contain expected '404' or 'Not Found' text"
            )


@allure.feature("Navigation")
@allure.story("Browser History")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Browser back/forward works between pages")
def test_browser_back_forward(authenticated_page: Page):
    sidebar = Sidebar(authenticated_page)

    with allure.step("Start on dashboard"):
        expect(authenticated_page.locator("h2", has_text="Overview")).to_be_visible(timeout=10000)

    with allure.step("Navigate to incidents"):
        sidebar.click_nav("Incidents")
        expect(authenticated_page.locator("h1", has_text="Incidents")).to_be_visible(timeout=10000)

    with allure.step("Go back to dashboard"):
        authenticated_page.go_back()
        authenticated_page.wait_for_load_state("networkidle")
        expect(authenticated_page.locator("h2", has_text="Overview")).to_be_visible(timeout=10000)

    with allure.step("Go forward to incidents"):
        authenticated_page.go_forward()
        authenticated_page.wait_for_load_state("networkidle")
        expect(authenticated_page.locator("h1", has_text="Incidents")).to_be_visible(timeout=10000)


@allure.feature("Navigation")
@allure.story("Page Headings")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Each page has a visible heading")
def test_page_titles(authenticated_page: Page):
    sidebar = Sidebar(authenticated_page)

    pages = [
        ("Dashboard", "Overview", "h2"),
        ("Incidents", "Incidents", "h1"),
        ("Security", "Security", "h1"),
        ("Settings", "Settings", "h1"),
    ]

    for nav_label, heading_text, tag in pages:
        with allure.step(f"Verify '{heading_text}' heading on {nav_label} page"):
            sidebar.click_nav(nav_label)
            heading = authenticated_page.locator(f"{tag}", has_text=heading_text)
            expect(heading.first).to_be_visible(timeout=10000)
