/* ==========================================================================
   BRA Running Style — weekly Planner file inbox
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const K = window.K;

  function viewPlanner() {
    const canUploadPlanner = K.can ? K.can("canUploadPlanner") : true;
    const canImport = K.can ? K.can("canImport") : true;
    const canDelete = K.can ? K.can("canDelete") : true;
    const canEdit = K.can ? K.can("canEdit") : true;
    const records = B.get().plannerFiles;
    const importedNames = (B.get().indexImports || []).map(function (imp) {
      return imp.fileName ? imp.fileName.toLowerCase() : "";
    });

    const rows = records.map(function (record) {
      const alreadyImported = importedNames.indexOf(record.name.toLowerCase()) !== -1;
      return "<tr>" +
        '<td class="mono strong">' + K.esc(record.week) + "</td>" +
        "<td><div class=\"strong\">" + K.esc(record.displayName) + "</div>" +
          '<div class="cell-sub">' + K.esc(K.formatBytes(record.size)) + "</div></td>" +
        '<td class="nowrap">' + K.esc(K.formatDate(record.receivedAt)) + "</td>" +
        '<td>' + (alreadyImported
          ? '<span class="chip chip--ok"><i class="ti ti-check" aria-hidden="true"></i>Sudah diimport</span>'
          : '<span class="chip chip--att">Belum diimport</span>') + "</td>" +
        '<td><div class="file-actions">' +
          '<button type="button" class="btn btn-primary" data-preview-kind="planner"' +
            ' data-blob-id="' + K.esc(record.blobId) + '"' +
            ' data-file-name="' + K.esc(record.displayName) + '"' +
            ' data-file-type="' + K.esc(record.type) + '">' +
            '<i class="ti ti-eye" aria-hidden="true"></i>Preview</button>' +
          '<button type="button" class="btn" data-download-kind="planner"' +
            ' data-blob-id="' + K.esc(record.blobId) + '"' +
            ' data-file-name="' + K.esc(record.name) + '"' +
            ' data-file-type="' + K.esc(record.type) + '">' +
            '<i class="ti ti-download" aria-hidden="true"></i>Unduh</button>' +
          (canEdit ? ('<button type="button" class="btn" data-rename-file="planner"' +
            ' data-blob-id="' + K.esc(record.blobId) + '"' +
            ' data-file-name="' + K.esc(record.name) + '">' +
            '<i class="ti ti-pencil" aria-hidden="true"></i>Rename</button>') : '') +
          (canImport ? ('<button type="button" class="btn" data-import-planner-to-master' +
            ' data-blob-id="' + K.esc(record.blobId) + '"' +
            ' data-file-name="' + K.esc(record.name) + '"' +
            ' data-file-type="' + K.esc(record.type) + '"' +
            ' data-file-week="' + K.esc(record.week || '') + '"' +
            ' title="Baca isi file ini dan masukkan datanya ke Data Master">' +
            '<i class="ti ti-database-import" aria-hidden="true"></i>Import ke Data Master</button>') : '') +
          (canDelete ? ('<button type="button" class="btn btn--danger" data-delete-planner-file' +
            ' data-blob-id="' + K.esc(record.blobId) + '"' +
            ' data-file-name="' + K.esc(record.displayName) + '"' +
            ' title="Hapus file ini dari Planner">' +
            '<i class="ti ti-trash" aria-hidden="true"></i>Hapus</button>') : '') +
          '</div></td>' +
      "</tr>";
    }).join("");

    return '<div class="page-head">' +
      '<div><h1 class="page-title">Planner mingguan</h1></div>' +
      '</div>' +
    (canUploadPlanner ? ('<section class="panel workspace-form-panel">' +
      '<div class="panel__head"><div><h2 class="section-title">Tambah file Planner</h2>' +
        '<p class="section-note">File asli disimpan di penyimpanan browser pada perangkat ini.</p></div></div>' +
      '<form class="workspace-form planner-form" data-workspace-form="planner">' +
        '<div class="field"><label for="planner-week">Minggu diterima</label>' +
          '<input id="planner-week" name="week" type="text" placeholder="contoh : WK 11-14" required ' +
            'title="Huruf besar atau kecil diperbolehkan. Contoh: wk 11, WK 11, atau wk 11-14"></div>' +
        '<div class="field"><label for="planner-file">File New Style Updated</label>' +
          '<input id="planner-file" name="file" type="file" accept=".xlsx,.xls,.csv" required>' +
          '<p class="field__note">Format: .xlsx, .xls, atau .csv. Maksimal 1 GB per berkas.</p></div>' +
        '<button type="submit" class="btn-primary"><i class="ti ti-upload"></i>Simpan file Planner</button>' +
      "</form>" +
    "</section>") : '') +
    '<section class="panel workspace-table-panel">' +
      '<div class="panel__head"><div><h2 class="section-title">File Planner yang diterima</h2>' +
        '<p class="section-note">' + records.length + " file tersimpan</p></div></div>" +
      '<div class="table-wrap"><table class="table">' +
        "<thead><tr><th>Minggu</th><th>Nama file</th><th>Diterima</th><th>Status</th><th>Aksi</th></tr></thead>" +
        "<tbody>" + (rows || '<tr><td colspan="5" class="empty">Belum ada file Planner. Unggah file di bagian atas untuk memulai.</td></tr>') + "</tbody>" +
      "</table></div>" +
    "</section>";
  }

  K.views.planner = viewPlanner;
})();
