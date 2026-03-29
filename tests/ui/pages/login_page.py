"""Page object for LoginPage (/login).

Locators derived from frontend/src/pages/LoginPage.tsx:
  - org input:   #org
  - email input: #email
  - password:    #password
  - submit btn:  button[type="submit"] with text "Sign in"
  - error box:   .text-risk-critical (inside error banner)
  - signup link: a[href="/signup"] with text "Create one"
"""
from playwright.sync_api import Page, expect

from .base_page import BasePage


class LoginPage(BasePage):
    # ── Locators ──────────────────────────────────────────────────────────

    @property
    def org_input(self):
        return self.page.locator("#org")

    @property
    def email_input(self):
        return self.page.locator("#email")

    @property
    def password_input(self):
        return self.page.locator("#password")

    @property
    def submit_button(self):
        return self.page.locator("button[type='submit']")

    @property
    def error_message(self):
        return self.page.locator(".text-risk-critical")

    @property
    def signup_link(self):
        return self.page.locator("a[href='/signup']")

    @property
    def heading(self):
        return self.page.locator("h1", has_text="SentinelAI")

    # ── Actions ───────────────────────────────────────────────────────────

    def goto(self):
        self.navigate("/login")
        return self

    def login(self, email: str, password: str, org_slug: str = "sentinelai"):
        self.org_input.fill(org_slug)
        self.email_input.fill(email)
        self.password_input.fill(password)
        self.submit_button.click()
        self.page.wait_for_load_state("networkidle")
        return self

    def get_error(self) -> str:
        expect(self.error_message).to_be_visible(timeout=5000)
        return self.error_message.inner_text()
