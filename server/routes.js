/**
 * routes.js — All API route handlers
 * Compatible with both PostgreSQL and MySQL via the db abstraction.
 */

"use strict";

const express = require("express");
const multer  = require("multer");
const db      = require("./db");
const router  = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 * 1024 } });

// ── Helpers ───────────────────────────────────────────────────────────────────

function scalar(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  return typeof value === "object" ? fallback : String(value);
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = parseFloat(String(value).replace(",", "."));
  return isFinite(n) ? n : null;
}

async function getBuyerId(tx, cache, name) {
  const key = String(name || "").trim().toLowerCase();
  if (!key) return null;
  if (cache[key] !== undefined) return cache[key];

  const sql = db.upsertBuyerSql();
  if (db.type === "postgres") {
    const rows = await tx.query(sql, [name.trim()]);
    cache[key] = rows[0]?.id ?? null;
  } else {
    await tx.run(sql, [name.trim()]);
    const rows = await tx.query("SELECT id FROM buyers WHERE name = ?", [name.trim()]);
    cache[key] = rows[0]?.id ?? null;
  }
  return cache[key];
}

// ── GET /status ───────────────────────────────────────────────────────────────

router.get("/status", async (req, res) => {
  try {
    await db.ping();
    const tables = ["buyers", "styles", "folders", "files", "file_blobs", "import_batches"];
    const counts = {};
    for (const table of tables) {
      try {
        const rows = await db.query(`SELECT COUNT(*) AS n FROM ${table}`);
        counts[table] = Number(rows[0]?.n ?? rows[0]?.count ?? 0);
      } catch (err) {
        if (table !== "file_blobs") throw err;
        counts[table] = null;
      }
    }
    const stateRows = await db.query("SELECT COUNT(*) AS n FROM app_state");
    const hasState  = Number(stateRows[0]?.n ?? stateRows[0]?.count ?? 0) > 0;
    res.json({ ok: true, database: db.type, configured: true, has_state: hasState, counts });
  } catch (err) {
    res.status(503).json({ ok: false, message: "Database tidak dapat dihubungi: " + err.message });
  }
});

// ── File blob storage (migrasi dari IndexedDB browser ke database) ─────────

