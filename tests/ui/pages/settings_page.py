"""Page object for Settings pages (/settings, /settings/team, /settings/organization).

Locators derived from:
  - SettingsLayout.tsx: heading h1 "Settings", sub-nav tabs (Profile, Team, Organization)
  - ProfileSettings.tsx: user email in profile form
  - TeamSettings.tsx: h3 "Team Members", user rows
  - OrgSettings.tsx: org name input, member count
"""
from playwright.sync_api import Page, expect

from .base_page import BasePage


class SettingsPage(BasePage):
    # ── Locators ──────────────────────────────────────────────────────────

    @property
    def heading(self):
        return self.page.locator("h1", has_text="Settings")

    @property
    def sub_nav(self):
        return self.page.locator("nav.w-48")

    @property
    def profile_tab(self):
        return self.sub_nav.locator("a", has_text="Profile")

    @property
    def team_tab(self):
        return self.sub_nav.locator("a", has_text="Team")

    @property
    def org_tab(self):
        return self.sub_nav.locator("a", has_text="Organization")

    @property
    def email_input(self):
        """Email field in profile settings form."""
        return self.page.locator("input[type='email']").first

    @property
    def team_heading(self):
        return self.page.locator("h3", has_text="Team Members")

    @property
    def org_name_input(self):
        """Organization name input in OrgSettings."""
        return self.page.locator("input").first

    # ── Actions ───────────────────────────────────────────────────────────

    def goto_profile(self):
        self.navigate("/settings")
        return self

    def goto_team(self):
        self.navigate("/settings/team")
        return self

    def goto_org(self):
        self.navigate("/settings/organization")
        return self

    def get_user_email(self) -> str:
        return self.email_input.input_value()

    def get_member_count(self) -> int:
        """Count member rows in the team page. Each row has a user avatar circle."""
        return self.page.locator("table tbody tr, [class*='flex'][class*='items-center'][class*='gap']").filter(
            has=self.page.locator("[class*='rounded-full']")
        ).count()
