-- ============================================================
-- BRA Running Style — MySQL / MariaDB Schema
-- Jalankan sekali untuk membuat database dan semua tabel.
-- mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS bra_running_style
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bra_running_style;

-- Buat user aplikasi (opsional, jalankan sebagai root):
-- CREATE USER IF NOT EXISTS 'bra_app'@'localhost' IDENTIFIED BY 'bra_app_local';
-- GRANT ALL PRIVILEGES ON bra_running_style.* TO 'bra_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ── app_state ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_state (
  id         TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  state_json LONGTEXT         NOT NULL,
  updated_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── buyers ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS buyers (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── styles ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS styles (
  article_style      VARCHAR(80)   NOT NULL PRIMARY KEY,
  buyer_id           INT UNSIGNED  NULL,
  brand              VARCHAR(120)  NULL,
  description        VARCHAR(255)  NULL,
  product_group      VARCHAR(120)  NULL,
  week               VARCHAR(40)   NULL,
  development_status VARCHAR(80)   NULL,
  production_status  VARCHAR(80)   NULL,
  sample_status      VARCHAR(80)   NULL,
  mc_ratio           DECIMAL(8,2)  NULL,
  pic_pattern        VARCHAR(120)  NULL,
  pic_mdmkt          VARCHAR(120)  NULL,
  pic_ie             VARCHAR(120)  NULL,
  pic_prod           VARCHAR(120)  NULL,
  pic_qa             VARCHAR(120)  NULL,
  extra_json         LONGTEXT      NULL,
  updated_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_styles_buyer FOREIGN KEY (buyer_id) REFERENCES buyers(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── folders ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS folders (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  style_id   VARCHAR(80)   NOT NULL,
  name       VARCHAR(160)  NOT NULL,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_style_folder (style_id, name),
  CONSTRAINT fk_folders_style FOREIGN KEY (style_id) REFERENCES styles(article_style)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── files ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS files (
  id            VARCHAR(100) NOT NULL PRIMARY KEY,
  style_id      VARCHAR(80)  NULL,
  name          VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NULL,
  mime_type     VARCHAR(160) NULL,
  size_bytes    BIGINT UNSIGNED NOT NULL DEFAULT 0,
  blob_id       VARCHAR(100) NULL,
  file_type     VARCHAR(30)  NOT NULL DEFAULT 'workspace',
  extra_json    LONGTEXT     NULL,
  created_at    DATETIME     NULL,
  updated_at    DATETIME     NULL,
  CONSTRAINT fk_files_style FOREIGN KEY (style_id) REFERENCES styles(article_style)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── folder_files ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS folder_files (
  folder_id INT UNSIGNED NOT NULL,
  file_id   VARCHAR(100) NOT NULL,
  PRIMARY KEY (folder_id, file_id),
  CONSTRAINT fk_folder_files_folder FOREIGN KEY (folder_id) REFERENCES folders(id)  ON DELETE CASCADE,
  CONSTRAINT fk_folder_files_file   FOREIGN KEY (file_id)   REFERENCES files(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── import_batches ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS import_batches (
  id            VARCHAR(80)  NOT NULL PRIMARY KEY,
  source_name   VARCHAR(255) NOT NULL DEFAULT '',
  imported_by   VARCHAR(120) NOT NULL DEFAULT '',
  rows_count    INT UNSIGNED NOT NULL DEFAULT 0,
  created_count INT UNSIGNED NOT NULL DEFAULT 0,
  updated_count INT UNSIGNED NOT NULL DEFAULT 0,
  skipped_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
