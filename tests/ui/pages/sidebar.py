"""Page object for the Sidebar navigation.

Locators derived from frontend/src/components/layout/Sidebar.tsx:
  - nav items: NavLink elements inside <nav> with labels:
      Dashboard, Incidents, AI Telemetry, Security, Export, Add Endpoint, API Tester, Settings
  - incident badge: red badge with open count on the Incidents link
  - logout button: button with aria-label "Sign out"
  - brand text: "SentinelAI" span
"""
from playwright.sync_api import Page, expect

from .base_page import BasePage


class Sidebar(BasePage):
    # ── Locators ──────────────────────────────────────────────────────────

    @property
    def nav(self):
        return self.page.locator("aside nav")

    @property
    def nav_links(self):
        return self.nav.locator("a")

    @property
    def logout_button(self):
        return self.page.locator("button[aria-label='Sign out']")

    @property
    def incident_badge(self):
        """The red badge count on the Incidents nav item."""
        return self.page.locator("aside nav").locator("a[href='/incidents']").locator(".bg-red-500")

    @property
    def brand_text(self):
        return self.page.locator("aside span", has_text="SentinelAI")

    # ── Actions ───────────────────────────────────────────────────────────

    def click_nav(self, label: str):
        """Click a sidebar navigation item by its visible label."""
        # Use text click scoped to the aside element — avoids matching body links
        self.page.locator("aside").get_by_text(label, exact=True).click()
        self.page.wait_for_load_state("networkidle")
        return self

    def is_incident_badge_visible(self) -> bool:
        return self.incident_badge.is_visible(timeout=3000)

    def get_nav_items(self) -> list[str]:
        """Return list of visible nav link labels."""
        return self.nav_links.all_inner_texts()

    def click_logout(self):
        # Logout button may be hidden in collapsed sidebar — try aria-label first
        btn = self.page.locator("[aria-label='Sign out']")
        if btn.is_visible(timeout=3000):
            btn.click()
        else:
            # Sidebar might be collapsed — expand it first
            self.page.locator("aside button").last.click()
            self.page.wait_for_timeout(300)
            self.page.locator("[aria-label='Sign out']").click()
        self.page.wait_for_load_state("networkidle")
        return self
