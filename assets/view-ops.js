/* ==========================================================================
   BRA Running Style — import work view, monitoring, activity log
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const K = window.K;

  /* ------------------------------------------------------------------ import */

  const STEPS = [
    { n: 1, id: "sumber", label: "Sumber" },
    { n: 2, id: "pemetaan", label: "Pemetaan" },
    { n: 3, id: "rekonsiliasi", label: "Rekonsiliasi" },
    { n: 4, id: "konfirmasi", label: "Konfirmasi" }
  ];

  function stepRail() {
    const current = K.ui.importStep;
    return '<div class="steps">' + STEPS.map(function (step) {
      const done = current > step.n;
      const active = current === step.n;
      const mark = done ? '<i class="ti ti-check"></i>' : step.n;
      let note = "";
      if (step.id === "sumber") note = K.ui.importFile ? K.ui.importFile : "belum ada berkas";
      if (step.id === "pemetaan") note = K.ui.importParsed ? K.ui.importParsed.headers.length + " kolom" : "menunggu berkas";
      if (step.id === "rekonsiliasi") note = K.ui.importRec ? K.ui.importRec.counts.konflik + " konflik" : "menunggu pemetaan";
      if (step.id === "konfirmasi") note = K.ui.importRec ? "siap ditinjau" : "menunggu rekonsiliasi";
      return '<div class="step' + (done ? " is-done" : "") + (active ? " is-current" : "") + '">' +
        '<span class="step__mark">' + mark + "</span>" +
        '<span><span class="step__title">' + K.esc(step.label) + '</span><span class="step__note">' + K.esc(note) + "</span></span>" +
      "</div>";
    }).join("") + "</div>";
  }

  function stepSumber() {
    const parsed = K.ui.importParsed;
    return '<section class="panel" style="margin-top:20px">' +
      '<div class="panel__head"><div class="row"><h2 class="section-title">Sumber berkas</h2>' +
        '<span class="section-note">format .csv, .tsv, atau .txt</span></div></div>' +
      '<div class="panel__body stack">' +
        '<div class="field"><label for="imp-source">Jenis sumber</label>' +
          '<select id="imp-source" data-action="import-source">' +
            ['VS 2026 — Running Style FRONT/BACK', 'WK 42-43 New Style — Weekly Order', 'INDEX RUNNING STYLE 2026', 'Single style working file']
              .map(function (opt) {
                return '<option value="' + K.esc(opt) + '"' + (opt === K.ui.importSource ? " selected" : "") + ">" + K.esc(opt) + "</option>";
              }).join("") +
          "</select>" +
          '<p class="field__note">Berkas .xlsx belum dibaca langsung di demo ini; ekspor lembar kerja ke CSV terlebih dahulu.</p></div>' +
        '<div class="field"><label for="imp-file">Berkas</label>' +
          '<input id="imp-file" type="file" accept=".csv,.tsv,.txt" data-action="import-file">' +
          '<p class="field__note">Isi berkas dibaca di browser dan tidak dikirim ke server.</p></div>' +
        '<div class="row">' +
          '<button class="btn" data-action="import-sample"><i class="ti ti-table-import"></i>Muat contoh CSV</button>' +
          (parsed ? '<span class="hint">' + K.esc(K.ui.importFile) + " · " + parsed.headers.length + " kolom · " + parsed.totalRows + " baris</span>" : "") +
        "</div>" +
        (parsed
          ? '<div class="alert"><i class="ti ti-info-circle" aria-hidden="true"></i>' +
            "<div>Berkas terbaca. Isi baris belum tentu valid — validasi dilakukan pada langkah rekonsiliasi.</div></div>"
          : "") +
      "</div>" +
      '<div class="panel__foot"><span class="hint">Sumber tercatat sebagai asal batch setelah impor dikonfirmasi.</span>' +
        '<button class="btn-primary" data-action="import-next"' + (parsed ? "" : " disabled") + ">Lanjut ke pemetaan</button>" +
      "</div>" +
    "</section>";
  }

  function stepPemetaan() {
    const parsed = K.ui.importParsed;
    if (!parsed) return stepSumber();
    const sample = parsed.body[0] || [];
    const rows = parsed.headers.map(function (header, index) {
      const target = parsed.mapping[index] || "";
      const field = B.IMPORT_FIELDS.filter(function (f) { return f.key === target; })[0];
      return "<tr>" +
        '<td class="mono strong">' + K.esc(header) + "</td>" +
        '<td class="hint mono">' + K.esc(sample[index] || "—") + "</td>" +
        "<td><select class='select-inline' data-action='import-map' data-index='" + index + "'>" +
          '<option value="">Tidak dipetakan</option>' +
          B.IMPORT_FIELDS.map(function (f) {
            return '<option value="' + f.key + '"' + (f.key === target ? " selected" : "") + ">" + K.esc(f.label) + "</option>";
          }).join("") +
        "</select></td>" +
        '<td>' + (field && field.required ? '<span class="chip chip--att">wajib</span>' : '<span class="hint">opsional</span>') + "</td>" +
      "</tr>";
    }).join("");

    return '<section class="panel" style="margin-top:20px">' +
      '<div class="panel__head"><div class="row"><h2 class="section-title">Pemetaan kolom</h2>' +
        '<span class="section-note">' + parsed.headers.length + " kolom sumber</span></div>" +
        '<span class="hint">' + K.esc(K.ui.importFile || "contoh CSV") + "</span></div>" +
      '<div class="table-wrap"><table class="table">' +
        "<thead><tr><th style='width:24%'>Kolom sumber</th><th style='width:22%'>Contoh nilai</th>" +
        "<th style='width:34%'>Field tujuan</th><th style='width:20%'>Keperluan</th></tr></thead>" +
        "<tbody>" + rows + "</tbody></table></div>" +
      '<div class="panel__body stack">' +
        '<div><p class="kv__label">Aturan identitas</p>' +
          '<p class="hint" style="margin-top:6px">Style number dibaca sebagai teks sehingga nol di depan dipertahankan. Kunci pencocokan: style number + buyer.</p></div>' +
        '<div><p class="kv__label">Aturan sel kosong</p>' +
          '<div class="row" style="margin-top:6px">' +
            [["keep", "Pertahankan nilai lama"], ["clear", "Kosongkan nilai"]].map(function (pair) {
              return '<label class="row" style="gap:6px;cursor:pointer">' +
                '<input type="radio" name="blank-rule" value="' + pair[0] + '" data-action="import-blank"' +
                (K.ui.importBlankRule === pair[0] ? " checked" : "") + ">" +
                "<span>" + K.esc(pair[1]) + "</span></label>";
            }).join("") +
          "</div>" +
          '<p class="hint" style="margin-top:6px">Sel kosong tidak pernah dianggap perintah menghapus tanpa pilihan eksplisit.</p></div>' +
      "</div>" +
      '<div class="panel__foot"><button class="btn" data-action="import-back">Kembali</button>' +
        '<button class="btn-primary" data-action="import-next">Lanjut ke rekonsiliasi</button></div>' +
    "</section>";
  }

  function stepRekonsiliasi() {
    const rec = K.ui.importRec;
    if (!rec) return stepPemetaan();
    const groups = [
      ["baru", "Baru", "style belum ada di database"],
      ["tetap", "Tidak berubah", "identitas sudah sama dengan nilai tersimpan"],
      ["konflik", "Konflik", "nilai berbeda, perlu keputusan"],
      ["invalid", "Tidak valid", "nilai tidak sesuai format, dikecualikan"],
      ["duplikat", "Duplikat", "nomor style muncul lebih dari sekali"]
    ];

    const countRows = groups.map(function (group) {
      return '<div class="ratio-row" style="grid-template-columns:minmax(0,1fr) auto">' +
        "<div class=\"strong\">" + K.esc(group[1]) + "</div>" +
        '<div class="mono">' + rec.counts[group[0]] + "</div>" +
        '<div class="hint" style="grid-column:1 / -1">' + K.esc(group[2]) + "</div>" +
      "</div>";
    }).join("");

    const conflicts = rec.rows.filter(function (r) { return r.group === "konflik"; });
    const conflictRows = conflicts.map(function (row) {
      const decision = K.ui.importDecisions[row.rowIndex] || "";
      return "<tr>" +
        '<td class="mono strong">' + K.esc(row.id) + "</td>" +
        "<td>" + row.changes.map(function (c) {
          return '<div class="hint">' + K.esc(c.key) + '</div>';
        }).join("") + "</td>" +
        "<td>" + row.changes.map(function (c) {
          return '<div class="mono hint">' + K.esc(c.from || "—") + "</div>";
        }).join("") + "</td>" +
        "<td>" + row.changes.map(function (c) {
          return '<div class="mono strong">' + K.esc(c.to || "—") + "</div>";
        }).join("") + "</td>" +
        "<td><select class='select-inline' data-action='import-decision' data-row='" + row.rowIndex + "'>" +
          '<option value=""' + (decision ? "" : " selected") + ">Pilih…</option>" +
          '<option value="excel"' + (decision === "excel" ? " selected" : "") + ">Gunakan nilai dari Excel</option>" +
          '<option value="db"' + (decision === "db" ? " selected" : "") + ">Pertahankan nilai database</option>" +
        "</select></td>" +
      "</tr>";
    }).join("");

    const invalid = rec.rows.filter(function (r) { return r.group === "invalid" || r.group === "duplikat"; });
    const invalidList = invalid.map(function (row) {
      return '<li class="row row--top" style="gap:10px;padding:6px 0;border-top:1px solid var(--hair-soft)">' +
        '<span class="mono" style="width:96px;flex:none">' + K.esc(row.id || "baris " + (row.rowIndex + 2)) + "</span>" +
        '<span class="hint grow">' + K.esc(row.reasons.join(" · ")) + "</span>" +
        '<span class="chip chip--block">dikecualikan</span></li>';
    }).join("");

    const undecided = conflicts.filter(function (row) { return !K.ui.importDecisions[row.rowIndex]; }).length;

    return '<div class="split" style="margin-top:20px">' +
      '<section class="panel">' +
        '<div class="panel__head"><h2 class="section-title">Rekonsiliasi baris</h2>' +
          '<span class="hint">' + rec.rows.length + " baris diperiksa</span></div>" +
        '<div class="panel__body" style="padding:0">' +
          '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr))">' + countRows + "</div>" +
        "</div>" +
        '<div class="panel__head" style="border-top:1px solid var(--hair)">' +
          "<h2 class=\"section-title\">Konflik perlu keputusan</h2>" +
          '<span class="chip chip--att">' + undecided + " belum diputuskan</span></div>" +
        '<div class="table-wrap"><table class="table table--dense">' +
          "<thead><tr><th>Style</th><th>Field</th><th>Nilai database</th><th>Nilai Excel</th><th>Keputusan</th></tr></thead>" +
          "<tbody>" + (conflictRows || "<tr><td colspan='5' class='empty'>Tidak ada konflik pada berkas ini.</td></tr>") + "</tbody>" +
        "</table></div>" +
        (invalid.length
          ? '<div class="panel__head" style="border-top:1px solid var(--hair)"><h2 class="section-title">Baris dikecualikan</h2>' +
            '<span class="hint">' + invalid.length + " baris</span></div>" +
            '<ul style="padding:8px 18px 14px">' + invalidList + "</ul>"
          : "") +
        '<div class="panel__foot"><button class="btn" data-action="import-back">Kembali ke pemetaan</button>' +
          '<button class="btn-primary" data-action="import-next"' + (undecided ? " disabled" : "") + ">Tinjau ringkasan</button></div>" +
      "</section>" +
      '<aside class="inspector">' +
        '<div class="insp-section"><p class="insp-section__title">Yang tidak diubah impor ini</p>' +
          '<ul class="stack stack--tight">' +
            ["Sample Request", "Verifikasi dokumen teknis", "Publikasi FRONT/BACK", "Alokasi departemen"].map(function (item) {
              return '<li class="row row--between"><span class="hint">' + K.esc(item) + '</span><span class="hint">tetap</span></li>';
            }).join("") +
          "</ul>" +
          '<p class="hint" style="margin-top:10px">Nama berkas di Excel bukan bukti bahwa berkas ada di vault.</p>' +
        "</div>" +
        '<div class="insp-section"><p class="insp-section__title">Sumber</p>' +
          '<div class="kv"><div><div class="kv__label">Berkas</div><div class="kv__value mono" style="word-break:break-all">' +
          K.esc(K.ui.importFile || "contoh CSV") + "</div></div>" +
          '<div><div class="kv__label">Jenis</div><div class="kv__value">' + K.esc(K.ui.importSource) + "</div></div></div>" +
        "</div>" +
      "</aside>" +
    "</div>";
  }

  function stepKonfirmasi() {
    const rec = K.ui.importRec;
    if (!rec) return stepRekonsiliasi();
    const result = K.ui.importResult;
    const applyExcel = Object.keys(K.ui.importDecisions).filter(function (key) {
      return K.ui.importDecisions[key] === "excel";
    }).length;
    const fieldChanges = rec.rows.filter(function (r) { return r.group === "konflik" && K.ui.importDecisions[r.rowIndex] === "excel"; })
      .reduce(function (sum, row) { return sum + row.changes.length; }, 0);

    if (result) {
      return '<section class="panel" style="margin-top:20px">' +
        '<div class="panel__head"><h2 class="section-title">Impor ' + K.esc(result.batch.id) + " selesai</h2>" +
          '<span class="chip chip--ok">tercatat</span></div>' +
        '<div class="panel__body stack">' +
          '<div class="kv">' +
            '<div><div class="kv__label">Style baru</div><div class="kv__value mono">' + result.created + "</div></div>" +
            '<div><div class="kv__label">Field diperbarui</div><div class="kv__value mono">' + result.updatedFields + "</div></div>" +
            '<div><div class="kv__label">Baris dikecualikan</div><div class="kv__value mono">' + result.skipped + "</div></div>" +
            '<div><div class="kv__label">Waktu</div><div class="kv__value mono">' + B.fmtDate(result.batch.at) + "</div></div>" +
          "</div>" +
          '<p class="hint">Batch tetap tersimpan sebagai asal perubahan. Bukti sample request dan verifikasi dokumen tidak dibuat oleh impor.</p>' +
        "</div>" +
        '<div class="panel__foot">' +
          '<button class="btn" data-action="import-reset">Impor berkas lain</button>' +
          '<a class="btn-primary" href="#/tindak-lanjut">Lihat tindak lanjut hasil impor</a>' +
        "</div>" +
      "</section>";
    }

    return '<section class="panel" style="margin-top:20px">' +
      '<div class="panel__head"><h2 class="section-title">Ringkasan sebelum konfirmasi</h2>' +
        '<span class="hint">langkah terakhir</span></div>' +
      '<div class="panel__body stack">' +
        '<div class="kv">' +
          '<div><div class="kv__label">Dibuat</div><div class="kv__value mono">' + rec.counts.baru + " style</div></div>" +
          '<div><div class="kv__label">Diperbarui</div><div class="kv__value mono">' + fieldChanges + " field pada " + applyExcel + " style</div></div>" +
          '<div><div class="kv__label">Dikecualikan</div><div class="kv__value mono">' + (rec.counts.invalid + rec.counts.duplikat) + " baris</div></div>" +
          '<div><div class="kv__label">Tidak berubah</div><div class="kv__value mono">' + rec.counts.tetap + " baris</div></div>" +
        "</div>" +
        '<div class="alert alert--att"><i class="ti ti-alert-triangle" aria-hidden="true"></i>' +
          "<div>Impor identitas tidak membuat Sample Request dan tidak memverifikasi dokumen teknis. Alokasi departemen juga tidak berubah.</div></div>" +
      "</div>" +
      '<div class="panel__foot"><button class="btn" data-action="import-back">Kembali ke rekonsiliasi</button>' +
        (B.can("import")
          ? '<button class="btn-primary" data-action="import-commit">Konfirmasi impor</button>'
          : '<span class="hint"><i class="ti ti-lock"></i> Peran ini tidak boleh mengimpor.</span>') +
      "</div>" +
    "</section>";
  }

  function viewImport() {
    let body = stepSumber();
    if (K.ui.importStep === 2) body = stepPemetaan();
    if (K.ui.importStep === 3) body = stepRekonsiliasi();
    if (K.ui.importStep === 4) body = stepKonfirmasi();

    return '<div class="page-head">' +
      "<div>" +
        '<h1 class="page-title">Impor Excel</h1>' +
        '<p class="page-sub">Berkas mingguan masuk lewat satu alur kerja: petakan kolom, putuskan konflik, lalu konfirmasi perubahan yang diizinkan.</p>' +
      "</div>" +
      '<div class="page-actions"><a class="btn" href="#/database"><i class="ti ti-table"></i>Database style</a></div>' +
    "</div>" +
    '<section class="panel">' + stepRail() + "</section>" +
    body;
  }

  /* ------------------------------------------------------------- pemantauan */

  function viewPemantauan() {
    const styles = B.get().styles;
    const rows = B.completeness().map(function (row) {
      const pct = row.total ? Math.round((row.have / row.total) * 100) : 0;
      const missing = styles.filter(function (s) { return B.docState(B.docOf(s, row.cat)) !== "verified"; });
      return "<tr>" +
        '<td class="strong">' + K.esc(row.cat) + "</td>" +
        '<td class="mono">' + row.have + " / " + row.total + "</td>" +
        '<td style="width:160px"><div class="meter ' + (pct < 60 ? "meter--block" : pct < 85 ? "meter--att" : "") + '"><span style="width:' + pct + '%"></span></div></td>' +
        '<td class="hint">' + (missing.length
          ? K.esc(missing.slice(0, 4).map(function (s) { return s.id; }).join(", ")) + (missing.length > 4 ? " +" + (missing.length - 4) + " lain" : "")
          : "lengkap") + "</td>" +
      "</tr>";
    }).join("");

    const totalDocs = styles.length * B.DOC_CATS.length;
    const deptRows = B.DEPTS.map(function (dept) {
      let allocated = 0;
      styles.forEach(function (s) {
        s.docs.forEach(function (doc) { if (doc.alloc[dept]) allocated += 1; });
      });
      const pct = Math.round((allocated / totalDocs) * 100);
      return "<tr>" +
        '<td class="strong">' + K.esc(dept) + "</td>" +
        '<td class="mono">' + allocated + " / " + totalDocs + "</td>" +
        '<td style="width:160px"><div class="meter ' + (pct < 40 ? "meter--att" : "") + '"><span style="width:' + pct + '%"></span></div></td>' +
        '<td class="hint">' + (dept === "MD" || dept === "Pattern Maker" || dept === "IE-Technical"
          ? "departemen pengguna utama dokumen"
          : "perlu penetapan per dokumen") + "</td>" +
      "</tr>";
    }).join("");

    const issues = B.buildIssues();
    const kinds = [
      ["doc-missing", "Dokumen belum tersedia"],
      ["doc-pending", "Menunggu verifikasi"],
      ["doc-revise", "Perlu revisi"],
      ["pub-draft", "Publikasi masih draft"],
      ["sample-no-evidence", "Bukti sample belum ada"],
      ["pic-missing", "PIC belum ditetapkan"],
      ["alloc-gap", "Alokasi belum ditetapkan"]
    ];

    return '<div class="page-head">' +
      "<div>" +
        '<h1 class="page-title">Pemantauan</h1>' +
        '<p class="page-sub">Ketersediaan berkas, verifikasi, dan alokasi departemen dipisahkan supaya angka tidak saling menutupi.</p>' +
      "</div>" +
      '<div class="page-actions"><button class="btn" data-action="export-csv"><i class="ti ti-download"></i>Ekspor CSV</button></div>' +
    "</div>" +
    '<section class="panel">' +
      '<div class="panel__head"><div class="row"><h2 class="section-title">Kelengkapan dokumen</h2>' +
        '<span class="section-note">versi terverifikasi per kategori</span></div>' +
        '<span class="mono hint">' + styles.length + " style aktif</span></div>" +
      '<div class="table-wrap"><table class="table">' +
        "<thead><tr><th style='width:26%'>Kategori</th><th style='width:14%'>Terverifikasi</th><th style='width:20%'></th><th>Style belum lengkap</th></tr></thead>" +
        "<tbody>" + rows + "</tbody></table></div>" +
    "</section>" +
    '<section class="panel" style="margin-top:20px">' +
      '<div class="panel__head"><div class="row"><h2 class="section-title">Cakupan alokasi per departemen</h2>' +
        '<span class="section-note">dokumen × departemen</span></div></div>' +
      '<div class="table-wrap"><table class="table">' +
        "<thead><tr><th style='width:26%'>Departemen</th><th style='width:14%'>Dialokasikan</th><th style='width:20%'></th><th>Catatan</th></tr></thead>" +
        "<tbody>" + deptRows + "</tbody></table></div>" +
    "</section>" +
    '<section class="panel" style="margin-top:20px">' +
      '<div class="panel__head"><div class="row"><h2 class="section-title">Komposisi antrean</h2>' +
        '<span class="section-note">' + issues.length + " item terbuka</span></div>" +
        '<a class="link link--quiet" href="#/tindak-lanjut">Buka antrean</a></div>' +
      '<div class="panel__body" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0">' +
        kinds.map(function (kind) {
          const count = issues.filter(function (i) { return i.kind === kind[0]; }).length;
          return '<div class="ratio-row" style="grid-template-columns:minmax(0,1fr) auto">' +
            "<div>" + K.esc(kind[1]) + "</div>" +
            '<div class="mono strong">' + count + "</div></div>";
        }).join("") +
      "</div>" +
    "</section>";
  }

  /* ------------------------------------------------------------------- log */

  const LOG_TYPES = [
    ["semua", "Semua"],
    ["dokumen", "Dokumen"],
    ["alokasi", "Alokasi"],
    ["publikasi", "Publikasi"],
    ["impor", "Impor"],
    ["database", "Database"]
  ];

  function viewLog() {
    const query = (K.ui.logQuery || "").toLowerCase();
    const items = B.get().activity.filter(function (item) {
      if (K.ui.logFilter !== "semua" && item.type !== K.ui.logFilter) return false;
      if (!query) return true;
      return (item.title + " " + item.detail + " " + item.actor + " " + item.ref).toLowerCase().indexOf(query) !== -1;
    });

    const rows = items.map(function (item) {
      return "<tr>" +
        '<td class="mono nowrap">' + B.fmtDate(item.at) + "</td>" +
        '<td><span class="chip">' + K.esc(item.type) + "</span></td>" +
        "<td><div class=\"strong\">" + K.esc(item.title) + '</div><div class="cell-sub">' + K.esc(item.detail) + "</div></td>" +
        '<td class="nowrap">' + K.esc(item.actor) + "</td>" +
        '<td class="mono hint">' + K.esc(item.ref || "—") + "</td>" +
      "</tr>";
    }).join("");

    return '<div class="page-head">' +
      "<div>" +
        '<h1 class="page-title">Log aktivitas</h1>' +
        '<p class="page-sub">Setiap tindakan tercatat dengan objek yang berubah, bukan hanya “data diperbarui”.</p>' +
      "</div>" +
      '<div class="page-actions"><a class="btn" href="#/impor"><i class="ti ti-table-import"></i>Impor Excel</a></div>' +
    "</div>" +
    '<div class="toolbar">' +
      '<div class="segmented">' + LOG_TYPES.map(function (pair) {
        return '<button data-action="log-filter" data-type="' + pair[0] + '"' + (K.ui.logFilter === pair[0] ? ' class="is-active"' : "") + ">" + pair[1] + "</button>";
      }).join("") + "</div>" +
      '<label class="search" style="max-width:280px"><i class="ti ti-search" aria-hidden="true"></i>' +
        '<input type="search" data-filter="logQuery" value="' + K.esc(K.ui.logQuery) + '" placeholder="Cari aktivitas, style, orang…" aria-label="Cari log"></label>' +
    "</div>" +
    '<section class="panel"><div class="table-wrap"><table class="table">' +
      "<thead><tr><th style='width:12%'>Tanggal</th><th style='width:11%'>Jenis</th><th>Aktivitas</th>" +
      "<th style='width:14%'>Oleh</th><th style='width:12%'>Objek</th></tr></thead>" +
      "<tbody>" + (rows || "<tr><td colspan='5' class='empty'>Tidak ada aktivitas yang cocok.</td></tr>") + "</tbody>" +
    "</table></div></section>";
  }

  K.views.impor = viewImport;
  K.views.pemantauan = viewPemantauan;
  K.views.log = viewLog;
  K.LOG_TYPES = LOG_TYPES;
})();
