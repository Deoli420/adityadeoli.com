# Phase 2: Playwright Browser E2E Tests — Complete Learning Guide

> **Purpose**: Every concept, pattern, and decision behind SentinelAI's browser-based UI test suite. Written for Senior SDET interview preparation.

---

## 1. What is Playwright?

**Playwright** is a browser automation framework by Microsoft. It controls real browsers (Chrome, Firefox, Safari) programmatically — clicking buttons, filling forms, reading text, taking screenshots — exactly like a human user would.

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)  # You see the browser!
    page = browser.new_page()
    page.goto("https://sentinelai.adityadeoli.com/login")
    page.fill('input[name="email"]', "admin@test.com")
    page.fill('input[name="password"]', "password123")
    page.click('button[type="submit"]')
    page.wait_for_url("**/")  # Wait for redirect to dashboard
    assert page.title() == "SentinelAI"
```

### Playwright vs Selenium — Why We Switched

| Concept | Selenium | Playwright |
|---------|----------|-----------|
| **Waiting** | Manual: `WebDriverWait(driver, 10).until(EC.clickable(...))` | Automatic: `page.click("button")` waits until clickable |
| **Speed** | Slow — communicates via HTTP to WebDriver binary | Fast — direct WebSocket to browser DevTools |
| **Flakiness** | High — timing issues require explicit waits everywhere | Low — auto-retry on assertions, auto-wait on actions |
| **Setup** | Download WebDriver matching browser version | `playwright install` — one command |
| **Debugging** | Screenshot on failure (limited) | Full trace: video + network + DOM + console |
| **Codegen** | None | `playwright codegen` records your clicks as code |
| **Selectors** | CSS/XPath only | CSS, XPath, text content, ARIA roles, test IDs |

**Interview Q: "Why Playwright over Selenium for a new project?"**
> "Three reasons: (1) Auto-waiting eliminates 80% of flaky tests — the #1 pain in Selenium. (2) Tracing — when a CI test fails, I get a video replay + network log + DOM snapshot, not just a cryptic timeout error. (3) Modern selector engine — I can locate elements by text content (`page.get_by_text('Login')`) or ARIA role (`page.get_by_role('button', name='Submit')`) instead of brittle CSS selectors."

---

## 2. Headed vs Headless Mode

**Headless**: Browser runs without a visible window. Used in CI/CD (no display available).
**Headed**: Browser window opens and you watch the test run. Used for debugging and learning.

```bash
# Headed — YOU WATCH (local development)
pytest tests/ui/ --headed --slowmo 500

# Headless — CI/CD (default)
pytest tests/ui/
```

`--slowmo 500` adds 500ms delay between each action so you can follow along. Without it, Playwright runs so fast you can't see what's happening.

**Interview Q: "How do you debug a failing E2E test?"**
> "Three approaches: (1) Run headed with `--slowmo` to visually watch the test. (2) Use `page.pause()` to stop execution and open Playwright Inspector — an interactive debugger where I can step through actions, inspect DOM, try selectors. (3) In CI, enable tracing — on failure, download the trace zip and open with `playwright show-trace trace.zip` to replay the entire session."

---

## 3. Page Object Model (POM)

**The #1 pattern for maintainable UI tests.** Every interview asks about this.

### The Problem Without POM

```python
# BAD — selectors scattered across 50 tests
def test_login():
    page.fill('input[placeholder="Email"]', "admin@test.com")  # Selector in test
    page.fill('input[placeholder="Password"]', "pass123")       # Duplicated
    page.click('button:has-text("Sign in")')                    # If button text changes → 50 tests break

def test_login_wrong_password():
    page.fill('input[placeholder="Email"]', "admin@test.com")  # Same selector, duplicated
    page.fill('input[placeholder="Password"]', "wrong")
    page.click('button:has-text("Sign in")')                    # Same selector, duplicated
```

### The Solution With POM

```python
# GOOD — selectors in ONE place
class LoginPage:
    def __init__(self, page):
        self.page = page
        self.email_input = page.locator('input[name="email"]')
        self.password_input = page.locator('input[name="password"]')
        self.submit_button = page.get_by_role("button", name="Sign in")
        self.error_message = page.locator('[data-testid="error-message"]')

    def goto(self):
        self.page.goto("/login")
        return self

    def login(self, email, password):
        self.email_input.fill(email)
        self.password_input.fill(password)
        self.submit_button.click()
        return self

