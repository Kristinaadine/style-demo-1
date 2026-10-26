/* ==========================================================================
   BRA Running Style — Edit sel (bulk cell editing + pending change set)
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const K = window.K;

  function key(id, field) { return id + "|" + field; }

  function cellValue(s, field) {
    const k = key(s.id, field);
    if (Object.prototype.hasOwnProperty.call(K.ui.cells, k)) return K.ui.cells[k];
    return K.flatValue(s, field);
  }

  function cellInput(s, field, type) {
    const k = key(s.id, field);
    const value = cellValue(s, field);
    const dirty = Object.prototype.hasOwnProperty.call(K.ui.cells, k) && String(value) !== String(K.flatValue(s, field));
    const invalid = field === "mc" && String(value) !== "" && !(Number(value) >= 0.5 && Number(value) <= 4);
    return '<input class="cell-edit input-cell' + (dirty ? " cell-dirty" : "") + (invalid ? " is-invalid" : "") + '"' +
      ' data-cell="' + K.esc(k) + '"' +
      (type === "number" ? ' type="number" step="0.1" min="0.5" max="4"' : ' type="text"') +
      ' value="' + K.esc(value) + '"' + (B.can("bulk") ? "" : " disabled") + ">";
  }

  function cellSelect(s, field, list) {
    const k = key(s.id, field);
    const value = cellValue(s, field);
    const dirty = Object.prototype.hasOwnProperty.call(K.ui.cells, k) && String(value) !== String(K.flatValue(s, field));
    return '<select class="cell-edit input-cell' + (dirty ? " cell-dirty" : "") + '" data-cell="' + K.esc(k) + '"' +
      (B.can("bulk") ? "" : " disabled") + ">" + K.options(list, value) + "</select>";
  }

  function changes() {
    const out = [];
    Object.keys(K.ui.cells).forEach(function (k) {
      const cut = k.indexOf("|");
      const id = k.slice(0, cut);
      const field = k.slice(cut + 1);
      const s = B.styleById(id);
      if (!s) return;
      const before = String(K.flatValue(s, field));
      const after = String(K.ui.cells[k]);
      if (before === after) return;
      out.push({
        key: k,
        id: id,
        field: field,
        label: K.FIELD_LABELS[field] || field,
        before: before,
        after: after,
        invalid: field === "mc" && !(Number(after) >= 0.5 && Number(after) <= 4)
      });
    });
    return out;
  }

  function pendingPanel(list) {
    if (!list.length) {
      return '<section class="pending"><div class="pending__head">' +
        '<i class="ti ti-pencil" aria-hidden="true"></i>' +
        "<strong>Belum ada perubahan</strong>" +
        '<span class="hint">Ubah nilai pada sel. Perubahan baru tersimpan setelah “Simpan perubahan”.</span>' +
        "</div></section>";
    }
    const styleCount = new Set(list.map(function (c) { return c.id; })).size;
    const invalid = list.filter(function (c) { return c.invalid; }).length;

    const rows = list.map(function (c) {
      return (
        '<div class="pending-row' + (c.invalid ? " is-invalid" : "") + '">' +
          '<div class="mono">' + K.esc(c.id) + " · " + K.esc(c.label) + "</div>" +
          '<div class="pending-old">' + K.esc(c.before || "—") + "</div>" +
          '<div class="pending-new">' + K.esc(c.after || "—") +
            (c.invalid ? '<span class="cell-sub" style="color:var(--block)">harus antara 0,5–4,0</span>' : "") + "</div>" +
          '<div><span class="chip">Edit manual</span></div>' +
          '<div style="text-align:right"><button class="link link--quiet" data-action="discard-cell" data-cell="' + K.esc(c.key) + '">Batalkan</button></div>' +
        "</div>"
      );
    }).join("");

    return (
      '<section class="pending">' +
        '<div class="pending__head">' +
          "<strong>" + list.length + " sel berubah pada " + styleCount + " style</strong>" +
          '<span class="hint">' + (invalid ? invalid + " sel tidak valid" : "belum disimpan") + "</span>" +
          '<div class="toolbar__right row">' +
            '<button class="btn" data-action="discard-cells">Batalkan</button>' +
            '<button class="btn-primary" data-action="save-cells"' + (invalid || !B.can("bulk") ? " disabled" : "") + ">Simpan perubahan</button>" +
          "</div>" +
        "</div>" +
        '<div class="pending__list">' + rows + "</div>" +
        '<div class="pending__foot">' +
          '<span class="hint">Kolom Blue Files dan publikasi tidak bisa diedit di sini; keduanya punya alur verifikasi sendiri.</span>' +
          (B.can("bulk") ? "" : '<span class="hint"><i class="ti ti-lock"></i> Peran ' + K.esc(K.roleLabel()) + " tidak boleh mengedit massal.</span>") +
        "</div>" +
      "</section>"
    );
  }

  function view() {
    const list = K.filteredStyles();
    const list2 = changes();

    const rows = list.map(function (s) {
      const p = B.docProgress(s);
      return (
        "<tr>" +
          '<td class="col-sticky"><span class="mono strong">' + K.esc(s.id) + "</span>" +
            '<span class="cell-sub">' + B.fmtDate(s.updatedAt) + "</span></td>" +
          '<td style="min-width:180px">' + K.esc(s.desc) + "</td>" +
          '<td class="nowrap">' + K.esc(s.buyer) + "</td>" +
          "<td>" + cellInput(s, "week") + "</td>" +
          "<td>" + cellSelect(s, "dev", B.DEV_STATES) + "</td>" +
          "<td>" + cellSelect(s, "prod", B.PROD_STATES) + "</td>" +
          "<td>" + cellInput(s, "mc", "number") + "</td>" +
          "<td>" + cellSelect(s, "sample", B.SAMPLE_STATES) + "</td>" +
          "<td>" + cellInput(s, "pic.mdmkt") + "</td>" +
          "<td>" + cellInput(s, "pic.pattern") + "</td>" +
          "<td>" + cellInput(s, "pic.ie") + "</td>" +
          "<td>" + cellInput(s, "pic.prod") + "</td>" +
          "<td>" + cellInput(s, "pic.qa") + "</td>" +
          '<td class="nowrap"><span class="locked-cell"><i class="ti ti-lock" aria-hidden="true"></i>' + p.ok + "/" + p.total + "</span>" +
            '<a class="link link--quiet" style="margin-left:6px" href="#/style/' + K.esc(s.id) + '">buka</a></td>' +
        "</tr>"
      );
    }).join("");

    return (
      '<div class="page-head">' +
        "<div>" +
          '<h1 class="page-title">Edit sel</h1>' +
          '<p class="page-sub">Kerjakan satu kelompok style sekaligus. Semua perubahan tertahan sampai Anda menekan “Simpan perubahan”.</p>' +
        "</div>" +
        '<div class="page-actions">' +
          '<a class="btn" href="#/database"><i class="ti ti-arrow-left"></i>Kembali ke database</a>' +
          '<button class="btn" data-action="export-csv"><i class="ti ti-download"></i>Ekspor CSV</button>' +
        "</div>" +
      "</div>" +
      K.filterBar('<div class="toolbar__right"><span class="mono hint">' + list.length + " style · " + list2.length + " sel berubah</span></div>") +
      '<section class="panel">' +
        '<div class="table-wrap">' +
          '<table class="table table--dense">' +
            "<thead>" +
              "<tr>" +
                '<th colspan="4">Identitas</th>' +
                '<th colspan="3">Development &amp; produksi</th>' +
                "<th>Sample</th>" +
                '<th colspan="5">Penanggung jawab</th>' +
                "<th>Dokumentasi</th>" +
              "</tr>" +
              "<tr>" +
                "<th>Style</th><th>Deskripsi</th><th>Buyer</th><th>Minggu</th>" +
                "<th>Dev</th><th>Produksi</th><th>MC</th><th>Sample</th>" +
                "<th>MD-MKT</th><th>Pattern</th><th>IE-Tech</th><th>Production</th><th>QA</th>" +
                "<th>Blue Files</th>" +
              "</tr>" +
            "</thead>" +
            "<tbody>" + rows + "</tbody>" +
          "</table>" +
        "</div>" +
        (list.length ? "" : '<div class="empty">Tidak ada style pada filter ini.</div>') +
        '<div class="table-foot"><span class="hint">Geser ke kanan untuk kolom PIC lainnya. Kolom dokumentasi dikunci.</span>' +
          '<span class="mono">' + list.length + " baris</span></div>" +
      "</section>" +
      pendingPanel(list2)
    );
  }

  K.views["edit-sel"] = view;
  K.cellChanges = changes;
  K.renderPendingPanel = pendingPanel;
})();
