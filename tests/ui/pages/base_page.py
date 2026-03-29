"""Base page object — shared helpers for all page objects."""
from playwright.sync_api import Page


class BasePage:
    def __init__(self, page: Page):
        self.page = page

    def navigate(self, path: str = "/"):
        self.page.goto(path)
        self.page.wait_for_load_state("networkidle")
        return self

    @property
    def title(self) -> str:
        return self.page.title()

    def get_text(self, selector: str) -> str:
        return self.page.locator(selector).inner_text()

    def is_visible(self, selector: str, timeout: int = 5000) -> bool:
        return self.page.locator(selector).is_visible(timeout=timeout)

    def screenshot(self, name: str = "screenshot") -> bytes:
        return self.page.screenshot(full_page=True)
