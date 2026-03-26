# TodoFlow staging

## Frontend (Cloudflare Pages)

- **URL:** https://todoflow-staging.pages.dev
- **Cloudflare Pages project:** `todoflow-staging`
- **Account ID (wrangler):** `353a69adadf77371f073ef6bb0a66f4c`

### How to deploy the frontend

1. Build artifacts:

   ```bash
   cd web && npm ci && npm run build
   ```

2. Deploy to Pages (from repo root):

   ```bash
   CLOUDFLARE_ACCOUNT_ID=353a69adadf77371f073ef6bb0a66f4c \
     wrangler pages deploy web/dist --project-name todoflow-staging
   ```

3. **Credentials:** use `wrangler login` or `CLOUDFLARE_API_TOKEN` with Pages deploy permissions. Store tokens in your password manager — do not commit them.

Each upload may show a unique preview hostname; the stable site URL remains **https://todoflow-staging.pages.dev**.

### Access

The app does not use a separate login; it derives an anonymous user id in **browser localStorage**. Cloudflare / deploy credentials live outside the repo.

## Backend / API

**The Go API is not served by Cloudflare Pages.** The SPA calls `/api/*` on the same origin as the static host. Until a Worker route, reverse proxy, or a build-time API base URL is added, API calls from this deployment will not reach the backend.

For a full-stack staging environment, deploy the API using the VPS flow in `deploy/README.md` and wire browser access (CORS + public API URL or proxy) accordingly.

## Smoke checks

- Static site responds:

  ```bash
  curl -fsS -o /dev/null -w '%{http_code}\n' https://todoflow-staging.pages.dev/
  ```

## Known limitations vs production

- **Frontend-only** on this URL unless API routing is configured.
- No application `/healthz` on Pages (static HTML/JS only); health checks for the API belong on the API host when it is deployed.
