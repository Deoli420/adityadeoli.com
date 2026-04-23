#!/usr/bin/env bash
# ── One-command deploy for adityadeoli.com portfolio ──────────────────────
# Pushes local commits, then SSHs to the droplet, pulls, rebuilds Docker,
# and verifies the new bundle is being served.
#
# Usage:
#   ./deploy.sh                 # normal deploy
#   ./deploy.sh --skip-push     # only redeploy current HEAD (no git push)
#   ./deploy.sh --no-verify     # skip the live bundle hash check
# ──────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────
DROPLET_USER="deploy"
DROPLET_HOST="64.227.143.70"
SSH_KEY="$HOME/.ssh/id_ed25519_droplet"
REMOTE_DIR="/home/deploy/sentinelai/portfolio"
LIVE_URL="https://adityadeoli.com/"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SSH_OPTS="-o ConnectTimeout=15 -o StrictHostKeyChecking=no -i $SSH_KEY"

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
            sed -n '2,12p' "${BASH_SOURCE[0]}"
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

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[ "$BRANCH" = "main" ] || warn "You are on branch '$BRANCH' (not 'main')"

# Capture current live bundle hash for diff comparison later.
if [ "$NO_VERIFY" -eq 0 ]; then
    OLD_BUNDLE="$(curl -s "$LIVE_URL" | grep -oE 'src="/assets/index-[^"]+\.js"' | head -1 || true)"
    log "Current live bundle: ${OLD_BUNDLE:-<unknown>}"
fi

# ── 2. Push (unless skipped) ─────────────────────────────────────────────
if [ "$SKIP_PUSH" -eq 0 ]; then
    log "Pushing to origin/$BRANCH..."
    if ! git diff-index --quiet HEAD --; then
        warn "You have uncommitted changes — they will NOT be deployed."
    fi
    git push origin "$BRANCH"
    ok "Pushed."
else
    log "Skipping push (--skip-push)"
fi

LOCAL_SHA="$(git rev-parse --short HEAD)"
log "Local HEAD: $LOCAL_SHA"

# ── 3. Remote deploy ─────────────────────────────────────────────────────
log "Deploying to droplet..."

ssh $SSH_OPTS "$DROPLET_USER@$DROPLET_HOST" bash <<REMOTE
set -euo pipefail
cd "$REMOTE_DIR"
echo "── Remote host: \$(hostname)"
echo "── Pulling..."
git pull origin main 2>&1 | tail -5
REMOTE_SHA=\$(git rev-parse --short HEAD)
echo "── Remote HEAD: \$REMOTE_SHA"
if [ "\$REMOTE_SHA" != "$LOCAL_SHA" ]; then
    echo "WARNING: remote HEAD (\$REMOTE_SHA) does not match local ($LOCAL_SHA)"
fi
echo "── Rebuilding Docker image..."
docker compose up -d --build --force-recreate 2>&1 | tail -10
echo "── Final container status:"
docker compose ps
REMOTE

ok "Remote deploy complete."

# ── 4. Verify new bundle is live ─────────────────────────────────────────
if [ "$NO_VERIFY" -eq 0 ]; then
    log "Waiting 5s for container to settle..."
    sleep 5

    NEW_BUNDLE="$(curl -s "$LIVE_URL" | grep -oE 'src="/assets/index-[^"]+\.js"' | head -1 || true)"
    log "New live bundle:     ${NEW_BUNDLE:-<unknown>}"

    if [ -z "$NEW_BUNDLE" ]; then
        warn "Could not read bundle hash from $LIVE_URL — site may still be restarting."
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
