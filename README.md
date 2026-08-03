# ParseMyCAS

Upload a mutual fund CAS (Consolidated Account Statement) from NSDL, CDSL, CAMS or KFintech and get back
the parsed data as JSON — view it, copy it, or download it. No account, no database — this is a thin,
stateless wrapper around the real CAS parsing API.

"ParseMyCAS" is just a working name — rename freely (see "Renaming" below).

## Why no database

Earlier drafts of this had Postgres, signup/login, and a saved statements list. That's gone now, on
purpose: the actual task right now is just "upload a PDF, get JSON back," and `/cas/ai/parse` itself is
stateless (it parses and returns — nothing is stored on their end either, per the API docs). So there's
nothing for us to persist. No user accounts, no database, no server-side history.

## Stack

- **Frontend:** React (Vite) + Tailwind CSS, in `frontend/` — a single tool page, no routing beyond
  the landing page and the tool itself.
- **Backend:** Node.js + Express, in `backend/` — one route, no database.
- **CAS parsing:** calls `https://app2.mfapis.club/api/v2/cas/ai/parse` using a **partner accessToken**.
  The backend logs itself in via `POST /api/v2/partner/login` (see `backend/src/services/partnerAuth.service.js`),
  caches the token in memory, and auto-refreshes it on expiry/401 — nothing to paste in manually beyond
  the partner `identifier`/`password` in `backend/.env`. Without those credentials set, the backend falls
  back to **mock mode** and returns a bundled sample CAS response instead, so the product still works
  end-to-end without live credentials.

## Project layout

```
parsemycas/
  backend/     Express API — one route: POST /api/cas/parse
  frontend/    React app — landing page + the parse tool
```

## Quick start (run it locally)

You'll need Node.js 18+. That's it — no Postgres, no Docker.

> `cp .env.example .env` below works in PowerShell or Git Bash. In plain `cmd.exe`, use
> `copy .env.example .env` instead.

> **Note:** `backend/node_modules` in this folder may still contain stale packages from earlier
> experiments (Prisma, pg, bcryptjs, jsonwebtoken — none of that is used anymore). Run `npm ci` instead
> of `npm install` in `backend/` — it rebuilds `node_modules` from `package-lock.json` and sorts this out.

### 1. Backend

```
cd backend
cp .env.example .env
npm ci
npm run dev           # http://localhost:4000
```

`backend/.env` already has real partner credentials filled in
(`PARTNER_IDENTIFIER=7042422088`, `PARTNER_PASSWORD=Password@123`), so it talks to the live API by default.

Health check: `curl http://localhost:4000/api/health` → `{"status":"ok","mockMode":false}`
(`mockMode: false` means it's using the real API, not the bundled sample.)

### 2. Frontend

```
cd frontend
cp .env.example .env
npm ci
npm run dev            # http://localhost:5173
```

Open http://localhost:5173, click "Try it now," and upload a real CAS PDF (there are sample ones in your
"CAS Statements" folder). You'll see the parsed JSON on the page, with buttons to copy or download it.

If `PARTNER_IDENTIFIER`/`PARTNER_PASSWORD` are ever cleared in `backend/.env`, uploads fall back to mock
mode instead — it ignores the uploaded file and returns a bundled sample portfolio, useful for testing
the UI without burning real API calls.

## Important — the real API's response shape

I checked the official docs (`https://app2.mfapis.club/docs/cas-api-docs.html#api-ai-parse`). The live
`/cas/ai/parse` response uses a `folios[]` / `investor_info` shape, which is **different** from the older
`holdings[]` / `investor_name` shape in the bundled mock fixture
(`backend/src/fixtures/sample_cas_response.json`). Also worth knowing: many `value`/`nav`/`gain` fields in
the real response can come back `null` — this endpoint only extracts what's written in the PDF text, it
doesn't look up live NAVs or compute current value/gains. That's expected, not a bug.

This doesn't block anything right now since the app just shows/downloads whatever JSON comes back,
whichever shape it is. It matters for later: `backend/src/services/analytics.service.js` and
`backend/src/utils/xirr.js` are still in the repo (unused, kept for reference) but were written against
the old `holdings[]` shape — if/when an analytics dashboard gets built on top of this, that logic needs
rewriting against the real `folios[]` shape, or the app should switch to `POST /api/v2/cas/import` +
`GET /api/v2/portfolio/xray`, which return pre-computed XIRR/allocations/gains instead of raw parse output.

## Renaming the product

"ParseMyCAS" was just a placeholder while building. To rename:
- Update `frontend/index.html` `<title>`, `frontend/src/components/Navbar.jsx`, and `frontend/src/components/Footer.jsx`.
- Update `backend/package.json` and `frontend/package.json` `"name"` fields.
- Update the folder name itself.

## Deploying to a public URL

Free-tier options once you're ready:
- **Backend → [Render](https://render.com) or [Railway](https://railway.app):** new Web Service pointing
  at `backend/`, build command `npm install`, start command `npm start`. Set env vars from
  `backend/.env.example` (`PARTNER_IDENTIFIER`, `PARTNER_PASSWORD`, `CORS_ORIGIN` = your frontend URL).
- **Frontend → [Vercel](https://vercel.com):** import the repo, root directory `frontend/`, set
  `VITE_API_URL` to your backend URL + `/api`.

No database step needed — that's the whole point of this version.

## Notes on files you'll see but don't need

A handful of files from an earlier Postgres/accounts version couldn't be deleted from the machine this
was built on (a permissions quirk on that particular setup), so they were overwritten with a short
"UNUSED" comment instead of removed outright: `backend/src/config/`, `backend/src/db/`,
`backend/src/middleware/auth.js`, `backend/src/controllers/auth.controller.js`,
`backend/src/controllers/statements.controller.js`, `backend/src/routes/auth.routes.js`,
`backend/src/routes/statements.routes.js`, and on the frontend side
`frontend/src/pages/Login.jsx`, `Signup.jsx`, `Dashboard.jsx`, `StatementAnalytics.jsx`,
`frontend/src/context/AuthContext.jsx`, `frontend/src/components/ProtectedRoute.jsx`, `UploadModal.jsx`,
`StatCard.jsx`. None of these are imported or used anywhere — safe to delete them yourself whenever you want.
