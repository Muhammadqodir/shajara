#!/usr/bin/env bash
#
# deploy.sh — deploy Shajara (Laravel + Inertia/React) on a server.
#
# Run this ON the server, from inside the project directory (or anywhere —
# the script cd's to its own location). It pulls the latest code, installs
# dependencies, builds front-end assets, runs migrations and refreshes the
# framework caches, putting the app in maintenance mode while it works.
#
# Usage:
#   ./deploy.sh                 # deploy the configured branch
#   BRANCH=main ./deploy.sh     # override the branch
#   SKIP_MIGRATIONS=1 ./deploy.sh
#
# First time:  chmod +x deploy.sh
#
set -euo pipefail

# ----------------------------------------------------------------------------
# Configuration (override any of these via environment variables)
# ----------------------------------------------------------------------------
BRANCH="${BRANCH:-main}"                 # git branch to deploy
GIT_REMOTE="${GIT_REMOTE:-origin}"       # git remote to pull from
PHP_BIN="${PHP_BIN:-php}"                # path to the PHP binary
COMPOSER_BIN="${COMPOSER_BIN:-composer}" # path to composer
NPM_BIN="${NPM_BIN:-npm}"                # path to npm

SKIP_GIT="${SKIP_GIT:-0}"                # 1 = don't touch git (code deployed another way)
SKIP_MIGRATIONS="${SKIP_MIGRATIONS:-0}"  # 1 = don't run migrations
SKIP_ASSETS="${SKIP_ASSETS:-0}"          # 1 = don't build front-end assets
RESTART_QUEUE="${RESTART_QUEUE:-1}"      # 1 = php artisan queue:restart
RELOAD_PHP_FPM="${RELOAD_PHP_FPM:-0}"    # 1 = reload php-fpm (set PHP_FPM_SERVICE)
PHP_FPM_SERVICE="${PHP_FPM_SERVICE:-php8.4-fpm}"
USE_MAINTENANCE="${USE_MAINTENANCE:-1}"  # 1 = put app in maintenance mode during deploy

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
log()  { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# Move to the project root (directory this script lives in)
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ----------------------------------------------------------------------------
# Pre-flight checks
# ----------------------------------------------------------------------------
log "Pre-flight checks"
[ -f artisan ]   || die "artisan not found — run this from the Laravel project root."
[ -f .env ]      || die ".env not found — create it on the server before deploying."
command -v "$PHP_BIN" >/dev/null      || die "PHP binary '$PHP_BIN' not found."
command -v "$COMPOSER_BIN" >/dev/null || die "Composer '$COMPOSER_BIN' not found."
ok "Environment looks good"

# ----------------------------------------------------------------------------
# Maintenance mode (restored automatically on exit, even on failure)
# ----------------------------------------------------------------------------
bring_up() {
    if [ "$USE_MAINTENANCE" = "1" ]; then
        "$PHP_BIN" artisan up >/dev/null 2>&1 || true
        ok "Application is live"
    fi
}
trap bring_up EXIT

if [ "$USE_MAINTENANCE" = "1" ]; then
    log "Enabling maintenance mode"
    "$PHP_BIN" artisan down --retry=15 >/dev/null 2>&1 || true
fi

# ----------------------------------------------------------------------------
# Pull latest code
# ----------------------------------------------------------------------------
if [ "$SKIP_GIT" != "1" ]; then
    log "Fetching latest code ($GIT_REMOTE/$BRANCH)"
    git fetch --prune "$GIT_REMOTE"
    git checkout "$BRANCH"
    git reset --hard "$GIT_REMOTE/$BRANCH"
    ok "Code updated to $(git rev-parse --short HEAD)"
else
    log "Skipping git (SKIP_GIT=1)"
fi

# ----------------------------------------------------------------------------
# PHP dependencies
# ----------------------------------------------------------------------------
log "Installing PHP dependencies"
"$COMPOSER_BIN" install --no-interaction --prefer-dist --optimize-autoloader --no-dev
ok "Composer dependencies installed"

# ----------------------------------------------------------------------------
# Front-end assets
# ----------------------------------------------------------------------------
if [ "$SKIP_ASSETS" != "1" ]; then
    log "Building front-end assets"
    command -v "$NPM_BIN" >/dev/null || die "npm '$NPM_BIN' not found (set SKIP_ASSETS=1 to skip)."
    if [ -f package-lock.json ]; then
        "$NPM_BIN" ci
    else
        "$NPM_BIN" install
    fi
    "$NPM_BIN" run build
    ok "Assets built"
else
    log "Skipping asset build (SKIP_ASSETS=1)"
fi

# ----------------------------------------------------------------------------
# Clear stale caches before migrating / re-caching
# ----------------------------------------------------------------------------
log "Clearing caches"
"$PHP_BIN" artisan optimize:clear
ok "Caches cleared"

# ----------------------------------------------------------------------------
# Database migrations
# ----------------------------------------------------------------------------
if [ "$SKIP_MIGRATIONS" != "1" ]; then
    log "Running migrations"
    "$PHP_BIN" artisan migrate --force
    ok "Migrations complete"
else
    log "Skipping migrations (SKIP_MIGRATIONS=1)"
fi

# ----------------------------------------------------------------------------
# Storage symlink + framework caches
# ----------------------------------------------------------------------------
log "Linking storage and caching framework files"
"$PHP_BIN" artisan storage:link >/dev/null 2>&1 || true
"$PHP_BIN" artisan config:cache
"$PHP_BIN" artisan route:cache
"$PHP_BIN" artisan view:cache
"$PHP_BIN" artisan event:cache >/dev/null 2>&1 || true
ok "Framework caches primed"

# ----------------------------------------------------------------------------
# Restart workers / reload PHP-FPM
# ----------------------------------------------------------------------------
if [ "$RESTART_QUEUE" = "1" ]; then
    log "Restarting queue workers"
    "$PHP_BIN" artisan queue:restart >/dev/null 2>&1 || true
    ok "Queue workers signalled to restart"
fi

if [ "$RELOAD_PHP_FPM" = "1" ]; then
    log "Reloading $PHP_FPM_SERVICE"
    sudo systemctl reload "$PHP_FPM_SERVICE" || die "Failed to reload $PHP_FPM_SERVICE"
    ok "PHP-FPM reloaded"
fi

# ----------------------------------------------------------------------------
# Done — the EXIT trap brings the app back up
# ----------------------------------------------------------------------------
log "Deployment finished successfully 🎉"
