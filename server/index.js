/**
 * index.js — BRA Running Style API Server
 *
 * Menggantikan api/index.php.
 * Mendukung PostgreSQL dan MySQL via DATABASE_TYPE di .env
 *
 * Cara menjalankan:
 *   cd server
 *   npm install
 *   copy .env.example .env   (lalu edit sesuai database Anda)
 *   npm start
 *
 * Server akan berjalan di http://localhost:3001 (default)
 * Frontend mengaksesnya di  http://localhost:8123
 */

"use strict";

require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const routes  = require("./routes");

const db     = require("./db");
const app    = express();
const PORT   = Number(process.env.PORT) || 3001;
const ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:8123";

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: ORIGIN,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json({ limit: "50mb" }));

// ── Routes ────────────────────────────────────────────────────────────────────

app.use("/api", routes);

// Root health-check
app.get("/", (req, res) => {
  res.json({ ok: true, service: "BRA Running Style API", version: "2.0" });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ ok: false, message: "Endpoint tidak ditemukan." });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("[server error]", err);
  res.status(500).json({ ok: false, message: err.message || "Internal server error." });
});

// ── Start ─────────────────────────────────────────────────────────────────────

async function ensureFileBlobTable() {
  if (db.type === "postgres") {
    await db.run(`CREATE TABLE IF NOT EXISTS file_blobs (
      blob_id VARCHAR(100) NOT NULL PRIMARY KEY,
      content BYTEA NOT NULL,
      mime_type VARCHAR(160),
      size_bytes BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  } else {
    await db.run(`CREATE TABLE IF NOT EXISTS file_blobs (
      blob_id VARCHAR(100) NOT NULL PRIMARY KEY,
      content LONGBLOB NOT NULL,
      mime_type VARCHAR(160) DEFAULT NULL,
      size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }
}

ensureFileBlobTable().then(() => {
  app.listen(PORT, () => {
    console.log(`[server] BRA Running Style API berjalan di http://localhost:${PORT}`);
    console.log(`[server] CORS diizinkan dari: ${ORIGIN}`);
  });
}).catch((error) => {
  console.error("[server] Peringatan: tabel file_blobs belum siap:", error.message);
  if (error.code === "42501") {
    console.error("[server] Jalankan sebagai administrator PostgreSQL: GRANT CREATE ON SCHEMA public TO bra_app; GRANT ALL ON ALL TABLES IN SCHEMA public TO bra_app;");
  }
  app.listen(PORT, () => {
    console.log(`[server] BRA Running Style API berjalan di http://localhost:${PORT}`);
    console.log(`[server] CORS diizinkan dari: ${ORIGIN}`);
  });
});
