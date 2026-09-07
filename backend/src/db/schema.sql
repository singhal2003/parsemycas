-- ParseMyCAS database schema (plain SQL, run once against your Postgres database)
--
-- There is no local `users` table anymore. Accounts live centrally in Nivesh Star's
-- system (shared across all their products, e.g. do-tax-easy) — this app only stores
-- the CAS statements a logged-in investor has uploaded, tagged with their central
-- investor id (a string from Nivesh Star, not a locally-generated UUID).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS statements;
DROP TABLE IF EXISTS users;

CREATE TABLE statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,             -- Nivesh Star investor id (from GET /investor)
  file_name TEXT NOT NULL,
  file_hash TEXT,                    -- sha256 of the uploaded PDF, used to detect re-uploads
  cas_type TEXT,
  investor_name TEXT,
  pan TEXT,
  statement_period_from TEXT,
  statement_period_to TEXT,
  total_folios INTEGER,
  total_schemes INTEGER,
  raw_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_statements_user_id ON statements(user_id);
CREATE UNIQUE INDEX idx_statements_user_file_hash ON statements(user_id, file_hash) WHERE file_hash IS NOT NULL;
