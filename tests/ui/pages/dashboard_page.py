"""Page object for DashboardPage (/).

Locators derived from frontend/src/pages/DashboardPage.tsx:
  - heading:          h2 "Overview"
  - KPI cards:        .card.p-5 inside the 4-col grid (Total Endpoints, Active Monitors, Anomalies, Avg Risk)
  - endpoint table:   h3 "Monitored Endpoints"
  - search input:     input[placeholder="Search endpoints\u2026"]
  - add endpoint btn: a[href="/endpoints/new"] with text "Add Endpoint"
  - feature summary:  FeatureSummaryRow section
  - attention banner: AttentionBanner section
  - chart containers: ResponseTrendsChart, TopFailuresWidget, RiskDistributionChart, UptimeOverview
"""
from playwright.sync_api import Page, expect

from .base_page import BasePage


class DashboardPage(BasePage):
    # ── Locators ──────────────────────────────────────────────────────────

    @property
    def heading(self):
        return self.page.locator("h2", has_text="Overview")

    @property
    def kpi_cards(self):
        """The 4 KPI stat cards — find by their label text."""
        labels = ["Total Endpoints", "Active Monitors", "Anomalies", "Avg Risk"]
        # Return a locator that matches elements containing any KPI label
        return self.page.locator("[class*='card']").filter(
            has=self.page.locator("text=/Total Endpoints|Active Monitors|Anomalies|Avg Risk/")
        )

    @property
    def endpoint_table_heading(self):
        return self.page.locator("h3", has_text="Monitored Endpoints")

    @property
    def search_input(self):
        return self.page.locator("input[placeholder='Search endpoints\u2026']")

    @property
    def add_endpoint_button(self):
        return self.page.locator("a[href='/endpoints/new']").first

    @property
    def endpoint_table(self):
        return self.page.locator("table")

    @property
    def endpoint_rows(self):
        return self.page.locator("table tbody tr")

    @property
    def attention_banner(self):
        """AttentionBanner component — look for its container."""
        return self.page.locator("[class*='animate-fade-in'] >> text=Attention").first

    @property
    def chart_containers(self):
        """Any chart widget card on the dashboard."""
        return self.page.locator(".card").filter(has=self.page.locator("canvas, svg, .recharts-wrapper"))

    # ── Actions ───────────────────────────────────────────────────────────

    def goto(self):
        self.navigate("/")
        return self

    def get_kpi_count(self) -> int:
        return self.kpi_cards.count()

    def get_endpoint_count(self) -> int:
        return self.endpoint_rows.count()

    def is_attention_banner_visible(self) -> bool:
        # The attention banner may or may not be present depending on state
        return self.page.locator("[class*='animate-fade-in']").first.is_visible(timeout=3000)

    def search_endpoints(self, query: str):
        self.search_input.fill(query)
        self.page.wait_for_timeout(500)
        return self
