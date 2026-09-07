# ParseMyCAS

Upload a mutual fund CAS (Consolidated Account Statement) from NSDL, CDSL, CAMS or KFintech and get back
the parsed data as JSON and an analytics view, saved to your account. Sign in with your Nivesh Star
account (email/password or Google) — the same account used across other Nivesh Star products like
do-tax-easy — upload statements, and come back to them any time.

"ParseMyCAS" is just a working name — rename freely (see "Renaming" below).

## Stack

- **Frontend:** React (Vite) + Tailwind CSS, in `frontend/`
- **Backend:** Node.js + Express + PostgreSQL (plain `pg`, no ORM — see "Why plain SQL" below), in `backend/`
- **Auth:** Nivesh Star's central account system (app2.mfapis.club) — see "Auth architecture" below.
  This app has no signup/login/password logic of its own.
- **CAS parsing:** calls `https://app2.mfapis.club/api/v2/cas/ai/parse` using the logged-in investor's own
  accessToken (never a separate partner login — see "Auth architecture")

## Security hardening in place

Baseline production hardening that's already done: `helmet` security headers, `express-rate-limit`
(60 req/min per IP across all API routes — a second layer on top of mfapis.club's own per-identity
limit), a locked-down CORS origin (no `"*"` fallback — tokens travel as headers, not cookies, so a
permissive CORS policy would let any website use a stolen token), a request body size cap, a timeout on
the investor-session validation call so a stalled central API can't hang requests forever, UUID
validation on statement id route params, 5xx error messages that never leak internals to the client,
auto-logout on an expired/invalid session (frontend), sha256-based duplicate-upload detection (with a DB
unique constraint as a backstop against race conditions, not just an app-level check), and a CI workflow
(`.github/workflows/ci.yml`) that syntax-checks the backend, builds the frontend, and runs `npm audit` on
every push.

Still missing before this should handle real users at scale — not done, and flagged rather than silently
skipped: file-content validation/malware scanning on uploads (currently mimetype-only, which is
spoofable), encryption at rest for the stored CAS JSON (PAN + full transaction history, currently plain
JSONB), an audit trail of who accessed/downloaded what, monitoring/error-tracking (Sentry or similar),
automated tests (there are currently none), an actual production deployment, and a privacy
policy/terms of service page (this app handles PAN and financial data for Indian users, which brings in
DPDP Act 2023 considerations, not just a nice-to-have).

## Auth architecture — why there's no local login system

Earlier versions of this built a full local email/password + Google OAuth system with its own Postgres
`users` table, bcrypt, JWTs, and Resend for verification emails. That's been removed. Here's why, and what
replaced it:

Nivesh Star runs one central account system (the same backend that serves `/cas/ai/parse`, at
`app2.mfapis.club`) shared across all of their products — this app, `do-tax-easy`, etc. An investor who
signs up on one product already has an account usable on all the others. So instead of building (and
maintaining) a second, separate identity system, this app's frontend talks to that central API directly
for every auth operation — signup OTP, completing signup, email/password login, Google login,
forgot/reset password — exactly the way `do-tax-easy/src/lib/auth.ts` does. See
`frontend/src/lib/niveshStar.js` for the client, `frontend/src/context/AuthContext.jsx` for the
React state, and `frontend/src/pages/Login.jsx` for the single mode-switching page (sign in / sign up /
forgot password) that mirrors `do-tax-easy`'s Login page.

The `PARTNER_ID` used in `frontend/src/lib/niveshStar.js` was **not** guessed — it was confirmed by
decoding the JWT this app's own partner credentials produce (see `backend/scripts/check-partner-id.js`),
and it matches the same id hardcoded in `do-tax-easy/src/lib/auth.ts`.

**What this means for the backend:** it no longer has any auth routes at all. `backend/src/middleware/auth.js`
protects `/api/statements/*` by taking the `access-token`/`refresh-token` headers the frontend already has
(from the central login) and calling `GET /investor` on the central API to validate them — if that
succeeds, the investor is real and currently logged in. There's no local password or session-signing
secret to manage.

**What this means for parsing:** `backend/src/services/casApi.service.js` now calls `/cas/ai/parse` using
the investor's own accessToken (forwarded from their session), not a self-issued partner token. This
matches Nivesh Star's explicit guidance: never send an investor's raw credentials to that endpoint —
log them in first, then use their own accessToken (`/cas/ai/parse` accepts `ALL_ROLES_WITH_PM`, which
includes `INVESTOR`).

**What this means for "delete account":** there is no "delete my account" feature anymore, on purpose.
The Nivesh Star account is shared across products, so this app deleting it would also break the
investor's `do-tax-easy` account (or any other Nivesh Star product they use) — not something this app
should be able to do. The Account page instead offers "Clear my data," which deletes only the
statements this app has stored locally (`DELETE /api/statements`), leaving the investor's actual login
untouched.

## Project layout

```
parsemycas/
  backend/     Express API — statement upload/list/download + investor session validation (no auth of its own)
  frontend/    React app — landing, unified login/signup/forgot-password, dashboard, per-statement analytics
```

## Quick start (run it locally)

You'll need Node.js 18+ and a Postgres database (local install, Docker, or a free host like Neon —
whatever you're already using).

> `cp .env.example .env` below works in PowerShell or Git Bash. In `cmd.exe`, use `copy .env.example .env`.

### 1. Database

