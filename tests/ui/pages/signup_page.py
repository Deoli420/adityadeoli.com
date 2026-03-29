"""Page object for SignupPage (/signup).

Locators derived from frontend/src/pages/SignupPage.tsx:
  - display name: #displayName
  - email:        #email
  - password:     #password
  - org name:     #orgName
  - submit btn:   button[type="submit"] with text "Create Account"
  - error box:    .text-risk-critical
  - login link:   a[href="/login"] with text "Sign in"
"""
from playwright.sync_api import Page, expect

from .base_page import BasePage


class SignupPage(BasePage):
    # ── Locators ──────────────────────────────────────────────────────────

    @property
    def display_name_input(self):
        return self.page.locator("#displayName")

    @property
    def email_input(self):
        return self.page.locator("#email")

    @property
    def password_input(self):
        return self.page.locator("#password")

    @property
    def org_name_input(self):
        return self.page.locator("#orgName")

    @property
    def submit_button(self):
        return self.page.locator("button[type='submit']")

    @property
    def error_message(self):
        return self.page.locator(".text-risk-critical")

    @property
    def login_link(self):
        return self.page.locator("a[href='/login']")

    @property
    def heading(self):
        return self.page.locator("h1", has_text="Create your account")

    # ── Actions ───────────────────────────────────────────────────────────

    def goto(self):
        self.navigate("/signup")
        return self

    def signup(self, name: str, email: str, password: str, org_name: str = ""):
        self.display_name_input.fill(name)
        self.email_input.fill(email)
        self.password_input.fill(password)
        if org_name:
            self.org_name_input.fill(org_name)
        self.submit_button.click()
        self.page.wait_for_load_state("networkidle")
        return self

    def get_error(self) -> str:
        expect(self.error_message).to_be_visible(timeout=5000)
        return self.error_message.inner_text()
