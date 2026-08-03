-- ParseMyCAS database schema (plain SQL, run once against your Postgres database)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,                -- null for Google-only accounts
  google_id TEXT UNIQUE,             -- null for email/password accounts
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_code TEXT,
  verification_code_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_statements_user_id ON statements(user_id);
