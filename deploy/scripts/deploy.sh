#!/usr/bin/env bash
# Sync repo to a VPS and rebuild/restart the production compose stack.
#
# Required env:
#   DEPLOY_HOST   — hostname or IP
# Optional:
#   DEPLOY_USER   — SSH user (default: deploy)
#   DEPLOY_PATH   — remote directory (default: /opt/todoflow)
#   SSH_IDENTITY  — path to private key (-i)
#
# Usage:
#   export DEPLOY_HOST=vps.example.com
#   ./deploy/scripts/deploy.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/todoflow}"
DEPLOY_HOST="${DEPLOY_HOST:-}"

if [[ -z "${DEPLOY_HOST}" ]]; then
    echo "error: set DEPLOY_HOST" >&2
    exit 1
fi

SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new)
if [[ -n "${SSH_IDENTITY:-}" ]]; then
    SSH_OPTS+=(-i "${SSH_IDENTITY}")
fi

RSYNC_RSH="ssh ${SSH_OPTS[*]}"
export RSYNC_RSH

REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"
TARGET="${REMOTE}:${DEPLOY_PATH}/"

echo "==> rsync ${REPO_ROOT}/ -> ${TARGET}"
rsync -avz --delete \
    --exclude '.git/' \
    --exclude '.env' \
    --exclude 'deploy/.env' \
    --exclude '.runtime/' \
    --exclude '.cursor/' \
    --exclude '.beads/' \
    --exclude 'mail/' \
    --exclude '*.exe' \
    --exclude 'server' \
    "${REPO_ROOT}/" "${TARGET}"

REMOTE_CMD=$(cat <<EOF
set -euo pipefail
cd '${DEPLOY_PATH}'
if [[ ! -f deploy/.env ]]; then
  echo "error: ${DEPLOY_PATH}/deploy/.env missing — copy deploy/env.example and edit secrets." >&2
  exit 1
fi
docker compose -f deploy/docker-compose.prod.yaml --env-file deploy/.env pull 2>/dev/null || true
docker compose -f deploy/docker-compose.prod.yaml --env-file deploy/.env build --pull
docker compose -f deploy/docker-compose.prod.yaml --env-file deploy/.env up -d
docker compose -f deploy/docker-compose.prod.yaml --env-file deploy/.env ps
EOF
)

echo "==> ssh ${REMOTE} (compose up)"
ssh "${SSH_OPTS[@]}" "${REMOTE}" bash -s <<< "${REMOTE_CMD}"

echo "==> done"
