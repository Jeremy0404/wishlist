#!/usr/bin/env bash
# Runs deploy/backup.sh against fake docker and age commands and checks it
# archives the uploads volume Compose created, and fails without writing an
# uploads archive when that volume cannot be found.
#
# Usage: deploy/backup.test.sh

set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd -P)"
WORK="$(mktemp -d)"
trap 'rm -rf "${WORK}"' EXIT
failures=0

mkdir -p "${WORK}/deploy" "${WORK}/bin"
cp "${SCRIPT_DIR}/backup.sh" "${WORK}/deploy/"
printf 'POSTGRES_DB=wishlist\nPOSTGRES_USER=wishlist\nBACKUP_AGE_RECIPIENT=age1fake\n' \
  >"${WORK}/deploy/.env"

cat >"${WORK}/bin/docker" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
case "$1" in
  compose) echo "fake dump" ;;
  volume)
    wanted=()
    while (( $# )); do
      if [[ "$1" == --filter ]]; then wanted+=("${2#label=}"); shift; fi
      shift
    done
    while read -r name labels; do
      for label in "${wanted[@]}"; do
        [[ " ${labels} " == *" ${label} "* ]] || continue 2
      done
      echo "${name}"
    done <"${FAKE_VOLUMES}"
    ;;
  run)
    while (( $# )); do
      if [[ "$1" == -v ]]; then echo "$2" >>"${FAKE_MOUNTS}"; fi
      shift
    done
    echo "fake tar"
    ;;
  *) echo "fake docker: unexpected $*" >&2; exit 2 ;;
esac
SH

cat >"${WORK}/bin/age" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
while (( $# > 1 )); do
  if [[ "$1" == -o ]]; then out="$2"; fi
  shift
done
cp "$1" "${out}"
SH
chmod +x "${WORK}/bin/docker" "${WORK}/bin/age"

STACK="com.docker.compose.project=wishlist"
BARE_UPLOADS="wishlist-uploads"
STACK_UPLOADS="wishlist_wishlist-uploads ${STACK} com.docker.compose.volume=wishlist-uploads"
OTHER_UPLOADS="copy_wishlist-uploads ${STACK} com.docker.compose.volume=wishlist-uploads"
STACK_PG="wishlist_wishlist-pg ${STACK} com.docker.compose.volume=wishlist-pg"

run_with_volumes() {
  printf '%s\n' "$@" >"${WORK}/volumes"
  rm -rf "${WORK}/deploy/backups" "${WORK}/mounts"
  PATH="${WORK}/bin:${PATH}" FAKE_VOLUMES="${WORK}/volumes" FAKE_MOUNTS="${WORK}/mounts" \
    "${WORK}/deploy/backup.sh" >/dev/null 2>&1
  echo $?
}
archives() { find "${WORK}/deploy/backups" -name "$1" -type f 2>/dev/null | wc -l | tr -d ' '; }
mounts() { cat "${WORK}/mounts" 2>/dev/null; }
expect() {
  if [[ "$2" == "$3" ]]; then echo "ok   $1"; else echo "FAIL $1: expected '$3', got '$2'"; failures=$(( failures + 1 )); fi
}

expect "stack volumes present succeed" "$(run_with_volumes "${BARE_UPLOADS}" "${STACK_UPLOADS}" "${STACK_PG}")" 0
expect "the Compose uploads volume is archived, not the bare name" "$(mounts)" "wishlist_wishlist-uploads:/data:ro"
expect "one uploads archive written" "$(archives '*-uploads-*.tar.age')" 1

expect "missing uploads volume fails" "$(run_with_volumes "${BARE_UPLOADS}" "${STACK_PG}")" 1
expect "missing uploads volume mounts nothing" "$(mounts)" ""
expect "missing uploads volume writes no uploads archive" "$(archives '*-uploads-*.tar.age')" 0
expect "missing uploads volume still dumps the database" "$(archives 'wishlist-*.sql.age')" 1

expect "two uploads volumes fail" "$(run_with_volumes "${STACK_UPLOADS}" "${OTHER_UPLOADS}" "${STACK_PG}")" 1
expect "two uploads volumes write no uploads archive" "$(archives '*-uploads-*.tar.age')" 0

if (( failures > 0 )); then
  echo "${failures} check(s) failed" >&2
  exit 1
fi
