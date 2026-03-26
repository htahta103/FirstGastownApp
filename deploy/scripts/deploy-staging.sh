#!/usr/bin/env bash
set -euo pipefail

# Staging deployment wrapper.
# Requires secrets on the target server at deploy/.env (see deploy/env.example + deploy/README.md).
#
# Required env vars:
#   DEPLOY_HOST_STAGING  - staging hostname/IP
#   STAGING_URL          - full URL (scheme + host), e.g. https://staging.example.com
# Optional:
#   DEPLOY_USER          - ssh user (default: deploy)
#   DEPLOY_PATH          - remote path (default: /opt/todoflow)
#   HEALTH_PATH         - default: /healthz
#   ROOT_PATH           - default: /

DEPLOY_HOST_STAGING="${DEPLOY_HOST_STAGING:-}"
STAGING_URL="${STAGING_URL:-}"

DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/todoflow}"
HEALTH_PATH="${HEALTH_PATH:-/healthz}"
ROOT_PATH="${ROOT_PATH:-/}"

if [[ -z "${DEPLOY_HOST_STAGING}" ]]; then
  echo "error: set DEPLOY_HOST_STAGING (or put it in ./deploy/staging.env)" >&2
  exit 1
fi

if [[ -z "${STAGING_URL}" ]]; then
  echo "error: set STAGING_URL (include scheme), e.g. https://staging.example.com (or put it in ./deploy/staging.env)" >&2
  exit 1
fi

echo "==> Deploying to staging ${DEPLOY_USER}@${DEPLOY_HOST_STAGING}:${DEPLOY_PATH}"
DEPLOY_HOST="${DEPLOY_HOST_STAGING}" DEPLOY_USER="${DEPLOY_USER}" DEPLOY_PATH="${DEPLOY_PATH}" bash ./deploy/scripts/deploy.sh

echo "==> Waiting for staging API health: ${STAGING_URL}${HEALTH_PATH}"
# Wait up to ~2 minutes.
for _ in $(seq 1 12); do
  if curl -fsS "${STAGING_URL}${HEALTH_PATH}" >/dev/null 2>&1; then
    echo "==> healthz OK"
    break
  fi
  sleep 10
done

curl -fsS "${STAGING_URL}${HEALTH_PATH}" >/dev/null

echo "==> Smoke-check root page: ${STAGING_URL}${ROOT_PATH}"
curl -fsS "${STAGING_URL}${ROOT_PATH}" -o /dev/null

cat > STAGING.md <<EOF
# TodoFlow Staging

- URL: ${STAGING_URL}
- Deployed by: ${DEPLOY_USER}@${DEPLOY_HOST_STAGING}:${DEPLOY_PATH}

## Smoke tests

- curl -fsS '${STAGING_URL}${HEALTH_PATH}'
- curl -fsS '${STAGING_URL}${ROOT_PATH}'

Known limitations vs production:
- Environment parity depends on deploy/.env and fully completed QA/E2E runs.
EOF

echo "==> wrote STAGING.md"