# Tests use the page object — clean, readable, DRY
def test_login(login_page):
    login_page.goto().login("admin@test.com", "pass123")
    expect(login_page.page).to_have_url(re.compile(r"/$"))

def test_login_wrong_password(login_page):
    login_page.goto().login("admin@test.com", "wrong")
    expect(login_page.error_message).to_be_visible()
```

**When the button text changes from "Sign in" to "Log in"** — you update ONE line in `LoginPage`, not 50 tests.

**Interview Q: "Explain the Page Object Model pattern."**
> "Each web page gets a corresponding Python class. The class encapsulates all locators (how to find elements) and actions (what you can do on the page). Tests never contain raw selectors — they call page object methods like `login_page.login(email, password)`. This means when the UI changes, you fix one page object, not dozens of tests. It also makes tests read like English: 'go to login page, login with credentials, verify dashboard loads.'"

---

## 4. Locator Strategies (The Right Way)

Playwright offers multiple ways to find elements. Use them in this priority order:

### Priority 1: ARIA Roles (Best)
```python
page.get_by_role("button", name="Create Endpoint")
page.get_by_role("heading", name="Overview")
page.get_by_role("link", name="Incidents")
```
**Why best**: Reflects what the USER sees, not the HTML structure. Works even if the underlying element changes from `<button>` to `<a>`.

### Priority 2: Test IDs (Reliable)
```python
page.get_by_test_id("endpoint-name-input")
page.get_by_test_id("risk-score-badge")
```
**Why reliable**: `data-testid` attributes don't change with UI redesigns. But requires adding `data-testid` to the React components.

### Priority 3: Text Content (Readable)
```python
page.get_by_text("All systems operational")
page.get_by_placeholder("Search endpoints…")
page.get_by_label("Email")
```
**Why readable**: Tests read like English. But fragile if copy changes.

### Priority 4: CSS Selectors (Last Resort)
```python
page.locator(".card .text-risk-critical")
page.locator('input[name="email"]')
```
**Why last resort**: Coupled to implementation. CSS class renames break tests.

**Interview Q: "What's your locator strategy?"**
> "ARIA roles first — they're stable, accessible, and reflect user intent. Test IDs for complex components where roles aren't sufficient. Text content for labels and headings. CSS selectors only as a last resort. This ordering reduces test maintenance because roles and test IDs change less frequently than CSS classes."

---

## 5. Assertions with `expect()`

Playwright's `expect()` has **auto-retry** built in — it keeps checking for up to 5 seconds before failing.

```python
from playwright.sync_api import expect

# These auto-retry (GOOD — resilient to loading states)
expect(page).to_have_url(re.compile(r"/$"))
expect(page.get_by_role("heading")).to_have_text("Overview")
expect(page.locator(".card")).to_have_count(4)
expect(page.get_by_text("All systems operational")).to_be_visible()

# These do NOT retry (BAD — can fail during loading)
assert page.url == "/"  # Might check before redirect
assert page.inner_text("h1") == "Overview"  # Might check before render
```

**Interview Q: "How does Playwright handle race conditions in assertions?"**
> "Playwright's `expect()` uses auto-retry with a configurable timeout (default 5s). When you write `expect(element).to_be_visible()`, Playwright keeps checking every 100ms until the element appears or the timeout expires. This eliminates the classic Selenium pattern of `time.sleep(2)` before assertions, which either wastes time or is still flaky."

---

## 6. Fixtures — Browser Lifecycle

```python
@pytest.fixture(scope="session")
def browser():
    """One browser for all tests — expensive to start."""

@pytest.fixture
def page(browser):
    """Fresh page (tab) per test — clean state."""

@pytest.fixture
def authenticated_page(page):
    """Page with user already logged in."""
```

**Why session-scoped browser?** Starting Chrome takes ~2 seconds. Starting a new tab takes ~50ms. By reusing the browser and creating fresh tabs (pages), we save 2s × N tests.

---

## 7. Allure Integration

Every test gets rich Allure metadata — same as our integration tests:

```python
@allure.feature("Authentication")
@allure.story("Login with valid credentials")
@allure.severity(allure.severity_level.CRITICAL)
@allure.title("User can login and see dashboard")
def test_login(login_page, dashboard_page):
    with allure.step("Navigate to login page"):
        login_page.goto()
    with allure.step("Enter credentials and submit"):
        login_page.login("admin@test.com", "Password123!")
    with allure.step("Verify dashboard loads"):
        expect(dashboard_page.heading).to_have_text("Overview")
