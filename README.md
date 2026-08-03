# ParseMyCAS

Upload a mutual fund CAS (Consolidated Account Statement) from NSDL, CDSL, CAMS or KFintech and get back
the parsed data as JSON, saved to your account. Sign up with email or Google, upload statements, and come
back to them any time — your history is tied to your account, not your browser.

"ParseMyCAS" is just a working name — rename freely (see "Renaming" below).

## Stack

- **Frontend:** React (Vite) + Tailwind CSS, in `frontend/`
- **Backend:** Node.js + Express + PostgreSQL (plain `pg`, no ORM — see "Why plain SQL" below), in `backend/`
- **Auth:** email/password (with email verification) and Google sign-in, JWT sessions
- **Email:** [Resend](https://resend.com) for verification codes
- **CAS parsing:** calls `https://app2.mfapis.club/api/v2/cas/ai/parse` using a partner accessToken (the
  backend logs itself into `POST /api/v2/partner/login` and caches/refreshes the token — nothing to do
  manually beyond the credentials in `backend/.env`)

## Why there's a database again

Earlier versions of this went back and forth on this. To be clear about where things landed: the CAS
*parsing* step itself is stateless (nothing to store), but accounts and "save my statements between
visits" are inherently stateful — there's no way to remember a user across sessions/devices without
persisting something somewhere. So Postgres is back, scoped specifically to `users` and `statements`.

## Project layout

```
parsemycas/
  backend/     Express API — auth (signup/verify/login/Google) + statements (upload/list/download)
  frontend/    React app — landing, signup/login/verify, dashboard
  docker-compose.yml   Optional local Postgres via Docker (see below)
```

## Quick start (run it locally)

You'll need Node.js 18+ and a Postgres database (local install or Docker, your call).

> `cp .env.example .env` below works in PowerShell or Git Bash. In `cmd.exe`, use `copy .env.example .env`.

> **Note:** `backend/node_modules` may have stale packages from earlier experiments. Run `npm ci` instead
> of `npm install` — it rebuilds cleanly from `package-lock.json`.

### 1. Database

Either:
- **Docker:** `docker compose up -d` (uses the `docker-compose.yml` in this folder), or
- **Local Postgres install:** https://www.postgresql.org/download/windows/, then in SQL Shell (psql):
  ```sql
  CREATE DATABASE parsemycas_db;
  CREATE USER parsemycas WITH PASSWORD 'parsemycas';
  GRANT ALL PRIVILEGES ON DATABASE parsemycas_db TO parsemycas;
  ```

`backend/.env.example` already matches these credentials (`postgresql://parsemycas:parsemycas@localhost:5432/parsemycas_db`).

### 2. Backend

```
cd backend
cp .env.example .env
npm ci
npm run db:init      # creates the users/statements tables
npm run dev           # http://localhost:4000
```

`backend/.env` already has real values filled in for:
- **CAS parsing partner credentials** (`PARTNER_IDENTIFIER` / `PARTNER_PASSWORD`) — live parsing works out of the box.
- **Resend API key** (`RESEND_API_KEY`) — real verification emails will send.

Still missing (optional, until you set these up — see below): `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
Without them, the "Sign in with Google" button shows a clear "not configured yet" message instead of
breaking — email/password signup works fully either way.

Health check: `curl http://localhost:4000/api/health` → `{"status":"ok","mockMode":false}`

### 3. Frontend

```
cd frontend
cp .env.example .env
npm ci
npm run dev            # http://localhost:5173
```

Open http://localhost:5173, sign up with email, check your inbox for the 6-digit code, verify, and
you're in. Upload a real CAS PDF from your "CAS Statements" folder — it'll call the live API and save
the result to your account. Log out and back in — it's still there.

## Setting up Google sign-in

1. Go to https://console.cloud.google.com/apis/credentials, create a project, configure the OAuth
   consent screen (External, fill in app name + your email, defaults are fine for everything else).
2. Credentials → Create Credentials → OAuth client ID → Application type: Web application.
3. Authorized JavaScript origins: `http://localhost:5173`
   Authorized redirect URIs: `http://localhost:4000/api/auth/google/callback`
4. Copy the Client ID and Client Secret into `backend/.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
5. Restart the backend. The Google button on Signup/Login will now work.

## Password rules

At least 8 characters, with at least one letter, one number, and one special character. Enforced
server-side in `backend/src/utils/password.js`.

## Important — the real CAS API's response shape

The live `/cas/ai/parse` response uses a `folios[]` / `investor_info` shape (per the official docs at
`https://app2.mfapis.club/docs/cas-api-docs.html#api-ai-parse`), different from the older `holdings[]` /
`investor_name` shape used by the bundled mock fixture (`backend/src/fixtures/sample_cas_response.json`,
used automatically when `PARTNER_IDENTIFIER`/`PARTNER_PASSWORD` are unset). Also worth knowing: many
`value`/`nav`/`gain` fields in the real response can come back `null` — this endpoint only extracts
what's in the PDF text, it doesn't look up live NAVs or compute current value.

`backend/src/controllers/statements.controller.js` has an `extractMeta()` function that normalizes both
shapes for the statements list. `backend/src/services/analytics.service.js` and `backend/src/utils/xirr.js`
are still in the repo (unused, kept for reference) but were written against the old `holdings[]` shape —
if/when an analytics dashboard gets built, that logic needs rewriting against the real `folios[]` shape,
or switch to `POST /api/v2/cas/import` + `GET /api/v2/portfolio/xray`, which return pre-computed
XIRR/allocations instead of raw parse output.

## Why plain SQL instead of an ORM

Prisma's `generate`/`migrate` need to download compiled engine binaries from `binaries.prisma.sh`, which
was blocked by the sandbox's network allowlist while building this. The backend uses the plain `pg`
driver with hand-written SQL (`backend/src/db/schema.sql`, `npm run db:init`) instead — for two tables
this is simple and has no extra moving parts.

## Renaming the product

"ParseMyCAS" was just a placeholder while building. To rename:
- Update `frontend/index.html` `<title>`, `frontend/src/components/Navbar.jsx`, `frontend/src/components/Footer.jsx`.
- Update `backend/package.json` and `frontend/package.json` `"name"` fields.
- Update the folder name itself.

## Deploying to a public URL

Free-tier options once you're ready:
- **Backend + DB → [Render](https://render.com) or [Railway](https://railway.app):** a Postgres instance
  plus a Web Service pointing at `backend/` (build `npm install`, start `npm start`, run `npm run db:init`
  once after first deploy). Set all env vars from `backend/.env.example`, and update
  `GOOGLE_CALLBACK_URL`/`CORS_ORIGIN`/`FRONTEND_URL` to your real URLs.
- **Frontend → [Vercel](https://vercel.com):** import the repo, root directory `frontend/`, set
  `VITE_API_URL` to your backend URL + `/api`.
- Remember to add your production URLs to the Google OAuth client's authorized origins/redirect URIs too.

## Notes on files you'll see but don't need

A handful of files from earlier iterations of this project couldn't be deleted from the machine this was
built on (a permissions quirk on that setup), so they were overwritten with a short "UNUSED" comment
instead of removed outright — none of them are imported or used anywhere:
`frontend/src/pages/ParseTool.jsx`, `StatementAnalytics.jsx`, `frontend/src/components/StatCard.jsx`,
`backend/src/controllers/cas.controller.js`, `backend/src/routes/cas.routes.js`. Safe to delete whenever.
