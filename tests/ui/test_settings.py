"""
Settings page tests — profile, team, organization sub-pages.
"""
import re

import allure
import pytest
from playwright.sync_api import Page, expect

from tests.ui.conftest import TEST_EMAIL
from tests.ui.pages.settings_page import SettingsPage

pytestmark = [pytest.mark.regression, pytest.mark.ui]


@allure.feature("Settings")
@allure.story("Profile")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Settings profile page loads")
def test_settings_profile_loads(authenticated_page: Page):
    settings = SettingsPage(authenticated_page)

    with allure.step("Navigate to /settings"):
        settings.goto_profile()

    with allure.step("Verify Settings heading and profile form"):
        expect(settings.heading).to_be_visible(timeout=10000)
        # Profile tab should be active and form visible
        expect(settings.profile_tab).to_be_visible()

    with allure.step("Verify email input has an actual email value"):
        expect(settings.email_input).to_be_visible(timeout=5000)
        email_value = settings.get_user_email()
        assert re.match(r"[^@]+@[^@]+\.[^@]+", email_value), (
            f"Email input does not contain a valid email: '{email_value}'"
        )


@allure.feature("Settings")
@allure.story("Profile")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Settings shows current user email")
def test_settings_shows_email(authenticated_page: Page):
    settings = SettingsPage(authenticated_page)

    with allure.step("Navigate to settings profile"):
        settings.goto_profile()
        expect(settings.heading).to_be_visible(timeout=10000)

    with allure.step("Verify email field contains test user email"):
        expect(settings.email_input).to_be_visible(timeout=5000)
        email_value = settings.get_user_email()
        assert TEST_EMAIL in email_value

    with allure.step("Verify email matches the test user's email exactly"):
        assert email_value == TEST_EMAIL, (
            f"Expected email '{TEST_EMAIL}', got '{email_value}'"
        )


@allure.feature("Settings")
@allure.story("Team")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Settings team page shows member list")
def test_settings_team_page(authenticated_page: Page):
    settings = SettingsPage(authenticated_page)

    with allure.step("Navigate to /settings/team"):
        settings.goto_team()

    with allure.step("Verify Team Members heading"):
        expect(settings.team_heading).to_be_visible(timeout=10000)

    with allure.step("Verify member table has at least 1 row with admin user"):
        # There should be at least the admin/test user in the member list
        member_count = settings.get_member_count()
        if member_count == 0:
            # Fallback: check for any table rows or member entries
            rows = authenticated_page.locator("table tbody tr")
            member_entries = authenticated_page.locator("[class*='flex'][class*='items-center']").filter(
                has=authenticated_page.locator("[class*='rounded-full']")
            )
            total = rows.count() + member_entries.count()
            assert total >= 1, "No team members found on the team page"
        else:
            assert member_count >= 1, f"Expected at least 1 team member, got {member_count}"

        # Verify the admin user's email appears on the team page
        page_text = authenticated_page.locator("body").inner_text()
        assert TEST_EMAIL in page_text or TEST_EMAIL.split("@")[0] in page_text, (
            f"Admin user not found on team page"
        )


@allure.feature("Settings")
@allure.story("Organization")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Settings organization page shows org name")
def test_settings_org_page(authenticated_page: Page):
    settings = SettingsPage(authenticated_page)

    with allure.step("Navigate to /settings/organization"):
        settings.goto_org()

    with allure.step("Verify organization form is visible"):
        expect(settings.heading).to_be_visible(timeout=10000)
        # Org settings has a name input
        expect(authenticated_page.locator("input").first).to_be_visible(timeout=5000)


@allure.feature("Settings")
@allure.story("Navigation")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Settings sub-nav tabs work (Profile/Team/Organization)")
def test_settings_navigation(authenticated_page: Page):
    settings = SettingsPage(authenticated_page)

    with allure.step("Navigate to settings"):
        settings.goto_profile()
        expect(settings.heading).to_be_visible(timeout=10000)

    with allure.step("Click Team tab"):
        settings.team_tab.click()
        authenticated_page.wait_for_load_state("networkidle")
        expect(settings.team_heading).to_be_visible(timeout=10000)

    with allure.step("Click Organization tab"):
        settings.org_tab.click()
        authenticated_page.wait_for_load_state("networkidle")
        expect(settings.heading).to_be_visible()

    with allure.step("Click Profile tab"):
        settings.profile_tab.click()
        authenticated_page.wait_for_load_state("networkidle")
        expect(settings.email_input).to_be_visible(timeout=5000)
