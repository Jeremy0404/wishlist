#!/usr/bin/env bash
#
# notify.sh — post one notification to Discord, in the shared notification format.
#
#   notify.sh <critical|warning|info|recovery> <app> <what is wrong> <impact> <first thing to do>
#   notify.sh --test <app>    # one test message to each channel
#
# critical and warning go to ALERT_WEBHOOK_URL (the app's alert channel), info to
# INFO_WEBHOOK_URL (info-apps). recovery is posted as [info] to the alert channel, where
# the alert it closes was. Both must be set, or nothing is sent and it exits 78.
# The webhook URL is passed to curl through its config on stdin, never through argv.

set -euo pipefail

EXIT_USAGE=64
EXIT_CONFIG=78

usage() {
  echo "usage: notify.sh <critical|warning|info|recovery> <app> <what> <impact> <action>" >&2
  echo "       notify.sh --test <app>" >&2
  exit "$EXIT_USAGE"
}

require_webhooks() {
  local name
  for name in ALERT_WEBHOOK_URL INFO_WEBHOOK_URL; do
    if [[ -z "${!name:-}" ]]; then
      echo "notify: $name is not set, refusing to run without both webhooks" >&2
      exit "$EXIT_CONFIG"
    fi
  done
}

post() {
  local url="$1" content="$2" payload
  payload="$(jq -cn --arg content "$content" '{content: $content, allowed_mentions: {parse: []}}')"
  if ! printf 'url = "%s"\n' "$url" | curl --config - --silent --show-error --fail --max-time 10 \
      -H 'Content-Type: application/json' --data-binary "$payload" -o /dev/null; then
    echo "notify: the post to Discord failed" >&2
    return 1
  fi
}

format() {
  printf '[%s] %s — %s — %s — %s' "$@"
}

if [[ "${1:-}" == "--test" ]]; then
  if (( $# != 2 )) || [[ -z "$2" ]]; then
    usage
  fi
  require_webhooks
  post "$ALERT_WEBHOOK_URL" "$(format warning "$2" "test of the alert channel" "none" "nothing to do")"
  post "$INFO_WEBHOOK_URL" "$(format info "$2" "test of the info channel" "none" "nothing to do")"
  exit 0
fi

(( $# == 5 )) || usage
for field in "$@"; do
  [[ -n "$field" ]] || usage
done

require_webhooks
case "$1" in
  critical | warning) post "$ALERT_WEBHOOK_URL" "$(format "$@")" ;;
  info) post "$INFO_WEBHOOK_URL" "$(format "$@")" ;;
  recovery) post "$ALERT_WEBHOOK_URL" "$(format info "${@:2}")" ;;
  *) usage ;;
esac
