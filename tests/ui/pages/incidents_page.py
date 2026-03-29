"""Page object for IncidentsPage (/incidents).

Locators derived from frontend/src/pages/IncidentsPage.tsx:
  - heading:         h1 "Incidents"
  - tabs:            buttons inside the tab bar (All, Open, Investigating, Resolved, Clusters)
  - incident rows:   links with class containing "rounded-xl border" that link to /incidents/:id
  - summary banner:  IncidentSummaryBanner component
"""
from playwright.sync_api import Page, expect

from .base_page import BasePage


class IncidentsPage(BasePage):
    # ── Locators ──────────────────────────────────────────────────────────

    @property
    def heading(self):
        return self.page.locator("h1", has_text="Incidents")

    @property
    def tab_bar(self):
        """The tab bar container."""
        return self.page.locator(".flex.gap-1.rounded-xl.bg-surface-tertiary")

    @property
    def tab_buttons(self):
        return self.tab_bar.locator("button")

    @property
    def incident_rows(self):
        """Links to individual incidents."""
        return self.page.locator("a[href^='/incidents/']").filter(
            has=self.page.locator("p")
        )

    @property
    def summary_banner(self):
        """The IncidentSummaryBanner section — a rounded-xl div with border styling.

        When no open incidents: 'All clear — no open incidents'
        When open incidents: '{N} open · {counts}' with severity border
        """
        # Match either the "All clear" banner or the severity summary banner
        return self.page.locator(
            "[class*='rounded-xl'][class*='border'][class*='p-4']"
        ).first

    @property
    def clusters_grid(self):
        return self.page.locator(".grid.gap-3")

    @property
    def empty_state(self):
        return self.page.locator("text=No incidents yet")

    # ── Actions ───────────────────────────────────────────────────────────

    def goto(self):
        self.navigate("/incidents")
        return self

    def select_tab(self, label: str):
        """Click a tab by its label text (All, Open, Investigating, Resolved, Clusters)."""
        self.tab_bar.locator("button", has_text=label).click()
        self.page.wait_for_load_state("networkidle")
        return self

    def get_incident_count(self) -> int:
        return self.incident_rows.count()

    def click_first_incident(self):
        self.incident_rows.first.click()
        self.page.wait_for_load_state("networkidle")
        return self
