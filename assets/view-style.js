/* ==========================================================================
   BRA Running Style — style workspace (document register) and allocation
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const K = window.K;

  const TABS = [
    { id: "identitas", label: "Identitas" },
    { id: "dokumen", label: "Dokumen teknis" },
    { id: "sample", label: "Sample Request" },
    { id: "riwayat", label: "Riwayat publikasi" }
  ];

  function styleFromRoute(params) {
    const id = (params && params.id) || K.ui.uiStyleId;
    const s = B.styleById(id) || B.get().styles[0];
    K.ui.uiStyleId = s.id;
    return s;
  }

  function identityStrip(s) {
    return (
      '<div class="panel" style="margin-bottom:20px">' +
        '<div class="panel__body" style="display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap">' +
          '<div class="grow" style="min-width:260px">' +
            '<div class="row" style="gap:10px"><span class="mono strong" style="font-size:15px">' + K.esc(s.id) + "</span>" +
              '<span class="hint">' + K.esc(s.group) + "</span></div>" +
            '<div style="font-size:17px;font-weight:600;margin-top:4px">' + K.esc(s.desc) + "</div>" +
            '<div class="row" style="margin-top:10px;gap:14px">' +
              '<span class="hint">' + K.esc(s.brand) + " · " + K.esc(s.buyer) + "</span>" +
              '<span class="mono hint">' + K.esc(s.week) + "</span>" +
            "</div>" +
          "</div>" +
          '<div class="kv" style="flex:2;min-width:340px;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px 24px">' +
            '<div><div class="kv__label">Development</div><div class="kv__value">' + K.stateDot(s.dev, K.toneOfDev(s.dev)) + "</div></div>" +
            '<div><div class="kv__label">Produksi</div><div class="kv__value">' + K.stateDot(s.prod, K.toneOfProd(s.prod)) + "</div></div>" +
            '<div><div class="kv__label">Sample request</div><div class="kv__value">' + K.stateDot(s.sample, K.toneOfSample(s.sample)) + "</div></div>" +
            '<div><div class="kv__label">PIC Pattern</div><div class="kv__value">' + K.esc(s.pic.pattern || "—") + "</div></div>" +
            '<div><div class="kv__label">Pemilik MD-MKT</div><div class="kv__value">' + K.esc(s.pic.mdmkt || "—") + "</div></div>" +
            '<div><div class="kv__label">Diperbarui</div><div class="kv__value mono">' + B.fmtDate(s.updatedAt) + "</div></div>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function tabBar() {
    return '<div class="tabs" role="tablist">' + TABS.map(function (tab) {
      return '<button class="tab' + (K.ui.tab === tab.id ? " is-active" : "") + '" data-action="tab" data-tab="' + tab.id + '" role="tab">' +
        K.esc(tab.label) + "</button>";
    }).join("") + "</div>";
  }

  function tabIdentitas(s) {
    const rows = [
      ["Style number", s.id],
      ["Brand / buyer", s.brand + " / " + s.buyer],
      ["Product group", s.group],
      ["Warna / varian", s.color],
      ["Minggu sumber", s.week],
      ["PIC IE-Technical", s.pic.ie || "—"],
      ["PIC Production", s.pic.prod || "Belum ditetapkan"],
      ["PIC QA", s.pic.qa || "Belum ditetapkan"]
    ];
    return (
      '<div class="panel" style="margin-top:16px"><div class="panel__body">' +
        '<div class="kv" style="grid-template-columns:repeat(4,minmax(0,1fr))">' +
          rows.map(function (row) {
            return '<div><div class="kv__label">' + K.esc(row[0]) + '</div><div class="kv__value">' + K.esc(row[1]) + "</div></div>";
          }).join("") +
        "</div>" +
        '<div class="divider" style="margin:18px 0"></div>' +
        '<p class="kv__label">Catatan</p>' +
        '<p class="hint" style="margin-top:6px">' + K.esc(s.notes || "Belum ada catatan untuk style ini.") + "</p>" +
      "</div>" +
      '<div class="panel__foot"><span>Perubahan identitas dilakukan di database style.</span>' +
        '<a class="btn" href="#/database">Edit di database</a>' +
      "</div></div>"
    );
  }

  function tabSample(s) {
    const requestId = s.id === "10345161" ? "VS-26018" : s.id + "-SR01";
    return (
      '<div class="panel" style="margin-top:20px">' +
        '<div class="panel__head"><div class="row"><h2 class="section-title">Sample request</h2>' +
          '<span class="section-note">' + K.esc(s.sample) + "</span></div>" +
          (s.sampleEvidence ? '<span class="chip chip--ok">Bukti terlampir</span>' : '<span class="chip chip--att">Belum ada bukti</span>') +
        "</div>" +
        '<div class="panel__body">' +
          '<div class="kv">' +
            '<div><div class="kv__label">Request ID</div><div class="kv__value mono">' + K.esc(s.id === "10345161" ? "VS-26018" : s.id + "-SR01") + "</div></div>" +
            '<div><div class="kv__label">Status</div><div class="kv__value">' + K.stateDot(s.sample, K.toneOfSample(s.sample)) + "</div></div>" +
            '<div><div class="kv__label">Sumber</div><div class="kv__value">Buyer / MD-MKT</div></div>' +
            '<div><div class="kv__label">Bukti</div><div class="kv__value">' + (s.sampleEvidence ? "Terlampir" : "Belum ada berkas") + "</div></div>" +
          "</div>" +
          '<p class="hint" style="margin-top:14px">Data historis tanpa bukti memakai status “Legacy — verifikasi diperlukan”; jangan membuat request baru hanya agar status terlihat lengkap.</p>' +
        "</div>" +
        '<div class="panel__foot"><span>Request ' + K.esc(requestId) + "</span>" +
          '<button class="btn" data-action="attach-evidence" data-style="' + K.esc(s.id) + '">' +
            '<i class="ti ti-upload"></i>Lampirkan bukti</button>' +
        "</div>" +
      "</div>"
    );
  }

  function tabRiwayat(s) {
    return (
      '<div class="panel" style="margin-top:20px">' +
        '<div class="panel__head"><h2 class="section-title">Riwayat publikasi</h2>' +
          '<a class="link link--quiet" href="#/blue-files/' + K.esc(s.id) + '">Kelola alokasi &amp; publikasi</a></div>' +
        '<div class="panel__body" style="display:grid;grid-template-columns:1fr 1fr;gap:28px">' +
          ["FRONT", "BACK"].map(function (side) {
            const list = (s.pubs[side] || []).slice().reverse();
            const published = B.latestPublished(s, side);
            return '<div>' +
              '<div class="row" style="gap:10px"><span class="strong" style="letter-spacing:.1em">' + side + "</span>" +
                (published ? K.stateDot("Terbit " + published.v, "ok") : K.stateDot("Belum pernah terbit", "block")) + "</div>" +
              '<ul class="stack stack--tight" style="margin-top:12px">' +
                (list.length ? list.map(function (p) {
                  return '<li class="row row--between" style="gap:10px;padding:8px 0;border-bottom:1px solid var(--hair-soft)">' +
                    '<span class="mono">' + K.esc(p.v) + "</span>" +
                    '<span class="hint grow">' + (p.status === "Terbit" ? "Diterbitkan " : "Draft ") + B.fmtDate(p.at) + " · " + K.esc(p.by) + "</span>" +
                    '<span class="hint mono">' + K.esc(p.file) + "</span>" +
                  "</li>";
                }).join("") : '<li class="hint">Belum ada versi publikasi.</li>') +
              "</ul>" +
            "</div>";
          }).join("") +
        "</div>" +
      "</div>"
    );
  }

  function tabDokumen(s) {
    const rows = B.DOC_CATS.map(function (cat) {
      const doc = B.docOf(s, cat);
      const latest = B.latestVersion(doc);
      const reviewed = B.reviewedVersion(doc);
      const state = K.docCellState(doc);
      const allocCodes = B.DEPTS.filter(function (dept) { return doc && doc.alloc[dept]; })
        .map(function (dept) { return K.DEPT_CODE[dept]; })
        .join(", ");
      return (
        '<tr class="is-clickable' + (K.ui.docCat === cat ? " is-selected" : "") + '" data-action="doc-select" data-cat="' + K.esc(cat) + '">' +
          '<td><div class="strong">' + K.esc(cat) + "</div>" +
            '<span class="cell-sub mono">' + (latest ? K.esc(latest.file) : "belum ada berkas") + "</span></td>" +
          '<td class="mono">' + (reviewed ? K.esc(reviewed.v) : "—") + "</td>" +
          "<td>" + K.stateDot(state.label, state.tone) + '<span class="cell-sub">' + K.esc(state.note) + "</span></td>" +
          '<td>' + (allocCodes ? '<span class="mono hint">' + K.esc(allocCodes) + "</span>" : '<span class="hint">belum dialokasikan</span>') + "</td>" +
          '<td class="hint">' + (latest ? B.fmtDate(latest.at) + " · " + K.esc(latest.by) : "—") + "</td>" +
        "</tr>"
      );
    }).join("");

    const doc = B.docOf(s, K.ui.docCat);
    const latest = B.latestVersion(doc);
    const reviewed = B.reviewedVersion(doc);
    const canVerify = B.can("verify");
    const history = doc ? doc.versions.slice().reverse() : [];

    const inspector =
      '<aside class="inspector">' +
        '<div class="inspector__head">' +
          '<div class="inspector__eyebrow"><span>Pemeriksa versi</span><span class="mono">' + B.DOC_CATS.length + " kategori</span></div>" +
          '<h2 class="inspector__title">' + K.esc(K.ui.docCat) + "</h2>" +
          '<p class="inspector__sub">' + (latest ? K.esc(latest.v) + " · " + K.esc(latest.status) : "Belum ada berkas") + "</p>" +
        "</div>" +
        '<div class="insp-section">' +
          (latest
            ? '<div class="row row--top" style="gap:10px"><i class="ti ti-file-description" style="font-size:18px;color:var(--ink-2)" aria-hidden="true"></i>' +
              '<div class="grow"><div class="mono strong" style="word-break:break-all">' + K.esc(latest.file) + "</div>" +
              '<div class="hint">' + K.esc(K.extLabel(latest.file)) + " · " + K.esc(latest.size) + " KB · diunggah " + K.esc(latest.by) + "</div></div></div>" +
              '<p class="hint" style="margin-top:10px">Pratinjau tidak tersedia untuk format ini pada demo. Metadata dan versi tetap tercatat.</p>'
            : '<p class="hint">Belum ada berkas untuk kategori ini. Unggah revisi atau tetapkan PIC agar tidak menggantung.</p>') +
        "</div>" +
        '<div class="insp-section">' +
          '<p class="insp-section__title">Status review</p>' +
          '<div class="row row--between"><span>' + K.stateDot(K.docCellState(doc).label, K.docCellState(doc).tone) + "</span>" +
            '<span class="hint">' + (reviewed ? "versi berlaku " + K.esc(reviewed.v) : "belum ada versi berlaku") + "</span></div>" +
          '<p class="hint" style="margin-top:8px">Revisi terbaru tidak otomatis menggantikan versi yang sudah terverifikasi.</p>' +
        "</div>" +
        '<div class="insp-section">' +
          '<p class="insp-section__title">Alokasi versi ini</p>' +
          '<ul class="stack stack--tight">' +
            B.DEPTS.map(function (dept) {
              const version = doc && doc.alloc[dept];
              return '<li class="row row--between"><span class="hint">' + K.esc(dept) + "</span>" +
                '<span class="mono">' + (version ? K.esc(version) : '<span class="hint">belum</span>') + "</span></li>";
            }).join("") +
          "</ul>" +
        "</div>" +
        '<div class="insp-section">' +
          '<div class="stack stack--tight">' +
            (latest
              ? '<button class="' + (canVerify ? "btn-primary" : "btn") + '" data-action="verify-doc" data-style="' + K.esc(s.id) + '" data-cat="' + K.esc(K.ui.docCat) + '" data-v="' + K.esc(latest.v) + '"' + (canVerify ? "" : " disabled") + ">Verifikasi " + K.esc(latest.v) + "</button>" +
                '<button class="btn" data-action="return-doc" data-style="' + K.esc(s.id) + '" data-cat="' + K.esc(K.ui.docCat) + '" data-v="' + K.esc(latest.v) + '"' + (canVerify ? "" : " disabled") + ">Kembalikan untuk revisi</button>"
              : "") +
            '<button class="btn" data-action="upload-doc" data-style="' + K.esc(s.id) + '" data-cat="' + K.esc(K.ui.docCat) + '"><i class="ti ti-upload"></i>Unggah revisi</button>' +
          "</div>" +
          (canVerify ? "" : '<p class="hint" style="margin-top:8px"><i class="ti ti-lock"></i> Verifikasi hanya untuk peran yang ditetapkan.</p>') +
        "</div>" +
        '<div class="insp-section">' +
          '<p class="insp-section__title">Riwayat versi</p>' +
          '<ul class="stack stack--tight">' +
            (history.length ? history.map(function (row) {
              return '<li class="row row--between"><span class="mono">' + K.esc(row.v) + "</span>" +
                '<span class="hint grow">' + B.fmtDate(row.at) + " · " + K.esc(row.by) + "</span>" +
                K.stateDot(row.status, row.status === "Terverifikasi" ? "ok" : row.status === "Perlu revisi" ? "block" : "att") + "</li>";
            }).join("") : '<li class="hint">Belum ada versi.</li>') +
          "</ul>" +
        "</div>" +
      "</aside>";

    return (
      '<div class="split" style="margin-top:20px">' +
        '<section class="panel"><div class="table-wrap"><table class="table">' +
          "<thead><tr><th style='width:26%'>Kategori &amp; berkas</th><th style='width:10%'>Revisi aktif</th>" +
          "<th style='width:24%'>Review</th><th style='width:20%'>Dialokasikan</th><th style='width:20%'>Perubahan terakhir</th></tr></thead>" +
          "<tbody>" + rows + "</tbody>" +
        "</table></div>" +
        '<div class="table-foot"><span class="hint">Revisi aktif adalah versi yang boleh dipakai departemen.</span>' +
          '<span class="mono">' + B.docProgress(s).ok + "/" + B.docProgress(s).total + " terverifikasi</span></div></section>" +
        inspector +
      "</div>"
    );
  }

  function viewStyle(params) {
    const s = styleFromRoute(params);
    let body = "";
    if (K.ui.tab === "identitas") body = tabIdentitas(s);
    else if (K.ui.tab === "sample") body = tabSample(s);
    else if (K.ui.tab === "riwayat") body = tabRiwayat(s);
    else body = tabDokumen(s);

    const progress = B.docProgress(s);
    return (
      '<div class="page-head">' +
        "<div>" +
          '<h1 class="page-title">' + K.esc(s.id) + "</h1>" +
          '<p class="page-sub">' + K.esc(s.desc) + " · " + K.esc(s.brand) + "</p>" +
        "</div>" +
        '<div class="page-actions">' +
          '<a class="btn" href="#/database"><i class="ti ti-arrow-left"></i>Kembali ke daftar</a>' +
          '<a class="btn" href="#/blue-files/' + K.esc(s.id) + '"><i class="ti ti-files"></i>Alokasi dokumen</a>' +
        "</div>" +
      "</div>" +
      identityStrip(s) +
      tabBar() +
      body +
      '<p class="hint" style="margin-top:18px">' + progress.ok + " dari " + progress.total +
        " kategori dokumen sudah terverifikasi untuk style ini.</p>"
    );
  }

  /* ------------------------------------------------------ allocation matrix */

  function viewBlueFiles(params) {
    const s = styleFromRoute(params);
    const canAllocate = B.can("allocate");
    const canPublish = B.can("publish");

    const rows = B.DOC_CATS.map(function (cat) {
      const doc = B.docOf(s, cat);
      const latest = B.latestVersion(doc);
      const reviewed = B.reviewedVersion(doc);
      const state = K.docCellState(doc);
      const cells = B.DEPTS.map(function (dept) {
        const version = doc && doc.alloc[dept];
        const label = version ? version : "—";
        const title = version ? dept + " memakai " + version : dept + ": belum dialokasikan";
        return '<td><button class="alloc ' + (version ? "alloc--on" : "alloc--off") + '" title="' + K.esc(title) + '"' +
          ' aria-label="' + K.esc(title) + '" data-action="toggle-alloc" data-style="' + K.esc(s.id) + '" data-cat="' + K.esc(cat) + '" data-dept="' + K.esc(dept) + '"' +
          (canAllocate ? "" : " disabled") + ">" +
          (version ? '<span class="alloc__dot"></span>' + K.esc(label) : "—") + "</button></td>";
      }).join("");

      const newer = latest && reviewed && latest.v !== reviewed.v;
      return (
        "<tr>" +
          "<td><div class='row' style='gap:8px'><span class='strong'>" + K.esc(cat) + "</span>" +
            (state.tone === "ok" ? '<span class="chip chip--ok">Terverifikasi</span>' :
             state.tone === "block" ? '<span class="chip chip--block">' + K.esc(state.label) + "</span>" :
             '<span class="chip chip--att">' + K.esc(state.label) + "</span>") +
          "</div>" +
          '<span class="cell-sub">' + (latest ? "Diunggah " + B.fmtDate(latest.at) + " · " + K.esc(latest.by) : "Belum ada berkas") + "</span>" +
          (newer ? '<span class="cell-sub" style="color:var(--att)">' + K.esc(latest.v) + " diunggah, belum diverifikasi</span>" : "") +
          "</td>" +
          '<td class="mono">' + (reviewed ? K.esc(reviewed.v) : "—") + "</td>" +
          cells +
        "</tr>"
      );
    }).join("");

    const gaps = B.DOC_CATS.filter(function (cat) {
      const doc = B.docOf(s, cat);
      return B.docState(doc) === "verified" && B.DEPTS.every(function (dept) { return !doc.alloc[dept]; });
    });

    const meDoc = B.docOf(s, "Material Estimation");
    const meLatest = B.latestVersion(meDoc);
    const meReviewed = B.reviewedVersion(meDoc);
    const meStale = meLatest && meReviewed && meLatest.v !== meReviewed.v
      ? B.DEPTS.filter(function (dept) { return meDoc.alloc[dept] && meDoc.alloc[dept] !== meReviewed.v; })
      : [];

    return (
      '<div class="page-head">' +
        "<div>" +
          '<h1 class="page-title">Alokasi dokumen</h1>' +
          '<p class="page-sub">Satu register dokumen per style. Alokasi hanya menentukan departemen yang boleh memakai versi itu; verifikasi dan publikasi tetap terpisah.</p>' +
        "</div>" +
        '<div class="page-actions">' +
          '<select class="select" data-action="ui-style" aria-label="Pilih style">' +
            B.get().styles.map(function (row) {
              return '<option value="' + K.esc(row.id) + '"' + (row.id === s.id ? " selected" : "") + ">" + K.esc(row.id + " — " + row.brand) + "</option>";
            }).join("") +
          "</select>" +
          '<a class="btn" href="#/style/' + K.esc(s.id) + '"><i class="ti ti-file-description"></i>Dokumen style</a>' +
        "</div>" +
      "</div>" +

      '<div class="panel" style="margin-bottom:20px"><div class="panel__body" style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap">' +
        '<div class="row" style="gap:8px"><span class="hint">Pemilik MD-MKT</span><span class="strong">' + K.esc(s.pic.mdmkt || "Belum ditetapkan") + "</span></div>" +
        '<span class="hint">Diatur per style, bukan kolom matriks alokasi.</span>' +
      "</div></div>" +

      '<section class="panel">' +
        '<div class="panel__head">' +
          '<div class="row"><h2 class="section-title">Register dokumen teknis</h2>' +
            '<span class="section-note">' + B.DOC_CATS.length + " dokumen, alokasi per departemen</span></div>" +
          '<div class="row" style="gap:14px">' +
            '<span class="hint">• dialokasikan</span><span class="hint">— belum dialokasikan</span>' +
            (canAllocate ? "" : '<span class="chip"><i class="ti ti-lock"></i> hanya lihat</span>') +
          "</div>" +
        "</div>" +
        '<div class="table-wrap"><table class="matrix">' +
          "<thead><tr><th>Dokumen</th><th>Versi</th>" +
            B.DEPTS.map(function (dept) { return "<th>" + K.esc(dept) + "</th>"; }).join("") +
          "</tr></thead>" +
          "<tbody>" + rows + "</tbody>" +
          (meStale.length
            ? '<tbody><tr class="matrix-note"><td colspan="7">' + meStale.length + " departemen masih memakai " + K.esc(meReviewed.v) +
              "; " + K.esc(meLatest.v) + " sudah diunggah tetapi belum diverifikasi. " +
              '<button class="link link--lime" data-action="move-alloc" data-style="' + K.esc(s.id) + '" data-cat="Material Estimation">Alihkan alokasi ke ' + K.esc(meReviewed.v) + "</button></td></tr></tbody>"
            : "") +
        "</table></div>" +
        '<div class="panel__foot"><span>Target alokasi berlaku untuk versi terverifikasi terbaru.</span>' +
          '<a class="link link--quiet" href="#/style/' + K.esc(s.id) + '">Lihat riwayat versi</a></div>' +
      "</section>" +

      publishingPanel(s, canPublish) +

      '<section class="panel" style="margin-top:20px"><div class="panel__body" style="display:grid;grid-template-columns:1fr 1fr;gap:28px">' +
        "<div><div class='strong'>" + gaps.length + " dokumen belum dialokasikan ke departemen mana pun</div>" +
          '<p class="hint" style="margin-top:6px">' + (gaps.length ? K.esc(gaps.join(", ")) + " sudah terverifikasi tetapi belum dipakai departemen." : "Semua dokumen terverifikasi sudah punya alokasi.") + "</p></div>" +
        "<div><div class='strong'>" + B.DOC_CATS.filter(function (cat) {
          const doc = B.docOf(s, cat);
          return B.docState(doc) === "verified" && !doc.alloc.QA;
        }).length + " dokumen belum punya alokasi QA</div>" +
          '<p class="hint" style="margin-top:6px">Alokasi QA tidak otomatis mengikuti alokasi MD.</p></div>' +
      "</div></section>" +
      '<p class="hint" style="margin-top:16px">Teknis BOM yang diperbarui tidak otomatis mengganti berkas BACK yang berlaku.</p>'
    );
  }

  function publishingPanel(s, canPublish) {
    return '<section class="panel" style="margin-top:20px">' +
      '<div class="panel__head"><div class="row"><h2 class="section-title">Publikasi FRONT dan BACK</h2>' +
        '<span class="section-note">diterbitkan terpisah; draft tidak mengganti versi berlaku</span></div></div>' +
      '<div class="panel__body" style="display:grid;grid-template-columns:1fr 1fr;gap:28px">' +
        ["FRONT", "BACK"].map(function (side) {
          const published = B.latestPublished(s, side);
          const draft = B.latestDraft(s, side);
          const history = (s.pubs[side] || []).slice().reverse();
          return '<div>' +
            '<div class="row" style="gap:10px"><span class="strong" style="letter-spacing:.1em">' + side + "</span>" +
              (draft ? K.stateDot("Draft " + draft.v, "att") : published ? K.stateDot("Terbit " + published.v, "ok") : K.stateDot("Belum ada", "block")) +
            "</div>" +
            '<p class="hint" style="margin-top:10px">' +
              (s.pubs[side].length
                ? (draft ? "Draft " + draft.v + " · " + B.fmtDate(draft.at) + " · " + K.esc(draft.by) : "Versi berlaku " + published.v + ", diterbitkan " + B.fmtDate(published.at) + ".")
                : "Belum ada publikasi untuk sisi ini.") +
            "</p>" +
            (side === "BACK" && latestDraftBack(s)
              ? '<div class="alert alert--att" style="margin-top:10px"><i class="ti ti-alert-triangle" aria-hidden="true"></i>' +
                "<div>Periksa kesesuaian BACK sebelum menerbitkan draft ini.</div></div>"
              : "") +
            '<div class="row" style="margin-top:12px">' +
              (draft
                ? '<button class="btn" data-action="publish-side" data-style="' + K.esc(s.id) + '" data-side="' + side + '"' + (canPublish ? "" : " disabled") + ">Terbitkan " + side + " " + draft.v + "</button>"
                : '<button class="btn" data-action="draft-side" data-style="' + K.esc(s.id) + '" data-side="' + side + '"' + (canPublish ? "" : " disabled") + ">Siapkan draft " + side + "</button>") +
              (canPublish ? "" : '<span class="hint"><i class="ti ti-lock"></i> perlu peran MD/IE</span>') +
            "</div>" +
            '<ul class="stack stack--tight" style="margin-top:14px">' +
              (history.length ? history.map(function (p) {
                return '<li class="row row--between" style="border-top:1px solid var(--hair-soft);padding-top:6px">' +
                  '<span class="mono">' + K.esc(p.v) + "</span>" +
                  '<span class="hint grow">' + (p.status === "Terbit" ? "Diterbitkan " : "Draft ") + B.fmtDate(p.at) + "</span>" +
                  '<span class="hint">' + K.esc(p.by) + "</span></li>";
              }).join("") : '<li class="hint">Belum ada riwayat.</li>') +
            "</ul>" +
          "</div>";
        }).join("") +
      "</div></section>";
  }

  function latestDraftBack(s) {
    return B.latestDraft(s, "BACK") !== null;
  }

  K.views.style = viewStyle;
  K.views["blue-files"] = viewBlueFiles;
})();
