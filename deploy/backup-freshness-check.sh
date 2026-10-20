#!/usr/bin/env bash
# Alert when the newest encrypted database dump or uploads archive is older
# than BACKUP_MAX_AGE_HOURS (or missing). Intended to run from cron, separately
# from deploy/backup.sh, so a stuck or failing backup job still gets caught.
#
# Posts through deploy/notify.sh: once when backups go stale, at most once a
# day while they stay stale, and once when they are fresh again.
#
# Usage: deploy/backup-freshness-check.sh
# Cron example (every hour):
#   0 * * * * /path/to/repo/deploy/backup-freshness-check.sh

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd -P)"
ENV_FILE="${SCRIPT_DIR}/.env"
BACKUP_DIR="${BACKUP_DIR:-${SCRIPT_DIR}/backups}"
STATE_FILE="${SCRIPT_DIR}/.backup-freshness-state"
NOTIFY="${SCRIPT_DIR}/notify.sh"
REMINDER_SECONDS=$(( 24 * 3600 ))

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy deploy/.env.example to deploy/.env first." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "${ENV_FILE}"
set +a

: "${ALERT_WEBHOOK_URL:?ALERT_WEBHOOK_URL must be set in deploy/.env}"
: "${INFO_WEBHOOK_URL:?INFO_WEBHOOK_URL must be set in deploy/.env}"
max_age_hours="${BACKUP_MAX_AGE_HOURS:-26}"
now_epoch="$(date +%s)"

# Both halves of a restore are checked independently: a fresh database dump
# next to a stale uploads archive is still a broken restore.
newest_matching() {
  find "${BACKUP_DIR}" -maxdepth 1 -name "$1" -type f -printf '%T@ %p\n' 2>/dev/null \
    | sort -rn | head -n 1 | cut -d' ' -f2-
}

problems=()
for kind in "database dump:*.sql.age" "uploads archive:*-uploads-*.tar.age"; do
  label="${kind%%:*}"
  artefact="$(newest_matching "${kind#*:}")"
  if [[ -z "${artefact}" ]]; then
    problems+=("no encrypted ${label} found")
    continue
  fi
  age_hours=$(( (now_epoch - $(date -r "${artefact}" +%s)) / 3600 ))
  if (( age_hours > max_age_hours )); then
    problems+=("latest ${label} is ${age_hours}h old, over ${max_age_hours}h")
  else
    echo "$(basename "${artefact}") is ${age_hours}h old, within threshold."
  fi
done

read -r previous_state last_post_epoch < <(cat "${STATE_FILE}" 2>/dev/null || echo "ok 0")

if (( ${#problems[@]} > 0 )); then
  problem="$(printf '%s; ' "${problems[@]}")"
  problem="${problem%; }"
  if [[ "${previous_state}" == "ok" ]] || (( now_epoch - last_post_epoch >= REMINDER_SECONDS )); then
    "${NOTIFY}" critical wishlist "${problem}" "data written since then would be lost" \
      "check logs/backup.log on the server"
    last_post_epoch="${now_epoch}"
  fi
  printf 'stale %s\n' "${last_post_epoch}" >"${STATE_FILE}"
  echo "Backup is stale: ${problem}." >&2
  exit 1
fi

if [[ "${previous_state}" == "stale" ]]; then
  "${NOTIFY}" recovery wishlist "backups are fresh again" "none" "nothing to do"
fi
printf 'ok 0\n' >"${STATE_FILE}"
