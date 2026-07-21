# Writly Backend (REST API)

## Stack
- `Express` + `TypeScript`
- `Prisma` + `PostgreSQL`
- `JWT` auth (`signup`, `login`, `me`)

## Local setup
1. Copy `.env.example` to `.env` and update values.
2. Install dependencies from repo root:
   - `npm install`
3. Generate Prisma client:
   - `npm run db:generate --workspace server`
4. Create database schema:
   - `npm run db:push --workspace server`
   - or `npm run db:migrate --workspace server`
5. Start API:
   - `npm run dev --workspace server`

### Required env for Firebase Storage
- `FIREBASE_STORAGE_BUCKET`
- Authentication (choose one):
  - `FIREBASE_SERVICE_ACCOUNT_JSON`
  - `FIREBASE_SERVICE_ACCOUNT_PATH`
  - or standard Google ADC via `GOOGLE_APPLICATION_CREDENTIALS`

### Required env for Gmail API email
- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`
- `GMAIL_SENDER_EMAIL`
- `GMAIL_FROM_NAME` (default `Writly`)
- `GMAIL_REPLY_TO` (optional)
- `ADMIN_APP_URL`
- `PUBLIC_APP_URL` (default `http://localhost:3000`)
- `PASSWORD_RESET_TOKEN_TTL_MINUTES` (default `30`)
- `CV_OTP_EXPIRY_MINUTES` (default `10`)
- `CV_OTP_RESEND_COOLDOWN_SECONDS` (default `180`)
- `CV_DOWNLOAD_TOKEN_TTL_SECONDS` (default `300`)
- `REVIEW_INVITATION_EXPIRY_DAYS` (default `14`)
- `CRON_KEEPALIVE_SECRET` (optional, protects cron-only endpoints)

### Gmail API setup
1. Open Google Cloud Console and create or select a project.
2. Enable the Gmail API for that project.
3. Configure the OAuth consent screen.
   - Add the sender Gmail account as a test user while testing.
   - Use the `https://www.googleapis.com/auth/gmail.send` scope.
4. Create an OAuth Client ID with application type `Desktop app`.
5. Copy the generated client ID and client secret into `.env`:
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
6. Generate a refresh token from the repo root:
   - `npm run gmail:oauth --workspace server`
7. Open the printed Google authorization URL and approve the app using the Gmail account that should send emails.
8. Copy the printed `GMAIL_REFRESH_TOKEN` into `.env` and Render.
9. Set these values in Render:
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `GMAIL_REFRESH_TOKEN`
   - `GMAIL_SENDER_EMAIL`
   - `GMAIL_FROM_NAME`
   - `GMAIL_REPLY_TO`

## API base
- `http://localhost:4000/api`

## Health checks
- `GET /api/health` (liveness)
- `GET /api/health/ready` (readiness, includes DB check)
- Local health test command:
  - `npm run health:check --workspace server`
  - optional env: `API_HEALTH_URL`, `API_HEALTH_TIMEOUT_MS`

## Cron routes
- `GET /api/cron/supabase-keepalive`
  - Runs a lightweight `SELECT 1` against the configured Supabase/PostgreSQL database.
  - Use this from a cron monitor to keep the database active.
  - If `CRON_KEEPALIVE_SECRET` is set, include either:
    - `Authorization: Bearer <CRON_KEEPALIVE_SECRET>`
    - or `x-cron-secret: <CRON_KEEPALIVE_SECRET>`

