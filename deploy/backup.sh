#!/usr/bin/env bash
# Dump PostgreSQL *and* the uploads volume, encrypt both with age, and ship
# them off-host.
#
# The uploads volume is not optional extra credit: it holds every item image,
# and a restore that brings back the database without it returns the app with
# all of them broken (issue #63, ADR 2026-08-16-uploads-on-a-host-volume).
#
# Reads secrets/config from deploy/.env: POSTGRES_DB, POSTGRES_USER,
# BACKUP_AGE_RECIPIENT, BACKUP_OFFHOST_DESTINATION. Nothing is hardcoded.
#
# Usage: deploy/backup.sh
# Intended to run on the host, e.g. from cron, with the postgres service of
# deploy/docker-compose.prod.yml already up.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd -P)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.prod.yml"
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

: "${POSTGRES_DB:?POSTGRES_DB must be set in deploy/.env}"
: "${POSTGRES_USER:?POSTGRES_USER must be set in deploy/.env}"
: "${BACKUP_AGE_RECIPIENT:?BACKUP_AGE_RECIPIENT must be set in deploy/.env}"

if [[ -z "${BACKUP_OFFHOST_DESTINATION:-}" ]]; then
  echo "BACKUP_OFFHOST_DESTINATION is not set; the encrypted dump will be" >&2
  echo "kept in ${BACKUP_DIR} only, not shipped off-host." >&2
fi

mkdir -p "${BACKUP_DIR}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
dump_file="${BACKUP_DIR}/wishlist-${timestamp}.sql"
encrypted_file="${dump_file}.age"

echo "Dumping database ${POSTGRES_DB}..."
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" exec -T postgres \
  pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >"${dump_file}"

echo "Encrypting dump with age..."
age -r "${BACKUP_AGE_RECIPIENT}" -o "${encrypted_file}" "${dump_file}"
rm -f "${dump_file}"

# The uploads volume is a named Docker volume, so it is read through a
# throwaway container rather than straight off the filesystem.
uploads_volume="wishlist-uploads"
uploads_file="${BACKUP_DIR}/wishlist-uploads-${timestamp}.tar"
encrypted_uploads_file="${uploads_file}.age"

echo "Archiving the uploads volume..."
docker run --rm -v "${uploads_volume}:/data:ro" alpine:3 \
  tar -cf - -C /data . >"${uploads_file}"

echo "Encrypting uploads archive with age..."
age -r "${BACKUP_AGE_RECIPIENT}" -o "${encrypted_uploads_file}" "${uploads_file}"
rm -f "${uploads_file}"

if [[ -n "${BACKUP_OFFHOST_DESTINATION:-}" ]]; then
  echo "Shipping ${encrypted_file} and ${encrypted_uploads_file} to ${BACKUP_OFFHOST_DESTINATION}..."
  cp "${encrypted_uploads_file}" "${BACKUP_OFFHOST_DESTINATION}/"
  # Placeholder off-host transfer. The real destination is host-specific and
  # should be filled in when this stack is provisioned (e.g. an rsync target
  # over SSH, an object storage mount, ...). A local `cp` to a mounted path
  # is a reasonable default until then.
  cp "${encrypted_file}" "${BACKUP_OFFHOST_DESTINATION}/"
fi

echo "Backup complete: ${encrypted_file} and ${encrypted_uploads_file}"
