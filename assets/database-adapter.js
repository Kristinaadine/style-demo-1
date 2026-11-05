/* ==========================================================================
   BRA Running Style — database sync adapter
   Menyinkronkan state ke Node.js API server (PostgreSQL / MySQL).
   Server: server/index.js — berjalan di port 3001 (default).
   ========================================================================== */
(function () {
  "use strict";

  const B = window.BRA;
  if (!B) return;

  // URL API server Node.js — sesuaikan port jika diubah di server/.env
  const API_BASE = "http://localhost:3001/api";

  let pendingSave = 0;

  // ── UI status indicator ─────────────────────────────────────────────────────

  window.addEventListener("bra-database-status", function (event) {
    const status = document.getElementById("db-status");
    if (!status) return;
    status.classList.remove("db-status--checking", "db-status--online", "db-status--offline");
    if (event.detail.connected) {
      status.classList.add("db-status--online");
      status.innerHTML = '<i class="ti ti-database"></i> Database aktif (' + (event.detail.db || "db") + ')';
      status.title = "Database tersambung: " + (event.detail.db || "");
    } else {
      status.classList.add("db-status--offline");
      status.innerHTML = '<i class="ti ti-database-off"></i> Local fallback';
      status.title = event.detail.message || "Server database tidak tersedia — data tersimpan di localStorage.";
    }
  });

  // ── Request helper ──────────────────────────────────────────────────────────

  async function request(path, options) {
    const response = await fetch(API_BASE + path, options || { cache: "no-store" });
    const payload  = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.message || "Sinkronisasi gagal.");
    return payload;
  }

  async function readDatabaseBlob(blobId, fileType) {
    try {
      const response = await fetch(API_BASE + "/blobs/" + encodeURIComponent(blobId), { cache: "no-store" });
      if (!response.ok) return null;
      return await response.blob();
    } catch (_) {
      return null;
    }
  }
  async function deleteDatabaseBlob(blobId) {
    try {
      const response = await fetch(API_BASE + "/blobs/" + encodeURIComponent(blobId), { method: "DELETE" });
      const payload = await response.json();
      return response.ok && payload.ok;
    } catch (_) {
      return false;
    }
  }

  B.readDatabaseBlob = readDatabaseBlob;
  B.deleteDatabaseBlob = deleteDatabaseBlob;

  async function migrateIndexedDbBlobs() {
    const state = B.get();
    const ids = new Set();
    (state.plannerFiles || []).forEach(function (file) { if (file.blobId) ids.add(file.blobId); });
    (state.workspaceFiles || []).forEach(function (file) {
      if (file.blobId) ids.add(file.blobId);
      if (file.previewBlobId) ids.add(file.previewBlobId);
    });
    if (!B.readBlob || !ids.size) return 0;

    let uploaded = 0;
    for (const blobId of ids) {
      try {
        const existing = await fetch(API_BASE + "/blobs/" + encodeURIComponent(blobId), { cache: "no-store" });
        if (existing.ok) continue;
      } catch (_) {}
      try {
        const file = await B.readBlob(blobId);
        const form = new FormData();
        form.append("file", new Blob([file], { type: file.type || "application/octet-stream" }), blobId);
        const response = await fetch(API_BASE + "/blobs/" + encodeURIComponent(blobId), {
          method: "POST",
          body: form,
        });
        const payload = await response.json();
        if (!response.ok || !payload.ok) continue;
        uploaded++;
      } catch (_) {
        continue;
      }
    }
    return uploaded;
  }

  // ── Save state to server ────────────────────────────────────────────────────

  async function saveToDatabase() {
    try {
      const result = await request("/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(B.get()),
      });
      const migrated = await migrateIndexedDbBlobs();
      window.dispatchEvent(new CustomEvent("bra-database-status", {
        detail: { connected: true, db: result.database || "db", migrated: migrated },
      }));
    } catch (error) {
      window.dispatchEvent(new CustomEvent("bra-database-status", {
        detail: { connected: false, message: error.message },
      }));
    }
  }

  // ── Hook into B.save ────────────────────────────────────────────────────────

  if (typeof B.save === "function") {
    const _save = B.save;
    B.save = function () {
      _save.apply(B, arguments);
      window.clearTimeout(pendingSave);
      pendingSave = window.setTimeout(saveToDatabase, 300);
    };
  }

  // ── Boot: load state from server (fallback to localStorage) ────────────────

  const originalBoot = window.BOOT;
  window.BOOT = async function () {
    try {
      const payload = await request("/state");
      if (payload.state) {
        localStorage.setItem(B.STORE_KEY, JSON.stringify(payload.state));
      }
      window.dispatchEvent(new CustomEvent("bra-database-status", {
        detail: { connected: true, db: payload.database || "db" },
      }));
    } catch (error) {
      window.dispatchEvent(new CustomEvent("bra-database-status", {
        detail: { connected: false, message: error.message },
      }));
    }

    originalBoot();

    // Migrasikan berkas IndexedDB yang belum ada di PostgreSQL.
    try {
      await migrateIndexedDbBlobs();
    } catch (error) {
      console.warn("Migrasi berkas PostgreSQL belum selesai:", error);
    }

    // Push initial state if server DB is empty
    try {
      const status = await request("/status");
      if (!status.has_state && B.get()) await saveToDatabase();
    } catch (_) {
      // Server tidak aktif — aplikasi tetap jalan dengan localStorage
    }
  };
})();
