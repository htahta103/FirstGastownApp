# TodoFlow Production E2E Plan (Fly)

Use this plan immediately after DevOps confirms production deploy.

- API base: `https://todoflow-api.fly.dev`
- App base: `<set when production frontend URL is confirmed>`
- Required request header for user-scoped API calls: `X-User-Id`

## 0) Gate: deploy + health

Run:

```bash
curl -i --max-time 20 https://todoflow-api.fly.dev/healthz
```

Pass criteria:

- HTTP is `200`
- Body indicates healthy service

Fail criteria:

- Timeout, non-200, or gateway/proxy error

## 1) Seed a real anonymous user

```bash
API_BASE="https://todoflow-api.fly.dev"
USER_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"
echo "USER_ID=$USER_ID"

curl -sS --max-time 20 -X POST "$API_BASE/api/users" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{}' | python3 -m json.tool
```

Pass criteria:

- Request succeeds (`200`/`201`)
- Response includes same user id or a valid created user payload

## 2) CRUD path: projects + tasks

Create a project:

```bash
PROJECT_JSON="$(curl -sS --max-time 25 -X POST "$API_BASE/api/projects" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"name":"Prod QA Project","icon":"qa","color":"#3B82F6"}')"
echo "$PROJECT_JSON" | python3 -m json.tool
PROJECT_ID="$(echo "$PROJECT_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')"
echo "PROJECT_ID=$PROJECT_ID"
```

Create a task:

```bash
TODAY="$(date -u +%F)"
TASK_JSON="$(curl -sS --max-time 25 -X POST "$API_BASE/api/tasks" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\":\"$PROJECT_ID\",\"title\":\"Prod QA Task\",\"due_date\":\"$TODAY\",\"priority\":\"high\"}")"
echo "$TASK_JSON" | python3 -m json.tool
TASK_ID="$(echo "$TASK_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')"
echo "TASK_ID=$TASK_ID"
```

Update task status:

```bash
curl -sS --max-time 25 -X PUT "$API_BASE/api/tasks/$TASK_ID" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}' | python3 -m json.tool
```

Verify list endpoint:

```bash
curl -sS --max-time 20 "$API_BASE/api/tasks?project_id=$PROJECT_ID" \
  -H "X-User-Id: $USER_ID" | python3 -m json.tool
```

Pass criteria:

- Project and task create succeed
- Update succeeds and reflects on subsequent reads
- List returns created entities for this user only

## 3) Search + dashboard enrichment regression

Search:

```bash
curl -sS --max-time 20 "$API_BASE/api/search?q=Prod%20QA%20Task" \
  -H "X-User-Id: $USER_ID" | python3 -m json.tool
```

Dashboard:

```bash
curl -sS --max-time 20 "$API_BASE/api/dashboard" \
  -H "X-User-Id: $USER_ID" | python3 -m json.tool
```

Pass criteria:

- Search returns the created task with expected fields
- Dashboard aggregates are non-empty/updated for this user
- Upcoming deadlines (if present in payload) include due tasks and no cross-user leakage

## 4) Security/contract smoke

Missing user header should fail:

```bash
curl -i --max-time 20 "$API_BASE/api/search?q=test"
```

Cross-user isolation check:

```bash
OTHER_USER_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"
curl -sS --max-time 20 "$API_BASE/api/tasks?project_id=$PROJECT_ID" \
  -H "X-User-Id: $OTHER_USER_ID" | python3 -m json.tool
```

Pass criteria:

- Missing header returns auth error (`401`/`403`)
- Different user id cannot read seeded user data

## 5) Manual UI smoke (run once frontend URL is confirmed)

In browser at the production app URL:

1. Load app with empty localStorage and verify bootstrap succeeds.
2. Create project, create task, edit task, move task status in board/list.
3. Use search UI and confirm seeded title appears.
4. Open dashboard and verify counts/deadlines are populated.
5. Refresh page and verify persistence.
6. Validate no CORS errors in DevTools console/network.

Pass criteria:

- All critical user flows complete without blocking errors
- No environment-specific regressions (routing, API base, auth header handling)

## 6) Cleanup (optional but recommended)

Delete seeded task/project to reduce production clutter:

```bash
curl -sS --max-time 20 -X DELETE "$API_BASE/api/tasks/$TASK_ID" \
  -H "X-User-Id: $USER_ID" -o /dev/null -w "task delete HTTP:%{http_code}\n"

curl -sS --max-time 20 -X DELETE "$API_BASE/api/projects/$PROJECT_ID" \
  -H "X-User-Id: $USER_ID" -o /dev/null -w "project delete HTTP:%{http_code}\n"
```

## 7) Reporting template

- Result: `PASS` or `FAIL`
- Deployed versions/commit refs validated:
- Blocking defects (P0/P1):
- Non-blocking defects (P2/P3):
- Evidence: key command outputs + timestamps