Point `DATABASE_URL` in `backend/.env` at any Postgres instance. There's just one table now
(`statements` — see "Auth architecture" above for why there's no `users` table).

### 2. Backend

```
cd backend
cp .env.example .env
npm install
npm run db:init      # (re)creates the statements table — drops it first, so this wipes existing rows
npm run dev           # http://localhost:4000
```

`backend/.env.example` documents the two things you need: `DATABASE_URL` and (already filled in for you)
`CAS_API_URL` / `NIVESH_STAR_API_BASE_URL`, both pointing at `app2.mfapis.club`.

Health check: `curl http://localhost:4000/api/health` → `{"status":"ok","mockMode":false}`

### 3. Frontend

```
cd frontend
cp .env.example .env
npm install            # picks up @react-oauth/google, a new dependency
npm run dev            # http://localhost:5173
```

`frontend/.env` needs `VITE_GOOGLE_CLIENT_ID` for the Google sign-in button — see "Setting up Google
sign-in" below. Email/password sign-in and signup work regardless.

Open http://localhost:5173, sign up with email (you'll get an OTP from Nivesh Star's system, not this
app), and you're in. Upload a real CAS PDF — it calls the live API using your own investor session and
saves the result to your account, with an analytics view broken out by AMC, folio, scheme and
transaction.

## Setting up Google sign-in

Google sign-in is now client-side (Google Identity Services via `@react-oauth/google`), not the old
server-redirect flow — so the setup is different from earlier versions of this project:

1. Go to https://console.cloud.google.com/apis/credentials (reuse the same OAuth client from before, or
   create a new one — Web application type).
2. Under **Authorized JavaScript origins**, add `http://localhost:5173` (this is the part that changed —
   the old redirect URI setting isn't used anymore).
3. Put the Client ID in `frontend/.env` as `VITE_GOOGLE_CLIENT_ID`. No client secret is needed on the
   frontend, and the backend doesn't need a Google client ID/secret at all anymore.
4. Restart the frontend dev server.

## Important — the real CAS API's response shape

The live `/cas/ai/parse` response shape actually differs by RTA family, confirmed by reading
`mf-engine-v2`'s own source (`cas.controller.ts#parseUnified`), not guessed:

- **NSDL/CDSL** (depository statements): `{ pan, investor_name, statement_period_from/to, holdings[]`
  (MF folios, if any) `, accounts[]` (demat holdings by asset class: equities, bonds, government
  securities, AIFs, demat mutual funds) `, total_value, ... }`
- **CAMS/KFintech** (registrar statements): `{ cas_type: "CAMS_KFINTECH", primary_pan, investor_info,
  folios[]` (each with nested `schemes[]`) `, lifecycle_events, statement_period, ... }`. Note: `nav`,
  `value` and `gain` are usually `null` here — this endpoint only extracts what's printed in the PDF, and
  CAMS/KFintech statements don't print live NAV, only cost and unit balances.

`frontend/src/lib/casAnalytics.js` normalizes both shapes into one set of structures the analytics UI
renders from (`frontend/src/components/analytics/`). Aggregates (total value, AMC breakdown) only sum
when *every* contributing scheme has a known value — if even one is `null`, the total is shown as "not
available" rather than a misleading partial sum.

`backend/src/services/analytics.service.js` and `backend/src/utils/xirr.js` are still in the repo
(unused, kept for reference) but were written against an older, different shape — not used by the
current analytics UI.

## Why plain SQL instead of an ORM

Prisma's `generate`/`migrate` need to download compiled engine binaries from `binaries.prisma.sh`, which
was blocked by the sandbox's network allowlist while building this. The backend uses the plain `pg`
driver with hand-written SQL (`backend/src/db/schema.sql`, `npm run db:init`) instead — for one table
this is simple and has no extra moving parts.

## Renaming the product

"ParseMyCAS" was just a placeholder while building. To rename:
- Update `frontend/index.html` `<title>`, `frontend/src/components/Navbar.jsx`, `frontend/src/components/Footer.jsx`.
- Update `backend/package.json` and `frontend/package.json` `"name"` fields.
- Update the folder name itself.
- If you also change products/branding, ask Nivesh Star for the right `source` tag to pass instead of
  `"cas_parser"` in `frontend/src/lib/niveshStar.js`.

## Deploying to a public URL

Free-tier options once you're ready:
- **Backend + DB → [Render](https://render.com) or [Railway](https://railway.app):** a Postgres instance
  plus a Web Service pointing at `backend/` (build `npm install`, start `npm start`, run `npm run db:init`
  once after first deploy). Set env vars from `backend/.env.example`, and update `CORS_ORIGIN`/`FRONTEND_URL`.
- **Frontend → [Vercel](https://vercel.com) or [Netlify](https://netlify.com):** import the repo, root
  directory `frontend/`, set `VITE_API_URL`/`VITE_NIVESH_STAR_API_BASE_URL`/`VITE_GOOGLE_CLIENT_ID`.
  (Vercel's free Hobby tier disallows commercial use — Netlify's free tier doesn't have that restriction.)
- Add your production frontend URL to the Google OAuth client's **Authorized JavaScript origins**.

## Notes on files you'll see but don't need

A handful of files from earlier iterations of this project couldn't be deleted from the machine this was
built on (a permissions quirk on that setup), so they were overwritten with a short "UNUSED" comment
instead of removed outright — none of them are imported or used anywhere. From the original stateless
version: `frontend/src/pages/ParseTool.jsx`, `StatementAnalytics.jsx`, `frontend/src/components/StatCard.jsx`,
`backend/src/controllers/cas.controller.js`, `backend/src/routes/cas.routes.js`. From the local-auth
version this replaced: `backend/src/controllers/auth.controller.js`, `backend/src/routes/auth.routes.js`,
`backend/src/services/email.service.js`, `backend/src/services/partnerAuth.service.js`,
`backend/src/utils/password.js`, `frontend/src/pages/Signup.jsx`, `VerifyEmail.jsx`, `ForgotPassword.jsx`,
`ResetPassword.jsx`, `AuthCallback.jsx`. Safe to delete whenever.
