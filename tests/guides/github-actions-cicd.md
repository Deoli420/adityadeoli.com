# GitHub Actions CI/CD — Complete Learning Guide

> **Purpose**: Explains every decision in our CI/CD pipeline. Written for SDET interview preparation.

---

## 1. What is GitHub Actions?

GitHub Actions is a CI/CD platform built into GitHub. When you push code, it automatically runs workflows (YAML files) that build, test, and deploy your application.

**Key concepts:**
- **Workflow**: A YAML file in `.github/workflows/` that defines automation
- **Job**: A set of steps that run on one machine (virtual or self-hosted)
- **Step**: A single action (run a command, use a pre-built action, etc.)
- **Trigger**: What causes the workflow to run (push, PR, schedule, manual)
- **Runner**: The machine that executes the job (GitHub provides free Ubuntu/Mac/Windows)

**Interview Q: "Why GitHub Actions over Jenkins/CircleCI/GitLab CI?"**
> "Zero infrastructure — it's built into GitHub where our code lives. No Jenkins server to maintain, no plugins to update, no SSH access needed. It's YAML-based (version controlled with the code), has excellent caching, and the free tier gives 2000 minutes/month for private repos."

---

## 2. Our Pipeline Architecture

```
Push to any branch
    │
    ├── integration-tests.yml (this file)
    │   ├── 🔥 Smoke Job (22 tests, ~15s)
    │   │   └── If fails → ❌ Stop. Don't waste CI minutes.
    │   │
    │   └── 🧪 Regression Job (92 tests, ~60s) [needs: smoke]
    │       └── If fails → ❌ Block merge.
    │
    └── e2e-tests.yml (separate file, Docker-based)
        └── 🌐 E2E Job (Playwright, ~5min) [only on main]
```

**Interview Q: "How do you structure test tiers in CI?"**
> "Fast feedback first. Smoke tests (15s) catch catastrophic breakage — if login is broken, running 70 more tests wastes time. Regression tests (60s) run only after smoke passes. E2E tests (5min) run only on main. This is a speed/thoroughness tradeoff — developers get feedback in <30s for most pushes."

---

## 3. Line-by-Line Walkthrough

### Triggers (on:)

```yaml
on:
  push:
    branches: [main, "feature/**", "fix/**"]
    paths-ignore:
      - "**.md"
      - "portfolio/**"
```

