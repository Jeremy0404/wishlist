#!/usr/bin/env bash
# Runs deploy/backup-freshness-check.sh against a fake Discord webhook and checks
# it posts once when backups go stale, a daily reminder, and once on recovery.
#
# Usage: deploy/backup-freshness-check.test.sh

set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd -P)"
WORK="$(mktemp -d)"
PORT=$(( 20000 + RANDOM % 20000 ))
HOOKS="${WORK}/hooks.log"
failures=0

python3 - "${PORT}" "${HOOKS}" <<'PY' &
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers["Content-Length"]))
        with open(sys.argv[2], "a", encoding="utf-8") as log:
            log.write(f"{self.path} {body.decode()}\n")
        self.send_response(204)
        self.end_headers()

    def log_message(self, *args):
        pass

HTTPServer(("127.0.0.1", int(sys.argv[1])), Handler).serve_forever()
PY
server_pid=$!
trap 'kill "${server_pid}"; rm -rf "${WORK}"' EXIT
for _ in $(seq 50); do (exec 3<>"/dev/tcp/127.0.0.1/${PORT}") 2>/dev/null && break; sleep 0.1; done

mkdir -p "${WORK}/deploy/backups"
cp "${SCRIPT_DIR}/backup-freshness-check.sh" "${SCRIPT_DIR}/notify.sh" "${WORK}/deploy/"
printf 'ALERT_WEBHOOK_URL=http://127.0.0.1:%s/alert\nINFO_WEBHOOK_URL=http://127.0.0.1:%s/info\n' \
  "${PORT}" "${PORT}" >"${WORK}/deploy/.env"

run() { "${WORK}/deploy/backup-freshness-check.sh" >/dev/null 2>&1; echo $?; }
posts() { if [[ -f "${HOOKS}" ]]; then wc -l <"${HOOKS}"; else echo 0; fi; }
last() { tail -n 1 "${HOOKS}" | cut -d' ' -f2- | python3 -c 'import json,sys; print(json.load(sys.stdin)["content"])'; }
expect() {
  if [[ "$2" == "$3" ]]; then echo "ok   $1"; else echo "FAIL $1: expected '$3', got '$2'"; failures=$(( failures + 1 )); fi
}

expect "missing backups fail" "$(run)" 1
expect "missing backups alert once" "$(posts)" 1
expect "alert format" "$(last)" \
  "[critical] wishlist — no encrypted database dump found; no encrypted uploads archive found — data written since then would be lost — check logs/backup.log on the server"
run >/dev/null
expect "no repeat within a day" "$(posts)" 1

echo "stale 0" >"${WORK}/deploy/.backup-freshness-state"
run >/dev/null
expect "daily reminder" "$(posts)" 2

touch "${WORK}/deploy/backups/wishlist-x.sql.age" "${WORK}/deploy/backups/wishlist-uploads-x.tar.age"
expect "fresh backups pass" "$(run)" 0
expect "recovery posted" "$(last)" "[info] wishlist — backups are fresh again — none — nothing to do"
run >/dev/null
expect "no repeat once fresh" "$(posts)" 3

touch -d '3 days ago' "${WORK}/deploy/backups/wishlist-uploads-x.tar.age"
expect "a stale uploads archive alone fails" "$(run)" 1
expect "stale uploads alert" "$(last)" \
  "[critical] wishlist — latest uploads archive is 72h old, over 26h — data written since then would be lost — check logs/backup.log on the server"

if (( failures > 0 )); then
  echo "${failures} failed"
  exit 1
fi
echo "all passed"
