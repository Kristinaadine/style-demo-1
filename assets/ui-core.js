/* ==========================================================================
   BRA Running Style — shared UI helpers, app shell, follow-up queue
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const K = (window.K = window.K || {});
  K.views = K.views || {};

  const PEOPLE = {
    admin: "D. Widayanto",
    md: "A. Wulandari",
    ie: "F. Ramadhan",
    pattern: "D. Prasetyo",
    production: "S. Halim",
    qa: "R. Santoso"
  };

  const DEPT_OF_ROLE = {
    admin: null,
    md: "MD",
    ie: "IE-Technical",
    pattern: "Pattern Maker",
    production: "Production",
    qa: "QA"
  };

  const DEPT_CODE = { MD: "MD", "Pattern Maker": "PAT", "IE-Technical": "IE", Production: "PRD", QA: "QA" };

  const FIELD_LABELS = {
    week: "Minggu",
    dev: "Development",
    prod: "Produksi",
    sample: "Sample request",
    mc: "MC rasio",
    "pic.pattern": "PIC Pattern",
    "pic.mdmkt": "Owner MD-MKT",
    "pic.ie": "PIC IE-Technical",
    "pic.prod": "PIC Production",
    "pic.qa": "PIC QA"
  };

  const ui = {
    queueScope: "mine",
    collapsed: {},
    issueKey: null,
    dbQuery: "",
    dbBuyer: "",
    dbWeek: "",
    dbDev: "",
    dbStyleId: "10345161",
    dbDraft: null,
    cells: {},
    importStep: 1,
    importSource: "VS 2026 — Running Style FRONT/BACK",
    importFile: "",
    importParsed: null,
    importRec: null,
    importDecisions: {},
    importBlankRule: "keep",
    importResult: null,
    tab: "dokumen",
    docCat: "HO",
    uiStyleId: "10345161",
    logFilter: "semua",
    logQuery: ""
  };

  /* ------------------------------------------------------------------ utils */

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function role() { return B.get().role; }
  function me() { return PEOPLE[role()]; }
  function roleLabel() { return B.roleInfo(role()).label; }

  function stateDot(label, tone) {
    return '<span class="state state--' + tone + '"><span class="state__dot"></span>' + esc(label) + "</span>";
  }

  function toneOfDev(value) {
    if (value === "Dev selesai") return "ok";
    if (value === "In Trial") return "att";
    if (value === "Ditahan" || value === "Dibatalkan") return "block";
    return "neu";
  }
  function toneOfProd(value) {
    if (value === "Pernah produksi" || value === "Produksi berjalan") return "ok";
    if (value === "Produksi ditahan") return "block";
    return "neu";
  }
  function toneOfSample(value) {
    if (value === "Selesai") return "ok";
    if (value === "Menunggu konfirmasi") return "att";
    if (value === "Dibatalkan") return "block";
    return "neu";
  }

  function flatValue(s, field) {
    if (field.indexOf("pic.") === 0) return s.pic[field.slice(4)] || "";
    if (field === "mc") return s.mc;
    return s[field] == null ? "" : s[field];
  }

  function styleValues(s) {
    return {
      desc: s.desc || "",
      brand: s.brand || "",
      buyer: s.buyer || "",
      group: s.group || "",
      color: s.color || "",
      week: s.week || "",
      dev: s.dev || "",
      prod: s.prod || "",
      sample: s.sample || "",
      mc: String(s.mc == null ? "" : s.mc),
      "pic.pattern": s.pic.pattern || "",
      "pic.mdmkt": s.pic.mdmkt || "",
      "pic.ie": s.pic.ie || "",
      "pic.prod": s.pic.prod || "",
      "pic.qa": s.pic.qa || "",
      notes: s.notes || ""
    };
  }

  function docCellState(doc) {
    const st = B.docState(doc);
    if (st === "missing") return { label: "Belum tersedia", tone: "block", note: "belum ada berkas" };
    const latest = B.latestVersion(doc);
    const reviewed = B.reviewedVersion(doc);
    if (st === "pending") {
      return {
        label: "Perlu review · " + latest.v,
        tone: "att",
        note: reviewed ? reviewed.v + " masih berlaku" : "belum ada versi terverifikasi"
      };
    }
    if (st === "revise") return { label: "Perlu revisi · " + latest.v, tone: "block", note: "dikembalikan ke pengunggah" };
    return { label: "Terverifikasi · " + reviewed.v, tone: "ok", note: B.fmtDate(reviewed.at) };
  }

  function extLabel(file) {
    const parts = String(file || "").split(".");
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "BERKAS";
  }

  function options(list, current, placeholder) {
    const head = placeholder ? '<option value="">' + esc(placeholder) + "</option>" : "";
    return head + list.map(function (value) {
      return '<option value="' + esc(value) + '"' + (value === current ? " selected" : "") + ">" + esc(value) + "</option>";
    }).join("");
  }

  /* ------------------------------------------------------------------ shell */

  const NAV = [
    {
      group: "Ruang kerja",
      items: [
        { id: "tindak-lanjut", label: "Tindak lanjut", icon: "ti-list-check" },
        { id: "database", label: "Database style", icon: "ti-table" },
        { id: "blue-files", label: "Blue Files", icon: "ti-files" },
        { id: "pemantauan", label: "Pemantauan", icon: "ti-activity" }
      ]
    },
    {
      group: "Data",
      items: [
        { id: "impor", label: "Impor Excel", icon: "ti-table-import" },
        { id: "log", label: "Log aktivitas", icon: "ti-history" }
      ]
    }
  ];

  const CRUMBS = {
    "tindak-lanjut": ["Tindak lanjut", "Antrean terbuka"],
    database: ["Database style", "Semua style"],
    "edit-sel": ["Database style", "Edit sel"],
    "blue-files": ["Blue Files", "Alokasi dokumen"],
    pemantauan: ["Pemantauan", "Kelengkapan dokumen"],
    impor: ["Impor Excel", "Berkas mingguan"],
    log: ["Log aktivitas", "Semua tindakan"],
    style: ["Database style", "Workspace style"]
  };

  function renderRail(route) {
    const openCount = B.buildIssues().length;
    const activeRoute = route === "style" || route === "edit-sel" ? "database" : route;

    const groups = NAV.map(function (group) {
      const items = group.items.map(function (item) {
        const active = activeRoute === item.id;
        const count = item.id === "tindak-lanjut" ? openCount : 0;
        return (
          '<a class="nav-item' + (active ? " is-active" : "") + '" href="#/' + item.id + '">' +
            '<i class="ti ' + item.icon + '" aria-hidden="true"></i>' +
            "<span>" + esc(item.label) + "</span>" +
            (count ? '<span class="nav-item__count">' + count + "</span>" : "") +
          "</a>"
        );
      }).join("");
      return '<div class="nav-group"><p class="nav-label">' + esc(group.group) + "</p>" + items + "</div>";
    }).join("");

    return (
      '<div class="brand">' +
        '<span class="brand__mark">BRA</span>' +
        '<span><span class="brand__name">RUNNING STYLE</span><span class="brand__sub">Database &amp; alokasi</span></span>' +
      "</div>" +
      groups +
      '<div class="rail-foot">' +
        "<strong>PT Busanaremaja Agracipta</strong>" +
        "Masuk sebagai " + esc(B.roleInfo(role()).label) +
        '<button type="button" data-action="reset-demo">Kembalikan data contoh</button>' +
      "</div>"
    );
  }

  function renderTopbar(route, params) {
    const crumb = CRUMBS[route] || ["Running Style", ""];
    const second = route === "style" && params && params.id ? params.id : CRUMBS[route][1];
    const options = Object.keys(B.ROLES).map(function (key) {
      return '<option value="' + key + '"' + (key === role() ? " selected" : "") + ">" + esc(B.ROLES[key].label) + "</option>";
    }).join("");

    return (
      '<button class="btn nav-toggle" data-action="toggle-nav" aria-label="Buka navigasi"><i class="ti ti-menu"></i></button>' +
      '<div class="crumb">' +
        '<span class="crumb__current">' + esc(crumb[0]) + "</span>" +
        '<span class="crumb__sep">/</span>' +
        '<span class="crumb__last truncate">' + esc(crumb[1] === "Semua style" ? selectedStyleLabel() : crumb[1]) + "</span>" +
      "</div>" +
      '<div class="top-actions">' +
        '<div class="role">' +
          '<span class="hint nowrap">Peran</span>' +
          '<select class="select" data-action="role" aria-label="Peran pengguna">' + options + "</select>" +
        "</div>" +
      "</div>"
    );
  }

  function navTitleFor(route) {
    return (CRUMBS[route] || ["Running Style"])[0];
  }

  function navLabel(route) {
    if (route === "style") return "Workspace";
    return (CRUMBS[route] || ["", ""])[1];
  }

  function navTitle(route, params) {
    if (route === "style" && params && params.id) return params.id;
    return navTitleFor(route);
  }

  function navCrumb(route, params) {
    if (route === "style" && params && params.id) return params.id;
    return navLabel(route);
  }

  window.__unusedPlaceholder = navTitle;
  window.__unusedPlaceholder2 = navCrumb;

  /* --------------------------------------------------------------- queue view */

  function queueIssues() {
    const all = B.buildIssues();
    if (ui.queueScope === "none") return all.filter(function (i) { return !i.owner; });
    if (ui.queueScope === "mine") {
      const name = me();
      const dept = DEPT_OF_ROLE[role()];
      return all.filter(function (i) {
        return i.owner === name || (dept && i.dept === dept);
      });
    }
    const dept = DEPT_OF_ROLE[role()];
    return dept ? all.filter(function (i) { return i.dept === dept; }) : all;
  }

  function actionAttrs(issue) {
    const base = 'data-style="' + esc(issue.styleId) + '"';
    switch (issue.kind) {
      case "doc-pending":
        return 'data-action="verify-doc" ' + base + ' data-cat="' + esc(issue.cat) + '" data-v="' + esc(issue.version) + '"';
      case "doc-missing":
      case "doc-revise":
        return 'data-action="upload-doc" ' + base + ' data-cat="' + esc(issue.cat) + '"';
      case "pub-draft":
        return 'data-action="publish-side" ' + base + ' data-side="' + esc(issue.side) + '"';
      case "pic-missing":
        return 'data-action="assign-pic" ' + base + ' data-dept="' + esc(issue.deptTarget) + '"';
      case "sample-no-evidence":
        return 'data-action="attach-evidence" ' + base;
      default:
        return 'data-action="allocate" ' + base + ' data-cat="' + esc(issue.cat) + '" data-dept="' + esc(issue.deptTarget) + '"';
    }
  }

  function capForKind(kind) {
    if (kind === "doc-pending") return "verify";
    if (kind === "pub-draft") return "publish";
    if (kind === "alloc-gap") return "allocate";
    return "upload";
  }

  function consequenceText(issue) {
    switch (issue.kind) {
      case "doc-pending":
        return "Jika diverifikasi, " + issue.cat + " " + issue.version + " terbuka untuk dialokasikan ke departemen lain. Verifikasi tidak menerbitkan FRONT atau BACK.";
      case "doc-missing":
        return issue.cat + " belum punya berkas. Unggah berkas atau tetapkan PIC " + issue.dept + " agar dokumen ini tidak menggantung.";
      case "doc-revise":
        return "Berkas ini dikembalikan ke pengunggah. Revisi berikutnya menjadi versi baru; berkas lama tetap tersimpan.";
      case "pub-draft":
        return "Menerbitkan " + issue.side + " " + issue.objectSub + " membuat versi ini berlaku. Versi terbit sebelumnya tetap ada pada riwayat.";
      case "pic-missing":
        return "Tanpa PIC " + issue.deptTarget + ", alokasi dokumen ke departemen itu tidak bisa ditetapkan.";
      case "sample-no-evidence":
        return "Sample request perlu bukti berkas, atau ditandai “Legacy — verifikasi diperlukan” bila memang data historis.";
      default:
        return "Alokasi hanya menentukan departemen yang boleh memakai versi ini; status verifikasi tetap terpisah.";
    }
  }

  function viewQueue() {
    const issues = queueIssues();
    const all = B.buildIssues();
    const styleCount = new Set(issues.map(function (i) { return i.styleId; })).size;
    const withoutPic = all.filter(function (i) { return !i.owner; }).length;

    if (!issues.length) {
      ui.issueKey = null;
    } else if (!issues.some(function (i) { return i.key === ui.issueKey; })) {
      ui.issueKey = issues[0].key;
    }
    const selected = issues.filter(function (i) { return i.key === ui.issueKey; })[0] || null;

    const groups = new Map();
    issues.forEach(function (issue) {
      if (!groups.has(issue.styleId)) groups.set(issue.styleId, []);
      groups.get(issue.styleId).push(issue);
    });

    let rows = "";
    groups.forEach(function (list, styleId) {
      const s = B.styleById(styleId);
      const collapsed = !!ui.collapsed[styleId];
      rows +=
        '<tr class="issue-group">' +
          '<td colspan="5">' +
            '<div class="queue-group-inner">' +
              '<button class="queue-toggle' + (collapsed ? " is-collapsed" : "") + '" data-action="toggle-group" data-style="' + esc(styleId) + '">' +
                '<i class="ti ti-chevron-down" aria-hidden="true"></i>' +
                '<span class="mono strong">' + esc(styleId) + "</span>" +
                '<span class="strong">' + esc(s ? s.brand : "") + "</span>" +
              "</button>" +
              '<span class="muted truncate">' + esc(s ? s.group + " · " + s.desc : "") + "</span>" +
              '<span class="mono hint" style="margin-left:auto">' + list.length + " masalah</span>" +
              '<a class="link link--quiet" href="#/style/' + esc(styleId) + '">Buka style</a>' +
            "</div>" +
          "</td>" +
        "</tr>";

      if (collapsed) return;

      list.forEach(function (issue) {
        const isSel = issue.key === ui.issueKey;
        rows +=
          '<tr class="queue-row' + (isSel ? " is-selected" : "") + '" data-action="select-issue" data-key="' + esc(issue.key) + '">' +
            "<td>" +
              '<div class="strong">' + esc(issue.title) + "</div>" +
              '<div class="cell-sub">' + stateDot(issue.status, issue.tone) + "</div>" +
            "</td>" +
            "<td><div>" + esc(issue.object) + '</div><div class="cell-sub mono">' + esc(issue.objectSub) + "</div></td>" +
            "<td><div>" + esc(issue.owner || "Belum ditetapkan") + '</div><div class="cell-sub">' + esc(issue.dept) + "</div></td>" +
            '<td><div class="mono">' + esc(issue.evidence) + '</div><div class="cell-sub">' + esc(issue.evidenceSub) + "</div></td>" +
            "<td>" +
              '<button class="link link--quiet" ' + actionAttrs(issue) + ">" + esc(issue.action) + "</button>" +
              '<div class="hint">' + esc(issue.actionNote) + "</div>" +
            "</td>" +
          "</tr>";
      });
    });

    const queuePanel =
      '<section class="panel">' +
        '<div class="panel__head">' +
          '<div class="row"><h2 class="section-title">Antrean tindak lanjut</h2><span class="section-note">dikelompokkan per style</span></div>' +
          '<span class="mono hint">' + issues.length + " item · " + styleCount + " style</span>" +
        "</div>" +
        '<div class="table-wrap">' +
          '<table class="table">' +
            "<thead><tr>" +
              '<th style="width:25%">Masalah</th>' +
              '<th style="width:19%">Objek</th>' +
              '<th style="width:17%">PIC / Departemen</th>' +
              '<th style="width:19%">Bukti terkini</th>' +
              '<th style="width:20%">Tindakan berikutnya</th>' +
            "</tr></thead>" +
            "<tbody>" + rows + "</tbody>" +
          "</table>" +
        "</div>" +
        '<div class="table-foot">' +
          '<span class="mono">Menampilkan ' + issues.length + " item pada cakupan ini</span>" +
          '<a class="link link--quiet" href="#/pemantauan">Lihat kelengkapan dokumen</a>' +
        "</div>" +
      "</section>";

    return (
      '<div class="page-head">' +
        "<div>" +
          '<h1 class="page-title">Tindak lanjut</h1>' +
          '<p class="page-sub">Antrean ini hanya berisi yang belum selesai: dokumen belum tersedia, verifikasi tertunda, alokasi kosong, dan publikasi yang masih draft.</p>' +
        "</div>" +
        '<div class="page-actions">' +
          '<a class="btn" href="#/pemantauan"><i class="ti ti-activity"></i>Pemantauan</a>' +
          '<a class="btn" href="#/impor"><i class="ti ti-table-import"></i>Impor Excel</a>' +
        "</div>" +
      "</div>" +
      '<div class="toolbar">' +
        '<div class="segmented" role="group" aria-label="Cakupan antrean">' +
          [["mine", "Tugas saya"], ["dept", "Departemen saya"], ["none", "Tanpa PIC"]].map(function (pair) {
            return '<button data-action="scope" data-scope="' + pair[0] + '"' + (ui.queueScope === pair[0] ? ' class="is-active"' : "") + ">" + pair[1] + "</button>";
          }).join("") +
        "</div>" +
        '<div class="toolbar__right"><span class="hint">' + issues.length + " item terbuka pada " + styleCount + " style · " + withoutPic + " item tanpa PIC</span></div>" +
      "</div>" +
      '<div class="split">' +
        queuePanel +
        resolutionPanel(selected) +
      "</div>" +
      monitoringPanel() +
      batchPanel()
    );
  }

  function resolutionPanel(issue) {
    if (!issue) {
      return '<aside class="inspector"><div class="insp-section">' +
        '<p class="insp-section__title">Tidak ada item pada cakupan ini</p>' +
        '<p class="hint">Cakupan “' + esc(ui.queueScope === "mine" ? "Tugas saya" : ui.queueScope === "dept" ? "Departemen saya" : "Tanpa PIC") +
        '” kosong untuk peran ' + esc(roleLabel()) + ". Pilih cakupan lain untuk melihat pekerjaan yang belum ditangani.</p>" +
        '<div class="stack stack--tight" style="margin-top:14px">' +
          '<button class="btn" data-action="scope" data-scope="dept">Lihat departemen saya</button>' +
          '<button class="btn" data-action="scope" data-scope="none">Lihat item tanpa PIC</button>' +
        "</div></div></aside>";
    }
    const s = B.styleById(issue.styleId);
    const doc = issue.cat ? B.docOf(s, issue.cat) : null;
    const latest = doc ? B.latestVersion(doc) : null;
    const allowed = B.can(capForKind(issue.kind));
    const history = B.get().activity.filter(function (a) { return a.ref === issue.styleId; }).slice(0, 3);

    const fileBlock = latest
      ? '<div class="row row--top" style="gap:10px;margin-bottom:14px">' +
          '<i class="ti ti-file-description" style="font-size:18px;color:var(--ink-2)" aria-hidden="true"></i>' +
          '<div class="grow"><div class="mono strong" style="word-break:break-all">' + esc(latest.file) + "</div>" +
          '<div class="hint">' + esc(extLabel(latest.file)) + " · " + esc(latest.size) + " KB</div></div>" +
        "</div>"
      : "";

    const metaRows = latest
      ? '<div class="kv">' +
          '<div><div class="kv__label">Kategori</div><div class="kv__value">' + esc(doc.cat) + "</div></div>" +
          '<div><div class="kv__label">Versi</div><div class="kv__value mono">' + esc(latest.v) + "</div></div>" +
          '<div><div class="kv__label">Diunggah</div><div class="kv__value mono">' + B.fmtDate(latest.at) + "</div></div>" +
          '<div><div class="kv__label">Oleh</div><div class="kv__value">' + esc(latest.by) + "</div></div>" +
        "</div>"
      : '<div class="kv">' +
          '<div><div class="kv__label">Objek</div><div class="kv__value">' + esc(issue.object) + "</div></div>" +
          '<div><div class="kv__label">Departemen</div><div class="kv__value">' + esc(issue.dept) + "</div></div>" +
        "</div>";

    const reviewerLine = latest && latest.reviewer
      ? "Reviewer: " + esc(latest.reviewer)
      : issue.owner
        ? "Penanggung jawab: " + esc(issue.owner) + " — " + esc(issue.dept)
        : "Belum ada penanggung jawab";

    const historyList = history.length
      ? history.map(function (a) {
          return '<li class="row row--top" style="gap:10px">' +
            '<span class="mono hint nowrap" style="width:92px;flex:none">' + B.fmtDate(a.at) + "</span>" +
            '<span class="grow"><span class="strong">' + esc(a.title) + "</span>" +
            '<span class="cell-sub">' + esc(a.detail) + "</span></span>" +
          "</li>";
        }).join("")
      : '<li class="hint">Belum ada riwayat untuk style ini.</li>';

    const tone = issue.tone === "block" ? "alert--block" : "alert--att";
    const actionButton = '<button class="' + (allowed ? "btn-primary" : "btn") + '" ' + actionAttrs(issue) + (allowed ? "" : " disabled") + ">" + esc(issue.action) + "</button>";

    return (
      '<aside class="inspector">' +
        '<div class="inspector__head">' +
          '<div class="inspector__eyebrow"><span class="mono">' + esc(s.id) + "</span><span>" + esc(s.brand) + "</span></div>" +
          '<h2 class="inspector__title">' + esc(issue.title) + "</h2>" +
          '<p class="inspector__sub">' + esc(s.desc) + " · " + esc(s.group) + "</p>" +
        "</div>" +
        '<div class="insp-section">' +
          '<p class="insp-section__title">Objek yang ditinjau</p>' +
          fileBlock + metaRows +
        "</div>" +
        '<div class="insp-section">' +
          '<div class="alert ' + tone + '">' +
            '<i class="ti ti-alert-triangle" aria-hidden="true"></i>' +
            "<div><div>" + stateDot(issue.status, issue.tone) + '</div><div class="hint" style="margin-top:3px">' + reviewerLine + "</div></div>" +
          "</div>" +
          '<p class="hint" style="margin-top:12px">' + esc(consequenceText(issue)) + "</p>" +
          '<div class="stack stack--tight" style="margin-top:14px">' + actionButton +
            '<a class="btn" href="#/style/' + esc(issue.styleId) + '">Buka workspace style</a>' +
          "</div>" +
          (allowed ? "" : '<p class="hint" style="margin-top:10px"><i class="ti ti-lock"></i> Peran ' + esc(roleLabel()) + " tidak punya izin untuk tindakan ini.</p>") +
        "</div>" +
        '<div class="insp-section">' +
          '<p class="insp-section__title">Riwayat pada style ini</p>' +
          '<ul class="stack stack--tight">' + historyList + "</ul>" +
        "</div>" +
        '<div class="insp-foot">' +
          '<div><div class="kv__label">Pemilik MD-MKT</div><div class="strong">' + esc(s.pic.mdmkt || "Belum ditetapkan") + "</div></div>" +
          '<span class="mono hint">' + esc(s.week) + "</span>" +
        "</div>" +
      "</aside>"
    );
  }

  function monitoringPanel() {
    const rows = B.completeness().map(function (row) {
      const pct = row.total ? Math.round((row.have / row.total) * 100) : 0;
      const gap = row.total - row.have;
      const tone = pct < 60 ? "block" : pct < 85 ? "att" : "";
      return (
        '<div class="ratio-row">' +
          '<div class="strong">' + esc(row.cat) + "</div>" +
          '<div class="mono hint">' + row.have + " / " + row.total + "</div>" +
          '<div class="meter ' + (tone ? "meter--" + tone : "") + '"><span style="width:' + pct + '%"></span></div>' +
          '<div class="hint" style="grid-column:1 / -1">' + gap + " style belum punya versi terverifikasi</div>" +
        "</div>"
      );
    }).join("");

    return (
      '<section class="panel" style="margin-top:20px">' +
        '<div class="panel__head">' +
          '<div class="row"><h2 class="section-title">Kelengkapan dokumen</h2><span class="section-note">dari ' + B.get().styles.length + " style aktif</span></div>" +
          '<a class="link link--quiet" href="#/pemantauan">Buka pemantauan</a>' +
        "</div>" +
        '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr))">' + rows + "</div>" +
        '<div class="panel__foot"><span>Angka menghitung versi yang sudah terverifikasi, bukan sekadar berkas yang diunggah.</span></div>' +
      "</section>"
    );
  }

  function batchPanel() {
    const items = B.get().activity.filter(function (a) {
      return a.type === "impor" || a.type === "alokasi" || a.type === "publikasi";
    }).slice(0, 3);

    const cards = items.map(function (a) {
      return (
        '<div style="padding:14px 18px;border-right:1px solid var(--hair-soft)">' +
          '<div class="row row--between row--top" style="gap:12px">' +
            '<div class="grow"><div class="strong">' + esc(a.title) + "</div>" +
            '<div class="cell-sub">' + esc(a.detail) + "</div>" +
            '<div class="hint" style="margin-top:6px">oleh ' + esc(a.actor) + "</div></div>" +
            '<span class="mono hint nowrap">' + B.fmtDate(a.at) + "</span>" +
          "</div>" +
        "</div>"
      );
    }).join("");

    return (
      '<section class="panel" style="margin-top:20px">' +
        '<div class="panel__head">' +
          '<div class="row"><h2 class="section-title">Aktivitas batch terakhir</h2><span class="section-note">perubahan yang menyentuh banyak style sekaligus</span></div>' +
          '<a class="link link--quiet" href="#/log">Log aktivitas</a>' +
        "</div>" +
        '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr))">' + (cards || '<div class="empty">Belum ada aktivitas batch.</div>') + "</div>" +
      "</section>"
    );
  }

  function selectedStyleLabel() {
    const s = B.styleById(ui.dbStyleId);
    return s ? ui.dbStyleId + " — " + s.brand : "Semua style";
  }

  /* ---------------------------------------------------------------- exports */

  K.ui = ui;
  K.esc = esc;
  K.role = role;
  K.me = me;
  K.roleLabel = roleLabel;
  K.stateDot = stateDot;
  K.toneOfDev = toneOfDev;
  K.toneOfProd = toneOfProd;
  K.toneOfSample = toneOfSample;
  K.flatValue = flatValue;
  K.styleValues = styleValues;
  K.docCellState = docCellState;
  K.extLabel = extLabel;
  K.options = options;
  K.PEOPLE = PEOPLE;
  K.DEPT_OF_ROLE = DEPT_OF_ROLE;
  K.DEPT_CODE = DEPT_CODE;
  K.FIELD_LABELS = FIELD_LABELS;
  K.renderRail = renderRail;
  K.renderTopbar = renderTopbar;
  K.navTitle = navTitle;
  K.navCrumb = navCrumb;
  K.views["tindak-lanjut"] = viewQueue;
})();
