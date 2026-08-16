#!/usr/bin/env bash
# Alert to Discord if the newest encrypted backup is older than
# BACKUP_MAX_AGE_HOURS (or missing). Intended to run from cron, separately
# from deploy/backup.sh, so a stuck or failing backup job still gets caught.
#
# Usage: deploy/backup-freshness-check.sh
# Cron example (every hour):
#   0 * * * * /path/to/repo/deploy/backup-freshness-check.sh

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd -P)"
ENV_FILE="${SCRIPT_DIR}/.env"
BACKUP_DIR="${BACKUP_DIR:-${SCRIPT_DIR}/backups}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy deploy/.env.example to deploy/.env first." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "${ENV_FILE}"
set +a

# Alerting is optional for wishlist (no Discord webhook configured yet, tracked
# as a follow-up issue). Without one the check still runs and still fails loudly
# on stale backups — it just has nowhere to push the alert.
max_age_hours="${BACKUP_MAX_AGE_HOURS:-26}"

alert() {
  local message="$1"
  if [[ -z "${BACKUP_ALERT_DISCORD_WEBHOOK:-}" ]]; then
    echo "No BACKUP_ALERT_DISCORD_WEBHOOK set; not sending: ${message}" >&2
    return 0
  fi
  curl --silent --fail --max-time 10 \
    -H 'Content-Type: application/json' \
    -d "{\"content\": \"${message}\"}" \
    "${BACKUP_ALERT_DISCORD_WEBHOOK}" >/dev/null
}

# Both halves of a restore are checked independently: a fresh database dump
# next to a stale uploads archive is still a broken restore.
newest_matching() {
  find "${BACKUP_DIR}" -maxdepth 1 -name "$1" -type f -printf '%T@ %p\n' 2>/dev/null \
    | sort -rn | head -n 1 | cut -d' ' -f2-
}

latest_backup="$(newest_matching '*.sql.age')"
latest_uploads="$(newest_matching '*-uploads-*.tar.age')"

if [[ -z "${latest_backup}" ]]; then
  alert "wishlist backup alert: no encrypted database backup found in ${BACKUP_DIR}."
  echo "No database backup found in ${BACKUP_DIR}." >&2
  exit 1
fi

if [[ -z "${latest_uploads}" ]]; then
  alert "wishlist backup alert: no encrypted uploads archive found in ${BACKUP_DIR}."
  echo "No uploads archive found in ${BACKUP_DIR}." >&2
  exit 1
fi

now_epoch="$(date +%s)"
stale=0

for artefact in "${latest_backup}" "${latest_uploads}"; do
  age_hours=$(( (now_epoch - $(date -r "${artefact}" +%s)) / 3600 ))
  if (( age_hours > max_age_hours )); then
    alert "wishlist backup alert: $(basename "${artefact}") is ${age_hours}h old, exceeding the ${max_age_hours}h threshold."
    echo "$(basename "${artefact}") is ${age_hours}h old (threshold ${max_age_hours}h)." >&2
    stale=1
  else
    echo "$(basename "${artefact}") is ${age_hours}h old, within threshold."
  fi
done

exit "${stale}"
