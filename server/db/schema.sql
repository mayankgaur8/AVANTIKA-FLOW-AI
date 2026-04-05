-- ═══════════════════════════════════════════════════════════
-- Avantika Flow AI — PostgreSQL Schema
-- Run: psql -d avantika_flow -f schema.sql
-- ═══════════════════════════════════════════════════════════

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────────────────────────────────────────
-- users
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(320) NOT NULL UNIQUE,
  password_hash   TEXT,                           -- null for OAuth users
  provider        VARCHAR(32)  NOT NULL DEFAULT 'email',  -- 'email' | 'google'
  provider_id     VARCHAR(255),                   -- Google sub / OAuth uid
  full_name       VARCHAR(255),
  avatar_url      TEXT,

  -- Onboarding segmentation
  user_type       VARCHAR(32),                    -- 'work' | 'personal'
  use_cases       TEXT[],                         -- ['documentation', 'education', …]
  team            VARCHAR(128),                   -- 'IT', 'Operations', …

  -- Status
  email_verified  BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email     ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_provider  ON users (provider, provider_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'pending_approval';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS source_page VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cta_clicked VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS campaign_source VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_use_case VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_name VARCHAR(120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);

-- ───────────────────────────────────────────────────────────
-- workspaces
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(120) NOT NULL,
  owner_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces (owner_id);

-- ───────────────────────────────────────────────────────────
-- onboarding_events
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_events (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         REFERENCES users(id) ON DELETE SET NULL,
  source_page         VARCHAR(255),
  cta_clicked         VARCHAR(255),
  campaign_source     VARCHAR(255),
  selected_use_case   VARCHAR(255),
  selected_team       VARCHAR(255),
  selected_persona    VARCHAR(255),
  onboarding_step_data JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_id ON onboarding_events (user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_source_page ON onboarding_events (source_page);

-- ───────────────────────────────────────────────────────────
-- sales_inquiries
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_inquiries (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(320) NOT NULL,
  company         VARCHAR(255),
  role            VARCHAR(128),
  team_size       VARCHAR(64),
  interest_area   VARCHAR(120),
  message         TEXT         NOT NULL,
  source_page     VARCHAR(255),
  cta_clicked     VARCHAR(255),
  campaign_source VARCHAR(255),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_inquiries_email ON sales_inquiries (email);
CREATE INDEX IF NOT EXISTS idx_sales_inquiries_created_at ON sales_inquiries (created_at);

-- ───────────────────────────────────────────────────────────
-- product_interest
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_interest (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         REFERENCES users(id) ON DELETE SET NULL,
  email           VARCHAR(320),
  product_slug    VARCHAR(120) NOT NULL,
  source_page     VARCHAR(255),
  cta_clicked     VARCHAR(255),
  campaign_source VARCHAR(255),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_interest_product_slug ON product_interest (product_slug);
CREATE INDEX IF NOT EXISTS idx_product_interest_user_id ON product_interest (user_id);

-- ───────────────────────────────────────────────────────────
-- auth_sessions
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_sessions (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        VARCHAR(64)  NOT NULL,
  session_token   TEXT         NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions (user_id);

-- ───────────────────────────────────────────────────────────
-- onboarding_sessions
-- Stores the full journey — even for incomplete / anonymous flows
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES users(id) ON DELETE SET NULL,
  session_token   TEXT        UNIQUE,             -- anonymous tracking token

  -- Collected data
  user_type       VARCHAR(32),
  use_cases       TEXT[],
  team            VARCHAR(128),
  email           VARCHAR(320),

  -- Funnel analytics
  last_step       INTEGER     NOT NULL DEFAULT 1,
  completed       BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,

  -- Source attribution
  utm_source      VARCHAR(128),
  utm_medium      VARCHAR(128),
  utm_campaign    VARCHAR(128),
  referrer        TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON onboarding_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_email   ON onboarding_sessions (email);
CREATE INDEX IF NOT EXISTS idx_onboarding_completed ON onboarding_sessions (completed);

-- ───────────────────────────────────────────────────────────
-- email_verifications
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_verifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- auto-update updated_at
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER onboarding_updated_at
  BEFORE UPDATE ON onboarding_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
