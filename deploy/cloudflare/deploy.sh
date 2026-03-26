#!/usr/bin/env bash
# TodoFlow API — one-command Cloudflare Workers + D1 deploy
# Usage: bash deploy.sh
set -euo pipefail

cd "$(dirname "$0")"

export CLOUDFLARE_ACCOUNT_ID=353a69adadf77371f073ef6bb0a66f4c

echo "=== Installing dependencies ==="
npm install

echo "=== Creating D1 database (skip if exists) ==="
DB_OUTPUT=$(npx wrangler d1 create todoflow-staging 2>&1 || true)
echo "$DB_OUTPUT"

# Extract database_id and patch wrangler.toml
DB_ID=$(echo "$DB_OUTPUT" | grep -o 'database_id = "[^"]*"' | head -1 | cut -d'"' -f2)
if [ -n "$DB_ID" ]; then
    echo "Patching wrangler.toml with database_id: $DB_ID"
    sed -i '' "s/database_id = \"\"/database_id = \"$DB_ID\"/" wrangler.toml
else
    echo "D1 database may already exist — check wrangler.toml has database_id filled in"
    DB_ID=$(grep 'database_id' wrangler.toml | grep -o '"[^"]*"' | tr -d '"')
    if [ -z "$DB_ID" ]; then
        echo "ERROR: No database_id found. Run 'npx wrangler d1 list' and update wrangler.toml manually."
        exit 1
    fi
fi

echo "=== Running D1 migrations ==="
npx wrangler d1 execute todoflow-staging --file=schema.sql --remote

echo "=== Deploying Worker ==="
npx wrangler deploy

echo ""
echo "=== DONE ==="
echo "API URL: https://todoflow-api-staging.htahta103.workers.dev"
echo ""
echo "Next: update frontend VITE_API_URL to point to this URL"
