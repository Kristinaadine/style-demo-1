-- ============================================================
-- BRA Running Style — PostgreSQL Schema
-- Jalankan sekali untuk membuat semua tabel.
-- psql -U bra_app -d bra_running_style -f schema-postgres.sql
-- ============================================================

-- Buat database jika belum ada (jalankan sebagai superuser):
-- CREATE DATABASE bra_running_style
--   ENCODING 'UTF8'
--   LC_COLLATE 'en_US.UTF-8'
--   LC_CTYPE   'en_US.UTF-8';

-- Buat user aplikasi (opsional):
-- CREATE USER bra_app WITH PASSWORD 'bra_app_local';
-- GRANT ALL PRIVILEGES ON DATABASE bra_running_style TO bra_app;
-- GRANT CREATE ON SCHEMA public TO bra_app;

-- ── app_state ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_state (
  id         SMALLINT     NOT NULL PRIMARY KEY DEFAULT 1,
  state_json TEXT         NOT NULL,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── buyers ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS buyers (
  id   SERIAL       PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
);

-- ── styles ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS styles (
  article_style      VARCHAR(80)    NOT NULL PRIMARY KEY,
  buyer_id           INTEGER        REFERENCES buyers(id) ON UPDATE CASCADE ON DELETE SET NULL,
  brand              VARCHAR(120),
  description        VARCHAR(255),
  product_group      VARCHAR(120),
  week               VARCHAR(40),
  development_status VARCHAR(80),
  production_status  VARCHAR(80),
  sample_status      VARCHAR(80),
  mc_ratio           NUMERIC(8, 2),
  pic_pattern        VARCHAR(120),
  pic_mdmkt          VARCHAR(120),
  pic_ie             VARCHAR(120),
  pic_prod           VARCHAR(120),
  pic_qa             VARCHAR(120),
  extra_json         TEXT,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── folders ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS folders (
  id         SERIAL       PRIMARY KEY,
  style_id   VARCHAR(80)  NOT NULL REFERENCES styles(article_style) ON UPDATE CASCADE ON DELETE CASCADE,
  name       VARCHAR(160) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (style_id, name)
);

-- ── files ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS files (
  id            VARCHAR(100) NOT NULL PRIMARY KEY,
  style_id      VARCHAR(80)  REFERENCES styles(article_style) ON UPDATE CASCADE ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  mime_type     VARCHAR(160),
  size_bytes    BIGINT       NOT NULL DEFAULT 0,
  blob_id       VARCHAR(100),
  file_type     VARCHAR(30)  NOT NULL DEFAULT 'workspace',
  extra_json    TEXT,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ
);

-- ── folder_files ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS folder_files (
  folder_id INTEGER      NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  file_id   VARCHAR(100) NOT NULL REFERENCES files(id)   ON DELETE CASCADE,
  PRIMARY KEY (folder_id, file_id)
);

-- ── file_blobs ──────────────────────────────────────────────
-- Binary content berpindah dari IndexedDB browser ke PostgreSQL.

CREATE TABLE IF NOT EXISTS file_blobs (
  blob_id     VARCHAR(100) NOT NULL PRIMARY KEY,
  content     BYTEA        NOT NULL,
  mime_type   VARCHAR(160),
  size_bytes  BIGINT       NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── import_batches ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS import_batches (
  id            VARCHAR(80)  NOT NULL PRIMARY KEY,
  source_name   VARCHAR(255) NOT NULL DEFAULT '',
  imported_by   VARCHAR(120) NOT NULL DEFAULT '',
  rows_count    INTEGER      NOT NULL DEFAULT 0,
  created_count INTEGER      NOT NULL DEFAULT 0,
  updated_count INTEGER      NOT NULL DEFAULT 0,
  skipped_count INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Grant akses ke user aplikasi (jalankan sebagai superuser):
-- GRANT CREATE ON SCHEMA public TO bra_app;
-- GRANT ALL ON ALL TABLES    IN SCHEMA public TO bra_app;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO bra_app;
