/* ==========================================================================
   BRA Running Style — weekly Planner file inbox
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const K = window.K;

  function viewPlanner() {
    const records = B.get().plannerFiles;
    const rows = records.map(function (record) {
      return "<tr>" +
        '<td class="mono strong">' + K.esc(record.week) + "</td>" +
        "<td><div class=\"strong\">" + K.esc(record.displayName) + "</div>" +
          '<div class="cell-sub">' + K.esc(K.formatBytes(record.size)) + "</div></td>" +
        '<td class="nowrap">' + K.esc(K.formatDate(record.receivedAt)) + "</td>" +
        '<td><button type="button" class="btn" data-download-kind="planner"' +
          ' data-blob-id="' + K.esc(record.blobId) + '"' +
          ' data-file-name="' + K.esc(record.displayName) + '"' +
          ' data-file-type="' + K.esc(record.type) + '">' +
          '<i class="ti ti-download" aria-hidden="true"></i>Unduh</button></td>' +
      "</tr>";
    }).join("");

    return '<div class="page-head">' +
      "<div><h1 class=\"page-title\">Planner mingguan</h1>" +
        '<p class="page-sub">Simpan file New Style Updated dari Planner dan kelompokkan menurut minggu penerimaannya, misalnya WK 11 atau WK 11-14.</p></div>' +
    "</div>" +
    '<section class="panel workspace-form-panel">' +
      '<div class="panel__head"><div><h2 class="section-title">Tambah file Planner</h2>' +
        '<p class="section-note">File asli disimpan di penyimpanan browser pada perangkat ini.</p></div></div>' +
      '<form class="workspace-form" data-workspace-form="planner">' +
        '<div class="field"><label for="planner-week">Minggu diterima</label>' +
          '<input id="planner-week" name="week" type="text" placeholder="WK 11-14" required ' +
            'pattern="(WK|WEEK)\\s*[0-9]{1,2}(\\s*-\\s*(WK|WEEK)?\\s*[0-9]{1,2})?" ' +
            'title="Contoh: WK 11 atau WK 11-14"></div>' +
        '<div class="field"><label for="planner-file">File New Style Updated</label>' +
          '<input id="planner-file" name="file" type="file" required>' +
          '<p class="field__note">Saat ini file disimpan di browser ini dan belum dibagikan ke server kantor.</p></div>' +
        '<button type="submit" class="btn-primary"><i class="ti ti-upload"></i>Simpan file Planner</button>' +
      "</form>" +
    "</section>" +
    '<section class="panel workspace-table-panel">' +
      '<div class="panel__head"><div><h2 class="section-title">File Planner yang diterima</h2>' +
        '<p class="section-note">' + records.length + " file tersimpan</p></div></div>" +
      '<div class="table-wrap"><table class="table">' +
        "<thead><tr><th>Minggu</th><th>Nama file</th><th>Diterima</th><th>Aksi</th></tr></thead>" +
        "<tbody>" + (rows || '<tr><td colspan="4" class="empty">Belum ada file Planner. Unggah file di bagian atas untuk memulai.</td></tr>') + "</tbody>" +
      "</table></div>" +
    "</section>";
  }

  K.views.planner = viewPlanner;
})();
