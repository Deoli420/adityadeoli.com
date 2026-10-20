#!/usr/bin/env bash
# ── One-command deploy for adityadeoli.com portfolio ──────────────────────
# Pushes main, then runs the droplet's own deploy script, which pulls,
# builds the portfolio and publishes dist/ to the folder Caddy serves.
# Finally checks that the new bundle is live.
#
# Usage:
#   ./deploy.sh                 # normal deploy (must be on main)
#   ./deploy.sh --skip-push     # only redeploy what is already on origin/main
#   ./deploy.sh --no-verify     # skip the live bundle hash check
# ──────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────
DROPLET_USER="deploy"
DROPLET_HOST="137.184.63.41"
SSH_KEY="$HOME/.ssh/id_ed25519_droplet"
REMOTE_SCRIPT="~/deploy-adityadeoli.sh"   # pull → npm ci → build → rsync to /var/www/adityadeoli.com
LIVE_URL="https://adityadeoli.com/"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SSH_OPTS="-o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new -o IdentitiesOnly=yes -i $SSH_KEY"

# ── Colours ───────────────────────────────────────────────────────────────
GREEN=$'\033[0;32m'
BLUE=$'\033[0;34m'
YELLOW=$'\033[1;33m'
RED=$'\033[0;31m'
NC=$'\033[0m'

log()  { printf "%s[%s]%s %s\n" "$BLUE"  "$(date +%H:%M:%S)" "$NC" "$*"; }
ok()   { printf "%s✓%s %s\n" "$GREEN" "$NC" "$*"; }
warn() { printf "%s!%s %s\n" "$YELLOW" "$NC" "$*"; }
die()  { printf "%s✗%s %s\n" "$RED"   "$NC" "$*" >&2; exit 1; }

# ── Flags ────────────────────────────────────────────────────────────────
SKIP_PUSH=0
NO_VERIFY=0
for arg in "$@"; do
    case "$arg" in
        --skip-push) SKIP_PUSH=1 ;;
        --no-verify) NO_VERIFY=1 ;;
        -h|--help)
            sed -n '2,11p' "${BASH_SOURCE[0]}"
            exit 0
            ;;
        *) die "Unknown flag: $arg" ;;
    esac
done

cd "$REPO_ROOT"

# ── 1. Sanity checks ─────────────────────────────────────────────────────
log "Checking prerequisites..."

[ -f "$SSH_KEY" ]     || die "SSH key not found: $SSH_KEY"
command -v git  >/dev/null || die "git not installed"
command -v curl >/dev/null || die "curl not installed"
command -v ssh  >/dev/null || die "ssh not installed"

# The droplet always deploys origin/main, so pushing any other branch deploys nothing.
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$SKIP_PUSH" -eq 0 ] && [ "$BRANCH" != "main" ]; then
    die "You are on '$BRANCH'. The droplet deploys origin/main — merge into main first, or use --skip-push."
fi

if [ "$NO_VERIFY" -eq 0 ]; then
    OLD_BUNDLE="$(curl -s "$LIVE_URL" | grep -oE 'src="/assets/index-[^"]+\.js"' | head -1 || true)"
    log "Current live bundle: ${OLD_BUNDLE:-<unknown>}"
fi

# ── 2. Push (unless skipped) ─────────────────────────────────────────────
if [ "$SKIP_PUSH" -eq 0 ]; then
    if ! git diff-index --quiet HEAD --; then
        warn "You have uncommitted changes — they will NOT be deployed."
    fi
    log "Pushing main..."
    git push origin main
    ok "Pushed."
else
    log "Skipping push (--skip-push)"
fi

EXPECTED_SHA="$(git rev-parse --short origin/main)"
log "Deploying origin/main @ $EXPECTED_SHA"

# ── 3. Remote deploy ─────────────────────────────────────────────────────
log "Running $REMOTE_SCRIPT on $DROPLET_HOST..."
REMOTE_OUT="$(ssh $SSH_OPTS "$DROPLET_USER@$DROPLET_HOST" "$REMOTE_SCRIPT" 2>&1)" || {
    printf '%s\n' "$REMOTE_OUT" | tail -30
    die "Remote deploy failed."
}
printf '%s\n' "$REMOTE_OUT" | grep -E "built in|Deployed|error|Error" || true

DEPLOYED_LINE="$(printf '%s\n' "$REMOTE_OUT" | grep '^Deployed ' | tail -1 || true)"
case "$DEPLOYED_LINE" in
    "Deployed $EXPECTED_SHA"*) ok "Remote is on $EXPECTED_SHA." ;;
    *) warn "Remote reported '${DEPLOYED_LINE:-nothing}', expected $EXPECTED_SHA." ;;
esac

# ── 4. Verify new bundle is live ─────────────────────────────────────────
if [ "$NO_VERIFY" -eq 0 ]; then
    NEW_BUNDLE="$(curl -s "$LIVE_URL" | grep -oE 'src="/assets/index-[^"]+\.js"' | head -1 || true)"
    log "New live bundle:     ${NEW_BUNDLE:-<unknown>}"

    if [ -z "$NEW_BUNDLE" ]; then
        warn "Could not read bundle hash from $LIVE_URL."
    elif [ "$NEW_BUNDLE" = "$OLD_BUNDLE" ]; then
        warn "Bundle hash unchanged — either no JS changes or Vite produced an identical build."
    else
        ok "New bundle is live."
    fi

    STATUS="$(curl -s -o /dev/null -w '%{http_code}' "$LIVE_URL")"
    [ "$STATUS" = "200" ] && ok "Homepage returns 200." || warn "Homepage returned $STATUS"
fi

echo ""
ok "Deploy finished at $(date +%H:%M:%S). View: $LIVE_URL"
