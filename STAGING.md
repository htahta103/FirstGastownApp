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

2. Deploy to Pages from the **web** directory (so Wrangler picks up `functions/` and the build output):

   ```bash
   cd web && npm ci && npm run build
   CLOUDFLARE_ACCOUNT_ID=353a69adadf77371f073ef6bb0a66f4c \
     npx wrangler pages deploy dist --project-name todoflow-staging
   ```

3. **Credentials:** use `wrangler login` or `CLOUDFLARE_API_TOKEN` with Pages deploy permissions. Store tokens in your password manager — do not commit them.

4. **API proxy (full-stack staging):** set the Pages environment variable **`TODFLOW_API_ORIGIN`** (Production and Preview as needed) to the **public origin** of your Go API stack — same URL a browser would use to reach `/healthz` and `/api/...` (scheme + host, no path, no trailing slash). Example: `https://staging.yourdomain.com` when Nginx terminates TLS and proxies `/api` to the API container. The Pages Function forwards same-origin `/api/*` to `${TODFLOW_API_ORIGIN}/api/*`. Ensure the API’s **`CORS_ORIGIN`** (or equivalent) allows `https://todoflow-staging.pages.dev` so preflight responses are correct when the Worker forwards requests.

Each upload may show a unique preview hostname; the stable site URL remains **https://todoflow-staging.pages.dev**.

### Access

The app does not use a separate login; it derives an anonymous user id in **browser localStorage**. Cloudflare / deploy credentials live outside the repo.

## Backend / API

Static assets are served from Pages. **`/api/*`** is handled by a [Pages Function](https://developers.cloudflare.com/pages/functions/) (`web/functions/api/[[catchall]].ts`) that reverse-proxies to the host configured in **`TODFLOW_API_ORIGIN`**. Deploy the API with the VPS flow in `deploy/README.md`, set `TODFLOW_API_ORIGIN` on the Pages project, and set API **CORS** to allow `https://todoflow-staging.pages.dev`. If `TODFLOW_API_ORIGIN` is unset, `/api/*` returns JSON **503** with a clear configuration error (not the SPA shell).

## Smoke checks

- Static site responds:

  ```bash
  curl -fsS -o /dev/null -w '%{http_code}\n' https://todoflow-staging.pages.dev/
  ```

- API proxy returns JSON (not `index.html`) when `TODFLOW_API_ORIGIN` is set and the backend is up — example:

  ```bash
  curl -fsS 'https://todoflow-staging.pages.dev/api/search?q=test' | head -c 200
  ```

  Expect a JSON array (possibly empty) or a JSON API error body — not HTML.

## Known limitations vs production

- **`TODFLOW_API_ORIGIN`** must point at a deployed API; the Pages project does not run Postgres or Go.
- No application `/healthz` on Pages (static HTML/JS only); health checks for the API belong on the API host when it is deployed.
