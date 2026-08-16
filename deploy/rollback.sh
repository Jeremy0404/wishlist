#!/usr/bin/env bash
# Roll the web and api services back (or forward) to a specific, already-published and
# signed image tag. Never touches the database: no migrations, no
# `docker compose down -v`, nothing that can drop or reset volumes.
#
# Usage: deploy/rollback.sh <version>
# Example: deploy/rollback.sh 1.4.2

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd -P)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.prod.yml"
ENV_FILE="${SCRIPT_DIR}/.env"
TIMEOUT_SECONDS="${ROLLBACK_TIMEOUT_SECONDS:-120}"
POLL_INTERVAL_SECONDS="${ROLLBACK_POLL_INTERVAL_SECONDS:-3}"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <version>" >&2
  exit 1
fi

target_version="$1"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy deploy/.env.example to deploy/.env first." >&2
  exit 1
fi

# Load APP_PORT (and everything else) from .env so the health check hits the
# same loopback port the stack was actually published on.
set -a
# shellcheck source=/dev/null
source "${ENV_FILE}"
set +a

HEALTH_URL="${ROLLBACK_HEALTH_URL:-http://127.0.0.1:${APP_PORT:-3005}/api/health}"

if ! grep -q '^RELEASE_VERSION=' "${ENV_FILE}"; then
  echo "RELEASE_VERSION not found in ${ENV_FILE}." >&2
  exit 1
fi

echo "Rolling app to version ${target_version}..."

# Rewrite RELEASE_VERSION in place. This is the only edit made to .env.
tmp_env="$(mktemp)"
sed "s/^RELEASE_VERSION=.*/RELEASE_VERSION=${target_version}/" "${ENV_FILE}" >"${tmp_env}"
mv "${tmp_env}" "${ENV_FILE}"

# The earlier `source .env` already exported RELEASE_VERSION with its old
# value, and Compose prefers an exported shell var over --env-file, so the
# rewrite above would otherwise be silently shadowed at pull/up time. See
# Knowledge/tech/env_file_rewrite_shadowed_by_stale_shell_export_gotcha.md.
export RELEASE_VERSION="${target_version}"

# wishlist ships two application images (web and api) under the same tag, so
# both are rolled together. postgres is deliberately excluded: --no-deps keeps
# the database untouched, exactly as the single-service template intended.
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" pull web api
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d --no-deps web api

echo "Waiting for ${HEALTH_URL} to report healthy (timeout ${TIMEOUT_SECONDS}s)..."

# X-Forwarded-Proto: https is sent unconditionally. An app that doesn't check
# it (most don't) just ignores the header; an app that enforces HTTPS via
# trustProxy/similar would otherwise 426 a loopback probe that never actually
# went through NPM's TLS termination — see
# Knowledge/tech/https_enforcement_vs_loopback_health_check_gotcha.md. If
# this app does enforce HTTPS, its trusted-proxy/CIDR config must also cover
# the Docker bridge gateway address this probe connects from, not just NPM's
# address — check `docker logs` for the actual remoteAddress if unsure.
elapsed=0
until curl --silent --fail --max-time 5 -H 'X-Forwarded-Proto: https' "${HEALTH_URL}" >/dev/null 2>&1; do
  if (( elapsed >= TIMEOUT_SECONDS )); then
    echo "Timed out waiting for the app to become healthy after rollback." >&2
    exit 1
  fi
  sleep "${POLL_INTERVAL_SECONDS}"
  elapsed=$((elapsed + POLL_INTERVAL_SECONDS))
done

echo "App is healthy on version ${target_version}."
