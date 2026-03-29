"""
Playwright E2E test fixtures for SentinelAI.

Provides browser, context, page, and authenticated_page fixtures.
Auto-captures screenshots and traces on failure for Allure reporting.
"""
import json
import os

import allure
import pytest
from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright

# ── Config ────────────────────────────────────────────────────────────────

BASE_URL = os.getenv("SENTINELAI_URL", "https://sentinelai.adityadeoli.com")
TEST_EMAIL = os.getenv("TEST_EMAIL", "aditya@sentinelai.com")
TEST_PASSWORD = os.getenv("TEST_PASSWORD", "SentinelAdmin2025!")
TEST_ORG_SLUG = os.getenv("TEST_ORG_SLUG", "sentinelai")

# ── CLI Options ───────────────────────────────────────────────────────────


def pytest_addoption(parser):
    parser.addoption("--headed", action="store_true", default=False, help="Run in headed mode")
    parser.addoption("--slowmo", default="0", help="Slow motion delay in ms")


# ── Session-scoped: Playwright + Browser ──────────────────────────────────


@pytest.fixture(scope="session")
def playwright_instance():
    with sync_playwright() as p:
        yield p


@pytest.fixture(scope="session")
def browser(playwright_instance, request) -> Browser:
    headed = request.config.getoption("--headed", default=False)
    slowmo = int(request.config.getoption("--slowmo", default=0))
    browser = playwright_instance.chromium.launch(
        headless=not headed,
        slow_mo=slowmo,
    )
    yield browser
    browser.close()


# ── Per-test: Context + Page ──────────────────────────────────────────────


@pytest.fixture
def context(browser) -> BrowserContext:
    ctx = browser.new_context(
        base_url=BASE_URL,
        viewport={"width": 1280, "height": 800},
    )
    ctx.tracing.start(screenshots=True, snapshots=True)
    yield ctx
    ctx.tracing.stop()
    ctx.close()


@pytest.fixture
def page(context) -> Page:
    p = context.new_page()
    yield p
    p.close()


# ── Authenticated page — login via UI each time ─────────────────────────
# NOTE: We login via the actual UI form for each test that needs it.
# This is slower (~3s per test) but 100% reliable. The storage_state
# approach doesn't work because Zustand rehydrates from localStorage
# asynchronously, and Playwright's context restore doesn't trigger
# the React rehydration cycle properly.
#
# To avoid rate limiting (5 logins/min), we use a module-scoped
# context that stays logged in across all tests in a file.


@pytest.fixture(scope="module")
def auth_context(browser) -> BrowserContext:
    """Browser context logged in via UI — shared across tests in one file."""
    ctx = browser.new_context(
        base_url=BASE_URL,
        viewport={"width": 1280, "height": 800},
    )
    ctx.tracing.start(screenshots=True, snapshots=True)
    p = ctx.new_page()

    # Login via real UI
    p.goto(f"{BASE_URL}/login")
    p.wait_for_load_state("networkidle")
    p.fill("#org", TEST_ORG_SLUG)
    p.fill("#email", TEST_EMAIL)
    p.fill("#password", TEST_PASSWORD)
    p.get_by_role("button", name="Sign in").click()
    p.wait_for_url("**/", timeout=15000)
    p.wait_for_load_state("networkidle")
    p.close()

    yield ctx

    ctx.tracing.stop()
    ctx.close()


@pytest.fixture
def authenticated_page(auth_context) -> Page:
    """Fresh page tab in the already-logged-in context."""
    p = auth_context.new_page()
    p.goto(f"{BASE_URL}/")
    p.wait_for_load_state("networkidle")

    yield p

    p.close()


# ── Failure hooks: screenshot + trace ─────────────────────────────────────


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)

    if rep.when == "call" and rep.failed:
        # Attach screenshot
        page_obj: Page | None = item.funcargs.get("page") or item.funcargs.get("authenticated_page")
        if page_obj and not page_obj.is_closed():
            try:
                png = page_obj.screenshot(full_page=True)
                allure.attach(png, name="failure-screenshot", attachment_type=allure.attachment_type.PNG)
            except Exception:
                pass

            # Save trace
            try:
                ctx = page_obj.context
                trace_path = f"/tmp/trace-{item.nodeid.replace('/', '_').replace('::', '_')}.zip"
                ctx.tracing.stop(path=trace_path)
                with open(trace_path, "rb") as f:
                    allure.attach(f.read(), name="trace.zip", attachment_type=allure.attachment_type.ZIP)
            except Exception:
                pass
