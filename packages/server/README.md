# Writly Backend

REST API for Writly authentication, PDF document preparation, signature invitations,
recipient signing, and Firebase Storage file delivery.

## Stack

- Express and TypeScript
- MongoDB Atlas
- Firebase Authentication and Storage
- Gmail API for invitation and password-reset email

## Local setup

1. Copy `.env.example` to `.env` and configure the required values.
2. Install dependencies from the repository root with `npm install`.
3. Set `DATABASE_URL` and, if needed, `MONGODB_DB_NAME`.
4. Start the API with `npm run dev --workspace writly-server`.

The default API base is `http://localhost:4000/api`.

## Required integrations

Firebase:

- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_SERVICE_ACCOUNT_PATH`, or Google ADC

Gmail API:

- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`
- `GMAIL_SENDER_EMAIL`
- `GMAIL_FROM_NAME`
- `GMAIL_REPLY_TO` (optional)

Application:

- `ADMIN_APP_URL`
- `PUBLIC_APP_URL`

Run `npm run gmail:oauth --workspace writly-server` to generate the Gmail refresh
token used by the server.

## Active routes

Health:

- `GET /api/health`
- `GET /api/health/ready`

Authentication:

- `POST /api/auth/session`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

Authenticated document management:

- `GET /api/admin/contracts`
- `POST /api/admin/contracts/templates`
- `PUT /api/admin/contracts/templates/:id`
- `POST /api/admin/contracts/templates/:id/finalize`
- `GET /api/admin/contracts/templates/:id/events` (authenticated SSE signer-status stream)
- `DELETE /api/admin/contracts/templates/:id`
- `POST /api/admin/contracts`
- `POST /api/admin/contracts/:id/send`
- `DELETE /api/admin/contracts/:id`

Authenticated storage:

- `GET /api/admin/uploads/test`
- `POST /api/admin/uploads/file`
- `POST /api/admin/uploads/sign`
- `POST /api/admin/uploads/proxy-url`
- `POST /api/admin/uploads/read-url`
- `DELETE /api/admin/uploads`

Public signing and file delivery:

- `GET /api/public/contracts/:token`
- `POST /api/public/contracts/:token/submit`
- `GET /api/public/files/:encodedPath`

All authenticated routes require the bearer token produced for the active user
session.

## Deployment

- Build: `npm run build --workspace writly-server`
- Start: `npm run start --workspace writly-server`
- Health check path: `/api/health`

MongoDB collections and required indexes are initialized when the server starts.