```

**Allure attaches on failure**: screenshots, page HTML, console logs, network traces.

---

## 8. Running Tests

```bash
# ── LOCAL (headed — you watch) ─────────────────────────────────
cd tests/ui
source .venv/bin/activate

# Run all UI tests — browser opens, you watch
pytest --headed --slowmo 300 -v

# Run one specific test
pytest test_smoke_ui.py::test_login_and_see_dashboard --headed --slowmo 500

# Run with Allure report
pytest --headed --alluredir=../reports/allure-ui-results -v
allure serve ../reports/allure-ui-results

# ── CI (headless — parallel) ──────────────────────────────────
pytest -n 2 --alluredir=reports/allure-ui-results --reruns 2

# ── DEBUG (pause on action) ───────────────────────────────────
# Add page.pause() in your test → opens Playwright Inspector
```

---

## 9. Tracing (The Killer Feature)

When a test fails in CI, you get a **trace file** — a complete replay of everything that happened:

```python
# conftest.py — auto-capture trace on failure
@pytest.fixture
def page(browser, request):
    context = browser.new_context()
    context.tracing.start(screenshots=True, snapshots=True, sources=True)
    page = context.new_page()
    yield page
    # On failure, save trace
    if request.node.rep_call.failed:
        context.tracing.stop(path=f"traces/{request.node.name}.zip")
    else:
        context.tracing.stop()
    context.close()
```

View trace: `playwright show-trace traces/test_login.zip`

This opens a timeline showing every action, network request, DOM state, and console log.

**Interview Q: "How do you debug E2E test failures in CI?"**
> "Playwright tracing. Every failed test produces a trace zip file — uploaded as a GitHub Actions artifact. I download it and run `playwright show-trace trace.zip`. It shows a frame-by-frame replay: what was clicked, what the DOM looked like, what network requests fired, what console errors occurred. It's like having a screen recording with DevTools attached."

---

## 10. Parallel Execution in CI

```yaml
# GitHub Actions
- name: Run UI tests (parallel)
  run: pytest tests/ui/ -n 2 --dist loadgroup
```

`-n 2` runs 2 browser instances in parallel. Each test gets its own browser context (isolated cookies, storage).

**Why `-n 2` not `-n auto`?** Browser tests are memory-heavy. GitHub Actions runners have 2 CPUs / 7GB RAM. More than 2 parallel browsers causes OOM kills.

**Interview Q: "How do you parallelize browser tests safely?"**
> "Each test gets its own browser context — isolated cookies, localStorage, and session. Tests don't share state. We use `-n 2` in CI (2 CPU cores available) with `--dist loadgroup` for balanced distribution. Locally, we run sequentially in headed mode to watch. The key is that every test must be independent — login fresh, create its own data, clean up after."

---

## 11. Common Interview Questions

**Q: "What's the testing pyramid and where do E2E tests fit?"**
> "The pyramid has unit tests at the base (fast, many), integration tests in the middle (medium speed, moderate count), and E2E tests at the top (slow, few). Our stack: 92 integration tests (40s) catch API logic bugs, ~40 UI tests (2-3 min) catch rendering and workflow bugs. E2E tests are expensive, so we only test critical user journeys, not every edge case."

**Q: "How do you handle test data for E2E tests?"**
> "Two approaches: (1) API setup — before each test, create test data via API calls (fast, reliable). (2) Shared seed data — pre-seeded test account that all tests use for read-only operations. We use approach 1 for write tests (create endpoint, create incident) and approach 2 for read tests (dashboard, security page)."

**Q: "How do you handle authentication in E2E tests?"**
> "We login via API (not UI) to get an auth token, then inject it into the browser context via cookies or localStorage. This saves ~3 seconds per test vs UI login. Only the actual login flow tests go through the UI login form."

**Q: "What makes E2E tests flaky and how do you prevent it?"**
> "Top 3 causes: (1) Timing — element not rendered yet. Fix: use Playwright's auto-wait, never `time.sleep()`. (2) Shared state — test B depends on test A's data. Fix: each test creates its own data. (3) Network variability — slow API responses. Fix: use `expect()` with generous timeouts, retry failed tests once."

---

*This guide is part of SentinelAI's test automation documentation. See also: `phase1-fastapi-integration.md` for API testing and `github-actions-cicd.md` for CI/CD.*