router.post("/blobs/:blobId", upload.single("file"), async (req, res) => {
  try {
    const blobId = String(req.params.blobId || "").trim().slice(0, 100);
    if (!blobId) return res.status(422).json({ ok: false, message: "Blob ID wajib diisi." });
    if (!req.file) return res.status(422).json({ ok: false, message: "Isi berkas wajib dikirim." });

    if (db.type === "postgres") {
      await db.run(
        `INSERT INTO file_blobs (blob_id, content, mime_type, size_bytes)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (blob_id) DO UPDATE SET content=EXCLUDED.content,
           mime_type=EXCLUDED.mime_type, size_bytes=EXCLUDED.size_bytes,
           updated_at=NOW()`,
        [blobId, req.file.buffer, req.file.mimetype || "application/octet-stream", req.file.size]
      );
    } else {
      await db.run(
        `INSERT INTO file_blobs (blob_id, content, mime_type, size_bytes)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE content=VALUES(content), mime_type=VALUES(mime_type),
           size_bytes=VALUES(size_bytes)`,
        [blobId, req.file.buffer, req.file.mimetype || "application/octet-stream", req.file.size]
      );
    }
    res.json({ ok: true, blob_id: blobId, size: req.file.size });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.delete("/blobs/:blobId", async (req, res) => {
  try {
    const blobId = String(req.params.blobId || "").trim().slice(0, 100);
    await db.run("DELETE FROM file_blobs WHERE blob_id = ?", [blobId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.get("/blobs/:blobId", async (req, res) => {
  try {
    const blobId = String(req.params.blobId || "").trim().slice(0, 100);
    const rows = await db.query("SELECT content, mime_type, size_bytes FROM file_blobs WHERE blob_id = ?", [blobId]);
    if (!rows.length) return res.status(404).json({ ok: false, message: "Isi berkas tidak ditemukan di database." });
    let content = rows[0].content;
    if (!Buffer.isBuffer(content)) content = Buffer.from(content || []);
    res.setHeader("Content-Type", rows[0].mime_type || "application/octet-stream");
    res.setHeader("Content-Length", String(rows[0].size_bytes || content.length));
    res.setHeader("Cache-Control", "private, no-store");
    res.send(content);
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── GET /state ────────────────────────────────────────────────────────────────

router.get("/state", async (req, res) => {
  try {
    const rows = await db.query("SELECT state_json, updated_at FROM app_state WHERE id = 1");
    const row  = rows[0];
    const state = row ? (typeof row.state_json === "string" ? JSON.parse(row.state_json) : row.state_json) : null;
    res.json({ ok: true, state, updated_at: row?.updated_at ?? null });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ── POST /state ───────────────────────────────────────────────────────────────

router.post("/state", async (req, res) => {
  const body = req.body;
  if (!body || !Array.isArray(body.styles)) {
    return res.status(422).json({ ok: false, message: "Format state aplikasi tidak valid." });
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Save full JSON snapshot
      const json = JSON.stringify(body);
      await tx.run(db.upsertStateSql(), [json]);

      // 2. Wipe relational tables (order respects FK constraints)
      await tx.run("DELETE FROM folder_files");
      await tx.run("DELETE FROM folders");
      await tx.run("DELETE FROM files");
      await tx.run("DELETE FROM styles");

      // 3. Upsert styles
      const buyerCache = {};
      const styleSql   = db.upsertStyleSql();

      for (const style of body.styles) {
        const article = String(style.id || "").trim();
        if (!article) continue;

        const buyerId = await getBuyerId(tx, buyerCache, style.buyer || null);
        const pic = Array.isArray(style.pic) || style.pic === null ? {} : (style.pic || {});

        await tx.run(styleSql, [
          article,
          buyerId,
          scalar(style.brand),
          scalar(style.desc),
          scalar(style.group),
          scalar(style.week),
          scalar(style.dev),
          scalar(style.prod),
          scalar(style.sample),
          parseNumber(style.mc),
          scalar(pic.pattern),
          scalar(pic.mdmkt),
          scalar(pic.ie),
          scalar(pic.prod),
          scalar(pic.qa),
          JSON.stringify(style),
        ]);
      }

      // 4. Folders
      const folderIds = {};
      for (const [styleId, names] of Object.entries(body.styleFolders || {})) {
        const exists = await tx.query("SELECT 1 FROM styles WHERE article_style = ?", [styleId]);
        if (!exists.length) continue;
        for (const name of names) {
          const folderName = String(name || "").trim();
          if (!folderName) continue;
          try {
            if (db.type === "postgres") {
              const rows = await tx.query(
                `INSERT INTO folders (style_id, name) VALUES (?, ?)
                 ON CONFLICT (style_id, name) DO UPDATE SET name = EXCLUDED.name
                 RETURNING id`,
                [styleId, folderName]
              );
              folderIds[`${styleId}::${folderName}`] = rows[0]?.id;
            } else {
              await tx.run(
                "INSERT IGNORE INTO folders (style_id, name) VALUES (?, ?)",
                [styleId, folderName]
              );
              const rows = await tx.query(
                "SELECT id FROM folders WHERE style_id = ? AND name = ?",
                [styleId, folderName]
              );
              folderIds[`${styleId}::${folderName}`] = rows[0]?.id;
            }
          } catch (_) { /* duplicate — safe to ignore */ }
        }
      }

      // 5. Workspace files
      for (const file of body.workspaceFiles || []) {
        const fileId = scalar(file.id, "");
        if (!fileId) continue;
        const styleId = scalar(file.styleId);
        try {
          await tx.run(
            `INSERT INTO files
               (id, style_id, name, original_name, mime_type, size_bytes,
                blob_id, file_type, extra_json, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [
              fileId, styleId,
              scalar(file.name, "Berkas tanpa nama"),
              scalar(file.name),
              scalar(file.type),
              file.size ? Number(file.size) : 0,
              scalar(file.blobId),
              "workspace",
              JSON.stringify(file),
              scalar(file.uploadedAt),
              scalar(file.uploadedAt),
            ]
          );
          for (const folderName of file.folders || []) {
            const fid = folderIds[`${styleId}::${String(folderName).trim()}`];
            if (!fid) continue;
            if (db.type === "postgres") {
              await tx.run(
                "INSERT INTO folder_files (folder_id, file_id) VALUES (?,?) ON CONFLICT DO NOTHING",
                [fid, fileId]
              );
            } else {
              await tx.run(
                "INSERT IGNORE INTO folder_files (folder_id, file_id) VALUES (?,?)",
                [fid, fileId]
              );
            }
          }
        } catch (_) { /* duplicate id — skip */ }
      }

      // 6. Planner files
      for (const file of body.plannerFiles || []) {
        const fileId = scalar(file.id, "");
        if (!fileId) continue;
        try {
          await tx.run(
            `INSERT INTO files
               (id, style_id, name, original_name, mime_type, size_bytes,
                blob_id, file_type, extra_json, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [
              fileId, null,
              scalar(file.name, "Berkas Planner"),
              scalar(file.name),
              scalar(file.type),
              file.size ? Number(file.size) : 0,
              scalar(file.blobId),
              "planner",
              JSON.stringify(file),
              scalar(file.receivedAt),
              scalar(file.receivedAt),
            ]
          );
        } catch (_) {}
      }

      // 7. Import batches
      const batchSql = db.type === "postgres"
        ? `INSERT INTO import_batches
             (id, source_name, imported_by, rows_count, created_count, updated_count, skipped_count, created_at)
           VALUES (?,?,?,?,?,?,?,?)
           ON CONFLICT (id) DO UPDATE SET
             source_name=EXCLUDED.source_name, rows_count=EXCLUDED.rows_count,
             created_count=EXCLUDED.created_count, updated_count=EXCLUDED.updated_count,
             skipped_count=EXCLUDED.skipped_count`
        : `INSERT INTO import_batches
             (id, source_name, imported_by, rows_count, created_count, updated_count, skipped_count, created_at)
           VALUES (?,?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE
             source_name=VALUES(source_name), rows_count=VALUES(rows_count),
             created_count=VALUES(created_count), updated_count=VALUES(updated_count),
             skipped_count=VALUES(skipped_count)`;

      for (const batch of body.indexImports || []) {
        const id = scalar(batch.id, "");
        if (!id) continue;
        await tx.run(batchSql, [
          id,
          scalar(batch.fileName || batch.source, ""),
          scalar(batch.by || batch.importedBy, ""),
          batch.rowCount  ? Number(batch.rowCount)  : 0,
          batch.added     ? Number(batch.added)     : 0,
          batch.replaced  ? Number(batch.replaced)  : 0,
          batch.skipped   ? Number(batch.skipped)   : 0,
          scalar(batch.importedAt || batch.at, new Date().toISOString()),
        ]);
      }

      return {
        styles:          body.styles.length,
        folders:         Object.keys(body.styleFolders || {}).length,
        workspace_files: (body.workspaceFiles || []).length,
        planner_files:   (body.plannerFiles   || []).length,
      };
    });

    res.json({ ok: true, message: "State tersimpan ke " + db.type + ".", counts: result });
  } catch (err) {
    console.error("[POST /state]", err);
    res.status(500).json({ ok: false, message: "Gagal menyimpan state: " + err.message });
  }
});

// ── GET /relations ────────────────────────────────────────────────────────────

router.get("/relations", async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT
        s.article_style,
        b.name        AS buyer,
        s.brand,
        s.description,
        s.week,
        s.product_group,
        COUNT(DISTINCT f.id)       AS folders,
        COUNT(DISTINCT ff.file_id) AS files
      FROM styles s
      LEFT JOIN buyers       b  ON b.id         = s.buyer_id
      LEFT JOIN folders      f  ON f.style_id   = s.article_style
      LEFT JOIN folder_files ff ON ff.folder_id = f.id
      GROUP BY s.article_style, b.name, s.brand, s.description, s.week, s.product_group
      ORDER BY s.article_style
    `);
    res.json({ ok: true, rows });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
