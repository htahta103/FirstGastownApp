#!/usr/bin/env bash
# Nightly-style pg_dump of the Postgres service from docker-compose.prod.
#
# Env (or source deploy/.env):
#   BACKUP_DIR       — output directory (default: ./backups)
#   RETENTION_DAYS   — delete older *.sql.gz (default: 14, 0 = disable)
#
# Run from repo root on the server, e.g. cron:
#   0 3 * * * cd /opt/todoflow && /opt/todoflow/deploy/scripts/backup-db.sh >>/var/log/todoflow-backup.log 2>&1
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${REPO_ROOT}/deploy/.env"
COMPOSE_FILE="${REPO_ROOT}/deploy/docker-compose.prod.yaml"

if [[ ! -f "${ENV_FILE}" ]]; then
    echo "error: ${ENV_FILE} not found (copy deploy/env.example)." >&2
    exit 1
fi

set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

BACKUP_DIR="${BACKUP_DIR:-${REPO_ROOT}/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
POSTGRES_USER="${POSTGRES_USER:-todoflow}"
POSTGRES_DB="${POSTGRES_DB:-todoflow}"

mkdir -p "${BACKUP_DIR}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR}/todoflow-${STAMP}.sql.gz"

cd "${REPO_ROOT}"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" exec -T db \
    pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --no-owner \
    | gzip -c > "${OUT}"

echo "backup written: ${OUT}"

if [[ "${RETENTION_DAYS}" =~ ^[0-9]+$ ]] && [[ "${RETENTION_DAYS}" -gt 0 ]]; then
    find "${BACKUP_DIR}" -maxdepth 1 -name 'todoflow-*.sql.gz' -type f -mtime "+${RETENTION_DAYS}" -print -delete || true
fi
