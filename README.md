# Writly

Writly is a standalone full-stack contract workspace extracted from ACE. It supports PDF template uploads, positioned text and signature objects, drawing and erasing, reusable templates, recipient links, email delivery, browser draft recovery, PDF export, and recipient completion.

## Stack

- React 18, TypeScript, Vite
- Express and Prisma
- PostgreSQL
- Firebase Storage for PDF and image assets
- Gmail OAuth for contract delivery

## Local setup

1. Copy `packages/server/.env.example` to `packages/server/.env` and fill in the database and JWT values.
2. If the API is not at `http://localhost:4000/api`, copy `packages/client/.env.example` to `packages/client/.env` and update it.
3. Configure Firebase Storage using either service-account JSON or a local credential path.
4. Run `npm install`.
5. Run `npm run db:generate --workspace writly-server`.
6. Run `npm run db:deploy --workspace writly-server` for an existing database, or `npm run db:migrate --workspace writly-server` during local development.
7. Run `npm run dev`.

The Writly admin opens at `http://localhost:5173`. Recipient links use `/contracts/:token`. The API defaults to `http://localhost:4000/api`; override it with `VITE_API_URL` when needed.

## Security

No service-account file or environment file was copied from ACE. Keep Firebase credentials, database URLs, JWT secrets, and Gmail OAuth tokens outside version control.

## Current extraction boundary

The visible product is restricted to Contracts. Shared server controllers and database tables remain in the initial extraction because the existing authenticated admin bootstrap and operational services depend on them. This preserves working authentication, uploads, email, error handling, and recipient flows while the internal modules can be slimmed independently later.
