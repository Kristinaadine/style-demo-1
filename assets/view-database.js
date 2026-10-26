/* ==========================================================================
   BRA Running Style — Database style (results grid + live editor)
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const K = window.K;

  function filteredStyles() {
    const q = (K.ui.dbQuery || "").toLowerCase();
    return B.get().styles.filter(function (s) {
      if (K.ui.dbBuyer && s.buyer !== K.ui.dbBuyer) return false;
      if (K.ui.dbWeek && s.week !== K.ui.dbWeek) return false;
      if (K.ui.dbDev && s.dev !== K.ui.dbDev) return false;
      if (!q) return true;
      const hay = [s.id, s.desc, s.brand, s.group, s.pic.pattern, s.pic.mdmkt, s.pic.ie, s.pic.prod];
      return hay.join(" ").toLowerCase().indexOf(q) !== -1;
    });
  }

  function draftFor(s) {
    if (!K.ui.dbDraft || K.ui.dbDraft.id !== s.id) {
      K.ui.dbDraft = { id: s.id, values: K.styleValues(s) };
    }
    return K.ui.dbDraft;
  }

  function dirtyKeys(s) {
    const d = draftFor(s);
    const current = K.styleValues(s);
    return Object.keys(current).filter(function (key) {
      return String(d.values[key] == null ? "" : d.values[key]) !== String(current[key] == null ? "" : current[key]);
    });
  }

  function fieldInput(key, label, value, isDirty, note) {
    return (
      '<div class="field' + (isDirty ? " is-dirty" : "") + '">' +
        '<label for="f-' + key + '">' + K.esc(label) + "</label>" +
        '<input id="f-' + key + '" type="text" data-field="' + key + '" value="' + K.esc(value) + '">' +
        (note ? '<p class="field__note">' + K.esc(note) + "</p>" : "") +
      "</div>"
    );
  }

  function fieldChoice(key, label, value, list, isDirty, note) {
    return (
      '<div class="field' + (isDirty ? " is-dirty" : "") + '">' +
        '<label for="f-' + key + '">' + K.esc(label) + "</label>" +
        '<select id="f-' + key + '" data-field="' + key + '">' + K.options(list, value) + "</select>" +
        (note ? '<p class="field__note">' + K.esc(note) + "</p>" : "") +
      "</div>"
    );
  }

  function filterBar(right) {
    const buyers = [];
    const weeks = [];
    B.get().styles.forEach(function (s) {
      if (buyers.indexOf(s.buyer) === -1) buyers.push(s.buyer);
      if (weeks.indexOf(s.week) === -1) weeks.push(s.week);
    });
    weeks.sort();
    return (
      '<div class="toolbar">' +
        '<label class="search"><i class="ti ti-search" aria-hidden="true"></i>' +
          '<input type="search" data-filter="dbQuery" value="' + K.esc(K.ui.dbQuery) + '" placeholder="Cari style, deskripsi, PIC…" aria-label="Cari style">' +
        "</label>" +
        '<select class="select" data-filter="dbBuyer" aria-label="Filter buyer">' + K.options(buyers, K.ui.dbBuyer, "Semua buyer") + "</select>" +
        '<select class="select" data-filter="dbWeek" aria-label="Filter minggu">' + K.options(weeks, K.ui.dbWeek, "Semua minggu") + "</select>" +
        '<select class="select" data-filter="dbDev" aria-label="Filter status">' + K.options(B.DEV_STATES, K.ui.dbDev, "Semua status") + "</select>" +
        (right || "") +
      "</div>"
    );
  }

  function view() {
    const list = filteredStyles();
    let s = B.styleById(K.ui.dbStyleId);
    if (!s || list.indexOf(s) === -1) {
      s = list[0] || B.get().styles[0];
      K.ui.dbStyleId = s.id;
      K.ui.dbDraft = null;
    }

    const draft = draftFor(s).values;
    const dirty = dirtyKeys(s);
    const progress = B.docProgress(s);
    const missing = B.DOC_CATS.filter(function (cat) { return B.docState(B.docOf(s, cat)) !== "verified"; });

    const rows = list.map(function (row) {
      const p = B.docProgress(row);
      return (
        '<tr class="is-clickable' + (row.id === s.id ? " is-selected" : "") + '" data-action="select-style" data-id="' + K.esc(row.id) + '">' +
          '<td><span class="mono strong">' + K.esc(row.id) + "</span>" +
            '<span class="cell-sub truncate">' + K.esc(row.desc) + "</span></td>" +
          '<td class="nowrap">' + K.esc(row.buyer) + "</td>" +
          "<td>" + K.stateDot(row.dev, K.toneOfDev(row.dev)) + "</td>" +
          "<td>" + K.stateDot(row.prod, K.toneOfProd(row.prod)) + "</td>" +
          "<td>" + K.stateDot(row.sample, K.toneOfSample(row.sample)) + "</td>" +
          '<td class="nowrap">' + K.esc(row.pic.pattern || "—") + "</td>" +
          '<td class="num">' + p.ok + "/" + p.total + "</td>" +
          '<td class="num nowrap">' + B.fmtDate(row.updatedAt) + "</td>" +
        "</tr>"
      );
    }).join("");

    const dot = function (cat) {
      const st = B.docState(B.docOf(s, cat));
      const tone = st === "verified" ? "ok" : st === "missing" ? "block" : "att";
      return '<span class="state state--' + tone + '"><span class="state__dot"></span>' + K.esc(cat) + "</span>";
    };

    const inspector =
      '<form class="inspector" data-form="style" data-id="' + K.esc(s.id) + '">' +
        '<div class="inspector__head">' +
          '<div class="inspector__eyebrow"><span class="mono">' + K.esc(s.id) + "</span>" +
            '<span class="hint">' + B.fmtDate(s.updatedAt) + "</span></div>" +
          '<h2 class="inspector__title">' + K.esc(s.desc || "Tanpa deskripsi") + "</h2>" +
          '<p class="inspector__sub">' + K.esc(s.brand) + " · " + K.esc(s.group) + "</p>" +
        "</div>" +

        '<div class="insp-section">' +
          '<p class="insp-section__title">Identitas</p>' +
          '<div class="field-grid">' +
            '<div class="field"><label for="f-id">Style number</label>' +
              '<input id="f-id" type="text" value="' + K.esc(s.id) + '" readonly>' +
              '<p class="field__note">Tersimpan sebagai teks; nol di depan dipertahankan.</p></div>' +
            fieldInput("brand", "Brand", draft.brand, dirty.indexOf("brand") !== -1) +
            '<div class="span-2">' + fieldInput("desc", "Deskripsi", draft.desc, dirty.indexOf("desc") !== -1) + "</div>" +
            fieldInput("buyer", "Buyer", draft.buyer, dirty.indexOf("buyer") !== -1) +
            fieldInput("group", "Product group", draft.group, dirty.indexOf("group") !== -1) +
            fieldInput("color", "Warna / varian", draft.color, dirty.indexOf("color") !== -1) +
            fieldInput("week", "Minggu sumber", draft.week, dirty.indexOf("week") !== -1) +
          "</div>" +
        "</div>" +

        '<div class="insp-section">' +
          '<p class="insp-section__title">Status</p>' +
          '<div class="field-grid">' +
            fieldChoice("dev", "Development", draft.dev, B.DEV_STATES, dirty.indexOf("dev") !== -1) +
            fieldChoice("prod", "Produksi", draft.prod, B.PROD_STATES, dirty.indexOf("prod") !== -1) +
          "</div>" +
          '<div style="margin-top:12px">' +
            fieldChoice("sample", "Sample request", draft.sample, B.SAMPLE_STATES, dirty.indexOf("sample") !== -1,
              s.sampleEvidence ? "" : "Belum ada bukti request. Tandai legacy bila data historis.") +
          "</div>" +
        "</div>" +

        '<div class="insp-section">' +
          '<p class="insp-section__title">Penanggung jawab</p>' +
          '<div class="field-grid">' +
            fieldInput("pic.pattern", "PIC Pattern Maker", draft["pic.pattern"], dirty.indexOf("pic.pattern") !== -1) +
            fieldInput("pic.mdmkt", "Owner MD-MKT", draft["pic.mdmkt"], dirty.indexOf("pic.mdmkt") !== -1) +
            fieldInput("pic.ie", "PIC IE-Technical", draft["pic.ie"], dirty.indexOf("pic.ie") !== -1) +
            fieldInput("pic.prod", "PIC Production", draft["pic.prod"], dirty.indexOf("pic.prod") !== -1,
              draft["pic.prod"] ? "" : "Belum ditetapkan — alokasi ke Production tertahan.") +
            fieldInput("pic.qa", "PIC QA", draft["pic.qa"], dirty.indexOf("pic.qa") !== -1) +
          "</div>" +
          '<p class="field__note" style="margin-top:10px">Owner MD-MKT adalah field per style, bukan kolom matriks alokasi.</p>' +
        "</div>" +

        '<div class="insp-section">' +
          '<p class="insp-section__title">Catatan</p>' +
          '<div class="field' + (dirty.indexOf("notes") !== -1 ? " is-dirty" : "") + '">' +
            '<label for="f-notes">Catatan tindak lanjut</label>' +
            '<textarea id="f-notes" data-field="notes">' + K.esc(draft.notes) + "</textarea>" +
          "</div>" +
        "</div>" +

        '<div class="insp-section">' +
          '<p class="insp-section__title">Bukti dokumen</p>' +
          '<div class="row row--between">' +
            '<span class="mono strong">' + progress.ok + " / " + progress.total + " terverifikasi</span>" +
            '<a class="link link--quiet" href="#/style/' + K.esc(s.id) + '">Buka dokumen style</a>' +
          "</div>" +
          '<p class="hint" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:10px">' +
            B.DOC_CATS.map(dot).join("") + "</p>" +
          (missing.length ? '<p class="hint" style="margin-top:8px">Belum terverifikasi: ' + K.esc(missing.join(", ")) + "</p>" : "") +
        "</div>" +

        '<div class="insp-foot">' +
          '<span class="hint" data-role="dirty-count">' + (dirty.length || "Tidak ada") + " field berubah</span>" +
          '<div class="row">' +
            '<button type="button" class="btn" data-action="reset-draft"' + (dirty.length ? "" : " disabled") + ">Batalkan</button>" +
            '<button class="btn-primary" type="submit"' + (dirty.length ? "" : " disabled") + ">Simpan perubahan</button>" +
          "</div>" +
        "</div>" +
      "</form>";

    return (
      '<div class="page-head">' +
        "<div>" +
          '<h1 class="page-title">Database style</h1>' +
          '<p class="page-sub">Satu baris satu style. Pilih baris untuk mengedit di panel kanan tanpa kehilangan posisi pada daftar.</p>' +
        "</div>" +
        '<div class="page-actions">' +
          '<a class="btn" href="#/impor"><i class="ti ti-table-import"></i>Impor Excel</a>' +
          '<a class="btn" href="#/edit-sel"><i class="ti ti-columns"></i>Edit banyak style</a>' +
        "</div>" +
      "</div>" +
      filterBar('<div class="toolbar__right"><span class="mono hint">' + list.length + " dari " + B.get().styles.length + " style</span></div>") +
      '<div class="split">' +
        '<section class="panel">' +
          '<div class="table-wrap">' +
            '<table class="table">' +
              '<thead><tr><th style="width:24%">Style</th><th style="width:7%">Buyer</th><th style="width:15%">Development</th>' +
              '<th style="width:14%">Produksi</th><th style="width:16%">Sample request</th><th style="width:11%">PIC</th>' +
              '<th style="width:6%">Dok.</th><th style="width:7%">Ubah</th></tr></thead>' +
              "<tbody>" + rows + "</tbody>" +
            "</table>" +
          "</div>" +
          (list.length ? "" : '<div class="empty">Tidak ada style yang cocok dengan filter.</div>') +
          '<div class="table-foot"><span class="mono">' + list.length + ' style</span><span class="hint">Klik baris untuk mengedit</span></div>' +
        "</section>" +
        inspector +
      "</div>"
    );
  }

  K.views.database = view;
  K.filteredStyles = filteredStyles;
  K.draftFor = draftFor;
  K.dirtyKeys = dirtyKeys;
  K.filterBar = filterBar;
})();