## Auth routes
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me` (Bearer token required)

## Admin routes (Bearer token required)
- `GET /api/admin/dashboard/stats`
- `GET /api/admin/projects`
- `GET /api/admin/projects/all`
- `GET /api/admin/projects/:id`
- `POST /api/admin/projects`
- `PUT /api/admin/projects/:id`
- `PATCH /api/admin/projects/:id`
- `DELETE /api/admin/projects/:id`
- `GET /api/admin/services`
- `GET /api/admin/services/all`
- `GET /api/admin/services/:id`
- `POST /api/admin/services`
- `PUT /api/admin/services/:id`
- `PATCH /api/admin/services/:id`
- `DELETE /api/admin/services/:id`
- `GET /api/admin/certificates`
- `GET /api/admin/certificates/all`
- `GET /api/admin/certificates/:id`
- `POST /api/admin/certificates`
- `PUT /api/admin/certificates/:id`
- `PATCH /api/admin/certificates/:id`
- `DELETE /api/admin/certificates/:id`
- `GET /api/admin/reviews`
- `GET /api/admin/reviews/all`
- `GET /api/admin/reviews/:id`
- `PUT /api/admin/reviews/:id`
- `PATCH /api/admin/reviews/:id`
- `PATCH /api/admin/reviews/:id/approve`
- `DELETE /api/admin/reviews/:id`
- `GET /api/admin/clients`
- `GET /api/admin/clients/all`
- `GET /api/admin/clients/:id`
- `POST /api/admin/clients`
- `PATCH /api/admin/clients/:id`
- `DELETE /api/admin/clients/:id`
- `POST /api/admin/clients/:id/invitations`
- `GET /api/admin/contacts`
- `PUT /api/admin/contacts`
- `GET /api/admin/cv`
- `PUT /api/admin/cv`
- `GET /api/admin/uploads/test`
- `POST /api/admin/uploads/sign`
- `POST /api/admin/uploads/proxy-url`
- `POST /api/admin/uploads/read-url`
- `DELETE /api/admin/uploads`

## Public routes
- `GET /api/public/projects`
- `GET /api/public/projects/all`
- `GET /api/public/projects/:id`
- `GET /api/public/services`
- `GET /api/public/services/all`
- `GET /api/public/services/:id`
- `GET /api/public/certificates`
- `GET /api/public/certificates/all`
- `GET /api/public/certificates/:id`
- `GET /api/public/reviews`
- `GET /api/public/reviews/all`
- `GET /api/public/reviews/:id`
- `GET /api/public/review-invitations/:token`
- `POST /api/public/review-invitations/:token/submit`
- `GET /api/public/contacts`
- `POST /api/public/cv/request-otp`
- `POST /api/public/cv/verify-otp`
- `GET /api/public/cv/download?token=...`
- `GET /api/public/files/:encodedPath`

## Render deployment
- Root Directory:
  - `packages/server`
- Build command:
  - `npm run build`
- Start command:
  - `npm run start`
- Health Check Path:
  - `/api/health`

### Why we do not run `db:deploy` in Start Command
1. Render expects the web process to bind a port quickly.
2. `prisma migrate deploy` can block on DB connection/pooler/locks, so the service may never open a port in time.
3. Migrations should run once per release, not on every restart/scale event.

### Proper release order (with schema changes)
1. Create migration locally:
   - `npx prisma migrate dev --name <change_name>`
2. Commit both schema and migration files:
   - `git add prisma/schema.prisma prisma/migrations`
   - `git commit -m "feat(db): <change_name>"`
3. Push code to GitHub.
4. Run production migration manually (Render Shell or local terminal pointed to prod DB):
   - `cd /opt/render/project/src/packages/server`
   - `npx prisma migrate deploy`
5. Trigger/confirm deploy (service starts with `npm run start`).
6. Verify health endpoint:
   - `GET /api/health`

## Firebase Storage upload flow
1. Call `POST /api/admin/uploads/sign` with `filename`, `contentType`, and optional `folder`.
2. Upload the raw file bytes from the browser directly to returned `uploadUrl` using `PUT` and returned `Content-Type`.
3. Save returned `proxyUrl` in your DB record (`imageUrl` / `avatar` / `fileUrl`), not signed URLs.
4. Your client uses `proxyUrl` and the API streams the file from Firebase Storage (`GET /api/public/files/:encodedPath`).
5. If you already have a `filePath`, call `POST /api/admin/uploads/proxy-url` to convert it to API-owned URL.
6. For temporary direct bucket access (admin use), call `POST /api/admin/uploads/read-url`.
7. On record delete/replacement, call `DELETE /api/admin/uploads` with `filePath`.

Direct browser uploads require Firebase/GCS bucket CORS for every frontend origin, including local development and production.
`POST /api/admin/uploads/file` remains available as a server-mediated fallback if direct uploads are blocked.

## CV OTP Download flow
1. Admin uploads CV PDF using `POST /api/admin/uploads/sign`, then saves metadata with `PUT /api/admin/cv`.
2. User requests OTP using `POST /api/public/cv/request-otp` with email.
3. Server sends a 6-character OTP via Gmail API email.
4. User submits OTP with `POST /api/public/cv/verify-otp`.
5. Server returns a short-lived download token (5 minutes default) and `downloadUrl`.
6. Client downloads CV via `GET /api/public/cv/download?token=...`.

## Client Review Invitation flow
1. Admin creates a client with `POST /api/admin/clients`.
2. Admin sends or resends a one-time invitation with `POST /api/admin/clients/:id/invitations`.
3. Resending deletes any previous pending invitation for that client.
4. The emailed link opens `/review/:token` and expires after `REVIEW_INVITATION_EXPIRY_DAYS` days.
5. Public submission creates a pending review and deletes the invitation immediately.
6. Admin edits submitted reviews, approves them for the portfolio, or declines/deletes them.
