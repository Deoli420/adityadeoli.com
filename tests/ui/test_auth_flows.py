"""
Authentication flow tests — login, validation, signup page.
"""
import re

import allure
import pytest
from playwright.sync_api import Page, expect

from tests.ui.conftest import BASE_URL, TEST_EMAIL, TEST_PASSWORD, TEST_ORG_SLUG
from tests.ui.pages.login_page import LoginPage
from tests.ui.pages.signup_page import SignupPage
from tests.ui.pages.dashboard_page import DashboardPage

pytestmark = [pytest.mark.regression, pytest.mark.ui]


@allure.feature("Authentication")
@allure.story("Login")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("Valid login via UI")
def test_login_valid(page: Page):
    login = LoginPage(page)

    with allure.step("Go to login page"):
        login.goto()

    with allure.step("Login with valid credentials"):
        login.login(TEST_EMAIL, TEST_PASSWORD, TEST_ORG_SLUG)

    with allure.step("Verify dashboard loads"):
        dashboard = DashboardPage(page)
        expect(dashboard.heading).to_be_visible(timeout=10000)

    with allure.step("Verify dashboard content actually loaded"):
        # KPI cards should render — proves data loaded, not just a shell
        expect(dashboard.kpi_cards.first).to_be_visible(timeout=10000)
        expect(dashboard.kpi_cards.first).to_contain_text(re.compile(r"\d+"), timeout=10000)


@allure.feature("Authentication")
@allure.story("Login")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Wrong password shows error")
def test_login_wrong_password(page: Page):
    login = LoginPage(page)

    with allure.step("Go to login and submit wrong password"):
        login.goto()
        login.login(TEST_EMAIL, "wrongpassword123", TEST_ORG_SLUG)

    with allure.step("Verify error message appears"):
        error = login.get_error()
        assert len(error) > 0

    with allure.step("Verify error text mentions invalid credentials"):
        error_lower = error.lower()
        assert any(
            keyword in error_lower
            for keyword in ["invalid", "credentials", "incorrect", "wrong", "failed"]
        ), f"Error message does not mention credentials issue: '{error}'"


@allure.feature("Authentication")
@allure.story("Login")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Empty fields show validation error")
def test_login_empty_fields(page: Page):
    login = LoginPage(page)

    with allure.step("Go to login and submit empty form"):
        login.goto()
        # Clear the default org slug value
        login.org_input.clear()
        login.submit_button.click()
        page.wait_for_timeout(500)

    with allure.step("Verify validation error"):
        error = login.get_error()
        assert "required" in error.lower()

    with allure.step("Verify specific validation messages appear"):
        # The error should indicate what fields are missing
        error_lower = error.lower()
        assert any(
            keyword in error_lower
            for keyword in ["required", "email", "password", "field", "fill"]
        ), f"Validation message not descriptive: '{error}'"


@allure.feature("Authentication")
@allure.story("Signup")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Signup page loads with form fields")
def test_signup_page_loads(page: Page):
    signup = SignupPage(page)

    with allure.step("Navigate to signup page"):
        signup.goto()

    with allure.step("Verify signup form fields are visible"):
        expect(signup.heading).to_be_visible()
        expect(signup.display_name_input).to_be_visible()
        expect(signup.email_input).to_be_visible()
        expect(signup.password_input).to_be_visible()
        expect(signup.org_name_input).to_be_visible()
        expect(signup.submit_button).to_be_visible()

    with allure.step("Verify ALL form fields are present — name, email, password, org"):
        expect(signup.display_name_input).to_have_attribute("id", "displayName")
        expect(signup.email_input).to_have_attribute("id", "email")
        expect(signup.password_input).to_have_attribute("id", "password")
        expect(signup.org_name_input).to_have_attribute("id", "orgName")


@allure.feature("Authentication")
@allure.story("Login")
@allure.severity(allure.severity_level.MINOR)
@allure.title("Login page has signup link")
def test_login_page_has_signup_link(page: Page):
    login = LoginPage(page)

    with allure.step("Go to login page"):
        login.goto()

    with allure.step("Verify 'Create one' link exists pointing to /signup"):
        expect(login.signup_link).to_be_visible()
        expect(login.signup_link).to_have_text("Create one")

    with allure.step("Verify signup link href points to /signup"):
        expect(login.signup_link).to_have_attribute("href", "/signup")


@allure.feature("Authentication")
@allure.story("Redirect")
@allure.severity(allure.severity_level.NORMAL)
@allure.title("Authenticated user visiting /login is redirected to /")
def test_authenticated_redirect(authenticated_page: Page):
    with allure.step("Navigate to /login while already authenticated"):
        authenticated_page.goto(f"{BASE_URL}/login")
        authenticated_page.wait_for_load_state("networkidle")

    with allure.step("Verify redirect to dashboard"):
        # Should be redirected away from login — either to / or stay if no redirect logic
        expect(authenticated_page.locator("h2", has_text="Overview")).to_be_visible(timeout=10000)
