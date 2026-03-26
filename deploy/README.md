# Production deployment (single VPS)

Matches `ARCHITECTURE.md` §7: Nginx on the host, Go API + Postgres in Docker, TLS via Let’s Encrypt.

## 1. Server prerequisites

- Docker Engine + Compose plugin
- Nginx
- Certbot (`certbot` package)

## 2. Configuration

On the server:

```bash
cd /opt/todoflow   # or your path
cp deploy/env.example deploy/.env
chmod 600 deploy/.env
# Edit deploy/.env — strong POSTGRES_PASSWORD, DATABASE_URL, CORS_ORIGIN (https://your.domain)
```

## 3. Start the stack

```bash
docker compose -f deploy/docker-compose.prod.yaml --env-file deploy/.env up -d --build
curl -sS http://127.0.0.1:8080/healthz
```

Postgres and the API listen on `127.0.0.1` only.

## 4. Nginx + TLS

1. Copy `deploy/nginx/todoflow.conf` to `/etc/nginx/sites-available/todoflow` and replace `example.com` with your hostname.
2. For first issuance, temporarily serve **only** the HTTP `server` block (comment out the `return 301` to HTTPS if you do not have certs yet), or use `certbot certonly --standalone` during a short maintenance window.
3. Recommended: `certbot certonly --webroot -w /var/www/certbot -d your.domain ...` with the `/.well-known/acme-challenge/` location as in the sample config.
4. Uncomment the HTTPS `server` block; set `ssl_certificate` / `ssl_certificate_key` to `/etc/letsencrypt/live/your.domain/`.
5. `sudo nginx -t && sudo systemctl reload nginx`
6. Set `CORS_ORIGIN` in `deploy/.env` to `https://your.domain` and recreate the API container.

Static SPA files: build the frontend and sync artifacts to `/var/www/todoflow/static` (see `root` in the HTTPS block).

## 5. Remote deploy from your machine

```bash
export DEPLOY_HOST=your.vps
export DEPLOY_USER=deploy      # optional
export DEPLOY_PATH=/opt/todoflow   # optional
./deploy/scripts/deploy.sh
```

Requires `rsync` and `ssh`. Does **not** overwrite remote `deploy/.env`.

## 6. Staging deploy (from your machine)

Staging deploy uses the same rsync+ssh flow, but also validates the public URL
via `curl` and writes a local `STAGING.md` after successful health checks.

Create a local-only env file (do not commit it):

```bash
cp deploy/env.staging.example .env.staging
$EDITOR .env.staging
make deploy-staging
```

## 6. Backups

```bash
BACKUP_DIR=/var/backups/todoflow RETENTION_DAYS=14 ./deploy/scripts/backup-db.sh
```

Cron example: `deploy/cron/todoflow-backup.example`.

## 7. Optional: API image from a registry

In `deploy/.env` set `API_IMAGE=ghcr.io/your-org/todoflow-api:tag`. Remove or override the `build:` section in `docker-compose.prod.yaml` if you only pull prebuilt images (Compose v2 supports `build` + `image` together for local builds; for pull-only, use a small override file or edit the service to `image` only).