- `push.branches`: Only run on main, feature/*, and fix/* branches. Don't run on random branches.
- `paths-ignore`: Skip CI for README changes or portfolio updates — they can't break the API.

**Interview Q: "How do you avoid unnecessary CI runs?"**
> "Two strategies: path filtering (skip for docs-only changes) and concurrency groups (cancel in-progress runs when a new push arrives). This saves ~40% of our CI minutes."

### Concurrency

```yaml
concurrency:
  group: integration-${{ github.ref }}
  cancel-in-progress: true
```

If you push commit A, then push commit B before A finishes testing, the A workflow is cancelled. Only B's results matter.

### Caching

```yaml
- name: Cache pip packages
  uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('tests/integration/requirements.txt') }}
    restore-keys: |
      ${{ runner.os }}-pip-
```

**How it works:**
1. `key`: Hash of requirements.txt. If deps haven't changed, restore from cache.
2. `restore-keys`: Fallback — if exact key misses, use any cache that starts with `Linux-pip-`. Partial cache is better than no cache.
3. First run: ~20s to install packages. Cached runs: ~3s.

**Interview Q: "What caching strategies do you use in CI?"**
> "pip package caching keyed on requirements hash, Docker layer caching for container builds, and GitHub's built-in action caches. Cache invalidation is automatic — when requirements.txt changes, the hash changes, and a fresh install happens."

### Job Dependencies

```yaml
regression:
  needs: smoke
```

`needs: smoke` means the regression job only starts AFTER smoke passes. If smoke fails, regression is skipped entirely.

**Interview Q: "What's the difference between `needs` and no dependency?"**
> "Jobs without `needs` run in parallel. Jobs with `needs` run sequentially. We use `needs` for the smoke→regression gate (don't waste time if basics are broken) but would use parallel for independent test suites (unit tests + lint + type-check)."

### Test Execution

```yaml
- name: Run smoke tests
  env:
    PYTHONPATH: ${{ github.workspace }}
  run: |
    pytest tests/integration/ \
      -m smoke \
      -v \
      --tb=short \
      --junit-xml=tests/reports/smoke-results.xml \
      --alluredir=tests/reports/allure-results
```

- `PYTHONPATH`: Tells Python where to find `app/` module imports
- `-m smoke`: Only run tests with `@pytest.mark.smoke` marker
- `--junit-xml`: Machine-readable XML that GitHub can parse for summaries
- `--alluredir`: Allure-compatible JSON files for rich HTML reports

### Artifact Upload

```yaml
- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: full-test-results
    path: tests/reports/
    retention-days: 30
```

- `if: always()`: Upload EVEN if tests fail. You need the report to debug failures.
- Artifacts are downloadable from the Actions tab for 30 days.

**Interview Q: "How do you debug CI failures?"**
> "Three sources: (1) The GitHub step summary shows pass/fail counts inline. (2) The JUnit XML artifact shows exactly which tests failed with tracebacks. (3) The Allure results artifact can be served locally to get the full interactive report."

### Step Summary

```yaml
echo "## 🧪 Integration Test Results" >> $GITHUB_STEP_SUMMARY
```

`$GITHUB_STEP_SUMMARY` is a special file — anything written to it appears as formatted Markdown in the Actions run page. This gives you a visual summary without clicking into logs.

---

## 4. How to Set Up Branch Protection

After the workflow is running, set up branch protection:

1. Go to: GitHub repo → Settings → Branches → Branch protection rules
2. Add rule for `main`
3. Check: "Require status checks to pass before merging"
4. Search for and select: "🔥 Smoke Tests" and "🧪 Regression Tests"
5. Check: "Require branches to be up to date before merging"

Now the merge button is blocked until tests pass.

**Interview Q: "How do you prevent broken code from reaching production?"**
> "Branch protection rules require all CI checks to pass before merge. Even if a developer has admin access, they can't force-merge past failing tests without explicitly overriding. We also require PR reviews for additional human verification."

---

## 5. Running Locally

```bash
# Simulate what CI does
cd /Users/adityadeoli/SentinelAI
source tests/integration/.venv/bin/activate

# Smoke only (what CI runs first)
PYTHONPATH=. pytest tests/integration/ -m smoke -v

# Full suite (what CI runs second)
PYTHONPATH=. pytest tests/integration/ -v

# With Allure report
PYTHONPATH=. pytest tests/integration/ --alluredir=tests/reports/allure-results
allure serve tests/reports/allure-results
```

---

## 6. Common Interview Questions

**Q: "How do you handle flaky tests in CI?"**
> "Step 1: Quarantine the flaky test with `@pytest.mark.skip` immediately so it doesn't block the team. Step 2: Investigate root cause (usually shared state, timing, or non-determinism). Step 3: Fix and re-enable. We NEVER use automatic retries as a permanent solution — that hides real problems."

**Q: "What's your CI/CD philosophy?"**
> "Fast feedback, progressive validation. Smoke tests in 15 seconds tell you if you broke something critical. Full regression in 60 seconds catches edge cases. E2E in 5 minutes validates the full stack. Each tier adds cost (time) but catches different bug categories."

**Q: "How do you test database migrations in CI?"**
> "Our integration tests create tables via SQLAlchemy metadata (not Alembic migrations) to avoid PostgreSQL dependency. Migration testing happens separately — we run `alembic upgrade head` against a PostgreSQL container in the E2E workflow. This separates schema correctness (E2E) from application logic (integration)."

**Q: "What metrics do you track for CI?"**
> "Four: (1) Time to feedback — how long until a developer knows their push is good. (2) Failure rate — what % of runs fail (high = flaky tests). (3) Recovery time — how fast broken builds get fixed. (4) Coverage trends — are we adding tests for new features?"

---

## 7. Workflow Files Reference

| File | Purpose | Trigger | Duration |
|------|---------|---------|----------|
| `integration-tests.yml` | Smoke + full regression tests | Push + PR | ~60s |
| `e2e-tests.yml` | Playwright + Docker-based E2E | Push to main + PR | ~5min |

---

*This guide is part of SentinelAI's test automation documentation. See also: `phase1-fastapi-integration.md` for test design patterns.*