# TodoFlow Production E2E Plan (Fly)

Use this plan immediately after DevOps confirms production deploy.

- API base: `https://todoflow-api.fly.dev`
- App base: `<set when production frontend URL is confirmed>`
- Required request header for user-scoped API calls: `X-User-Id`

## 0) Gate: deploy + health

Run:

```bash
curl -i --max-time 20 https://todoflow-api.fly.dev/healthz
```

Pass criteria:

- HTTP is `200`
- Body indicates healthy service

Fail criteria:

- Timeout, non-200, or gateway/proxy error

## 1) Seed a real anonymous user

```bash
API_BASE="https://todoflow-api.fly.dev"
USER_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"
echo "USER_ID=$USER_ID"

curl -sS --max-time 20 -X POST "$API_BASE/api/users" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{}' | python3 -m json.tool
```

Pass criteria:

- Request succeeds (`200`/`201`)
- Response includes same user id or a valid created user payload

## 2) CRUD path: projects + tasks

Create a project:

```bash
PROJECT_JSON="$(curl -sS --max-time 25 -X POST "$API_BASE/api/projects" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"name":"Prod QA Project","icon":"qa","color":"#3B82F6"}')"
echo "$PROJECT_JSON" | python3 -m json.tool
PROJECT_ID="$(echo "$PROJECT_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')"
echo "PROJECT_ID=$PROJECT_ID"
```

Create a task:

```bash
TODAY="$(date -u +%F)"
TASK_JSON="$(curl -sS --max-time 25 -X POST "$API_BASE/api/tasks" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\":\"$PROJECT_ID\",\"title\":\"Prod QA Task\",\"due_date\":\"$TODAY\",\"priority\":\"high\"}")"
echo "$TASK_JSON" | python3 -m json.tool
TASK_ID="$(echo "$TASK_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')"
echo "TASK_ID=$TASK_ID"
```

Update task status:

```bash
curl -sS --max-time 25 -X PUT "$API_BASE/api/tasks/$TASK_ID" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}' | python3 -m json.tool
```

Verify list endpoint:

```bash
curl -sS --max-time 20 "$API_BASE/api/tasks?project_id=$PROJECT_ID" \
  -H "X-User-Id: $USER_ID" | python3 -m json.tool
```

Pass criteria:

- Project and task create succeed
- Update succeeds and reflects on subsequent reads
- List returns created entities for this user only

## 3) Search + dashboard enrichment regression

Search:

```bash
curl -sS --max-time 20 "$API_BASE/api/search?q=Prod%20QA%20Task" \
  -H "X-User-Id: $USER_ID" | python3 -m json.tool
```

Dashboard:

```bash
curl -sS --max-time 20 "$API_BASE/api/dashboard" \
  -H "X-User-Id: $USER_ID" | python3 -m json.tool
```

Pass criteria:

- Search returns the created task with expected fields
- Dashboard aggregates are non-empty/updated for this user
- Upcoming deadlines (if present in payload) include due tasks and no cross-user leakage

## 4) Security/contract smoke

Missing user header should fail:

```bash
curl -i --max-time 20 "$API_BASE/api/search?q=test"
```

Cross-user isolation check:

```bash
OTHER_USER_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"
curl -sS --max-time 20 "$API_BASE/api/tasks?project_id=$PROJECT_ID" \
  -H "X-User-Id: $OTHER_USER_ID" | python3 -m json.tool
```

Pass criteria:

- Missing header returns auth error (`401`/`403`)
- Different user id cannot read seeded user data

## 5) Manual UI smoke (run once frontend URL is confirmed)

In browser at the production app URL:

1. Load app with empty localStorage and verify bootstrap succeeds.
2. Create project, create task, edit task, move task status in board/list.
3. Use search UI and confirm seeded title appears.
4. Open dashboard and verify counts/deadlines are populated.
5. Refresh page and verify persistence.
6. Validate no CORS errors in DevTools console/network.

Pass criteria:

- All critical user flows complete without blocking errors
- No environment-specific regressions (routing, API base, auth header handling)

## 6) Cleanup (optional but recommended)

Delete seeded task/project to reduce production clutter:

```bash
curl -sS --max-time 20 -X DELETE "$API_BASE/api/tasks/$TASK_ID" \
  -H "X-User-Id: $USER_ID" -o /dev/null -w "task delete HTTP:%{http_code}\n"

curl -sS --max-time 20 -X DELETE "$API_BASE/api/projects/$PROJECT_ID" \
  -H "X-User-Id: $USER_ID" -o /dev/null -w "project delete HTTP:%{http_code}\n"
```

## 7) Reporting template

- Result: `PASS` or `FAIL`
- Deployed versions/commit refs validated:
- Blocking defects (P0/P1):
- Non-blocking defects (P2/P3):
- Evidence: key command outputs + timestamps

