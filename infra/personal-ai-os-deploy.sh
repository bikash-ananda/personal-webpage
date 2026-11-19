#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/opt/personal-ai-os"
BRANCH="integration/bikash-personal-ai-os"
DEPLOY_SHA="${SSH_ORIGINAL_COMMAND:-}"
COMPOSE=(docker compose -p personal-ai-os-preview -f infra/docker-compose.preview.yml)

if [[ ! "$DEPLOY_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Rejected: expected one full 40-character commit SHA."
  exit 2
fi

cd "$APP_DIR"
git fetch --no-tags origin "$BRANCH"
BRANCH_SHA="$(git rev-parse FETCH_HEAD)"
if [[ "$DEPLOY_SHA" != "$BRANCH_SHA" ]]; then
  echo "Skipped stale deployment request; requested=$DEPLOY_SHA current=$BRANCH_SHA"
  exit 3
fi

PREVIOUS_SHA="$(git rev-parse HEAD)"
rollback() {
  local status=$?
  if [[ $status -ne 0 ]]; then
    echo "Deployment failed; attempting rollback to $PREVIOUS_SHA"
    git checkout --detach "$PREVIOUS_SHA" || true
    "${COMPOSE[@]}" up -d --build || true
    echo "Rollback attempt finished; inspect container health and logs."
  fi
  exit "$status"
}
trap rollback EXIT

git checkout --detach "$DEPLOY_SHA"
"${COMPOSE[@]}" up -d --build

healthy=0
for attempt in $(seq 1 36); do
  if curl --fail --silent --show-error http://127.0.0.1:3107/ >/dev/null 2>&1; then
    state="$(docker inspect --format '{{.State.Health.Status}}' personal-ai-os-preview-web 2>/dev/null || true)"
    if [[ "$state" == "healthy" ]]; then
      healthy=1
      break
    fi
  fi
  sleep 5
done

if [[ "$healthy" -ne 1 ]]; then
  echo "New deployment did not become healthy within 180 seconds."
  "${COMPOSE[@]}" ps -a
  "${COMPOSE[@]}" logs --tail 100 web || true
  exit 1
fi

trap - EXIT
echo "Deployment successful: $DEPLOY_SHA"
"${COMPOSE[@]}" ps
