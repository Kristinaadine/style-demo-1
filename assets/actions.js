/* ==========================================================================
   BRA Running Style — delegated interactions (shell + follow-up queue)
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const K = window.K;

  const toastEl = document.getElementById("toast");
  const modalRoot = document.getElementById("modal");
  const appEl = document.querySelector(".app");

  let modalIntent = null;
  let toastTimer = null;
  let searchTimer = null;

  /* ----------------------------------------------------------- notifications */

  function toast(message) {
    toastEl.innerHTML = message;
    toastEl.classList.add("is-open");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-open");
    }, 4000);
  }

  /* ------------------------------------------------------------------ modal */

  function openModal(config) {
    modalIntent = config.intent || null;
    modalRoot.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true">' +
        '<form data-form="modal">' +
          '<div class="modal__head">' +
            '<h2 class="modal__title">' + K.esc(config.title) + "</h2>" +
            (config.sub ? '<p class="modal__sub">' + K.esc(config.sub) + "</p>" : "") +
          "</div>" +
          '<div class="modal__body">' + (config.body || "") + "</div>" +
          '<div class="modal__foot">' +
            '<button type="button" class="btn" data-action="close-modal">Batal</button>' +
            '<button type="submit" class="btn-primary">' + K.esc(config.confirm || "Lanjutkan") + "</button>" +
          "</div>" +
        "</form>" +
      "</div>";
    modalRoot.hidden = false;
    const first = modalRoot.querySelector("input, select, textarea");
    if (first) first.focus();
  }

  function closeModal() {
    modalRoot.hidden = true;
    modalRoot.innerHTML = "";
    modalIntent = null;
  }

  function modalValue(selector) {
    const field = modalRoot.querySelector(selector);
    return field ? field.value : "";
  }

  K.toast = toast;
  K.openModal = openModal;
  K.closeModal = closeModal;

  /* ------------------------------------------------------------------ forms */

  function fileField(label, note) {
    return (
      '<div class="field"><label for="up-file">' + K.esc(label) + "</label>" +
        '<input id="up-file" type="file">' +
        '<p class="field__note">' + K.esc(note) + "</p></div>"
    );
  }

  function noteField(label, placeholder) {
    return (
      '<div class="field"><label for="up-note">' + K.esc(label) + "</label>" +
        '<textarea id="up-note" placeholder="' + K.esc(placeholder) + '"></textarea></div>'
    );
  }

  /* ------------------------------------------------------------- actions */

  function openVerify(styleId, cat, version) {
    const s = B.styleById(styleId);
    const doc = B.docOf(s, cat);
    const row = doc.versions.filter(function (x) { return x.v === version; })[0];
    openModal({
      title: "Verifikasi " + cat + " " + version,
      sub: s.id + " · " + s.brand,
      body:
        '<div class="kv">' +
          '<div><div class="kv__label">Berkas</div><div class="kv__value mono" style="word-break:break-all">' + K.esc(row.file) + "</div></div>" +
          '<div><div class="kv__label">Diunggah</div><div class="kv__value">' + K.esc(row.by) + " · " + B.fmtDate(row.at) + "</div></div>" +
        "</div>" +
        noteField("Catatan verifikasi", "Contoh: ukuran sesuai, rasio sudah diperiksa.") +
        '<div class="alert"><i class="ti ti-info-circle" aria-hidden="true"></i>' +
          "<div>Setelah diverifikasi, versi ini bisa dialokasikan ke departemen lain. Publikasi FRONT/BACK tidak berubah oleh verifikasi.</div></div>",
      confirm: "Verifikasi " + version,
      intent: { type: "verify", styleId: styleId, cat: cat, version: version }
    });
  }

  function openUpload(styleId, cat) {
    const s = B.styleById(styleId);
    openModal({
      title: "Unggah " + cat,
      sub: s.id + " · " + s.brand,
      body:
        fileField("Berkas " + cat, "Demo ini mencatat nama, ukuran, dan pengunggah. Isi berkas tidak dikirim ke server.") +
        noteField("Catatan revisi", "Apa yang berubah pada revisi ini?") +
        '<div class="alert"><i class="ti ti-info-circle" aria-hidden="true"></i>' +
          "<div>Revisi baru masuk sebagai versi berikutnya dengan status menunggu verifikasi. Berkas sebelumnya tidak ditimpa.</div></div>",
      confirm: "Unggah revisi",
      intent: { type: "upload", styleId: styleId, cat: cat }
    });
  }

  function openPublish(styleId, side) {
    const s = B.styleById(styleId);
    const draft = B.latestDraft(s, side);
    if (!draft) {
      toast("Tidak ada draft " + side + " untuk diterbitkan.");
      return;
    }
    openModal({
      title: "Terbitkan " + side + " " + draft.v,
      sub: s.id + " · " + s.brand,
      body:
        '<div class="alert alert--att"><i class="ti ti-alert-triangle" aria-hidden="true"></i>' +
          "<div>Terbitkan <strong>" + K.esc(side + " " + draft.v) + "</strong> atas berkas <span class=\"mono\">" +
          K.esc(draft.file) + "</span> untuk " + K.esc(s.brand) + "?</div></div>" +
        '<p class="hint">Versi terbit sebelumnya tetap tersimpan pada riwayat publikasi.</p>',
      confirm: "Terbitkan " + draft.v,
      intent: { type: "publish", styleId: styleId, side: side }
    });
  }

  function openAssignPic(styleId, dept) {
    const s = B.styleById(styleId);
    const people = ["A. Wulandari", "D. Prasetyo", "F. Ramadhan", "M. Hidayat", "R. Santoso", "S. Halim", "N. Kusuma", "D. Widayanto"];
    openModal({
      title: "Tetapkan PIC " + dept,
      sub: s.id + " · " + s.brand,
      body:
        '<div class="field"><label for="up-pic">Nama PIC</label><select id="up-pic">' +
          people.map(function (p) { return '<option value="' + p + '">' + p + "</option>"; }).join("") +
        "</select></div>" +
        '<p class="hint">Tanpa PIC, alokasi dokumen ke ' + K.esc(dept) + " tidak bisa ditetapkan.</p>",
      confirm: "Tetapkan PIC",
      intent: { type: "assign-pic", styleId: styleId, dept: dept }
    });
  }

  function openEvidence(styleId) {
    const s = B.styleById(styleId);
    openModal({
      title: "Lampirkan bukti sample request",
      sub: s.id + " · " + s.brand,
      body:
        fileField("Bukti request", "Mis. email konfirmasi buyer atau formulir permintaan sampel.") +
        noteField("Catatan", "Nomor request, tanggal, dan catatan lain.") +
        '<div class="alert"><i class="ti ti-info-circle" aria-hidden="true"></i>' +
          "<div>Data historis tanpa bukti sebaiknya memakai status “Legacy — verifikasi diperlukan”, bukan request baru.</div></div>",
      confirm: "Lampirkan bukti",
      intent: { type: "evidence", styleId: styleId }
    });
  }

  function submitModal() {
    const intent = modalIntent;
    if (!intent) { closeModal(); return; }

    const custom = K.modalIntents && K.modalIntents[intent.type];
    if (typeof custom === "function") {
      custom(intent);
      return;
    }

    if (intent.type === "verify") {
      B.verifyDoc(intent.styleId, intent.cat, intent.version);
      closeModal();
      K.render();
      toast("<strong>" + K.esc(intent.cat + " " + intent.version) + "</strong> diverifikasi. Versi ini sekarang bisa dialokasikan.");
      return;
    }

    if (intent.type === "upload") {
      const input = modalRoot.querySelector("#up-file");
      const file = input && input.files ? input.files[0] : null;
      const note = modalValue("#up-note");
      if (!file) { toast("Pilih berkas terlebih dahulu."); return; }
      const ext = (input.files[0].name.split(".").pop() || "xlsx").toLowerCase();
      const size = Math.max(1, Math.round(input.files[0].size / 1024));
      const row = B.addRevision(intent.styleId, intent.cat, { by: K.me(), size: size, note: note, ext: ext });
      closeModal();
      K.render();
      toast("<strong>" + K.esc(intent.cat + " " + row.v) + "</strong> tercatat sebagai revisi baru dan menunggu verifikasi.");
      return;
    }

    if (intent.type === "publish") {
      const result = B.publish(intent.styleId, intent.side);
      closeModal();
      K.render();
      toast(result.ok
        ? "<strong>" + K.esc(intent.side + " " + result.version) + "</strong> diterbitkan. Versi sebelumnya tetap ada pada riwayat."
        : K.esc(result.message));
      return;
    }

    if (intent.type === "assign-pic") {
      const name = modalValue("#up-pic");
      const map = { MD: "mdmkt", "Pattern Maker": "pattern", "IE-Technical": "ie", Production: "prod", QA: "qa" };
      const patch = { pic: {} };
      patch.pic[map[intent.dept]] = name;
      B.updateStyle(intent.styleId, patch);
      closeModal();
      K.render();
      toast("PIC " + K.esc(intent.dept) + " ditetapkan: " + K.esc(name) + ".");
      return;
    }

    if (intent.type === "evidence") {
      const note = modalValue("#up-note");
      B.setSampleEvidence(intent.styleId, true, note);
      closeModal();
      K.render();
      toast("Bukti sample request dilampirkan.");
      return;
    }

    if (intent.type === "reset") {
      B.reset();
      closeModal();
      K.render();
      toast("Data contoh dimuat ulang.");
      return;
    }

    closeModal();
  }

  /* --------------------------------------------------------------- handlers */

  function handleAction(action, el) {
    if (K.actions && typeof K.actions[action] === "function") {
      K.actions[action](el);
      return;
    }
    switch (action) {
      case "toggle-nav":
        appEl.classList.toggle("is-nav-open");
        return;
      case "close-modal":
        closeModal();
        return;
      case "scope":
        K.ui.queueScope = el.dataset.scope;
        K.render();
        return;
      case "toggle-group":
        K.ui.collapsed[el.dataset.style] = !K.ui.collapsed[el.dataset.style];
        K.render();
        return;
      case "select-issue":
        K.ui.issueKey = el.dataset.key;
        K.render();
        return;
      case "verify-doc":
        openVerify(el.dataset.style, el.dataset.cat, el.dataset.v);
        return;
      case "upload-doc":
        openUpload(el.dataset.style, el.dataset.cat);
        return;
      case "publish-side":
        openPublish(el.dataset.style, el.dataset.side);
        return;
      case "assign-pic":
        openAssignPic(el.dataset.style, el.dataset.dept);
        return;
      case "attach-evidence":
        openEvidence(el.dataset.style);
        return;
      case "allocate": {
        const result = B.allocate(el.dataset.style, el.dataset.cat, el.dataset.dept);
        K.render();
        toast(result.ok
          ? K.esc(el.dataset.cat + " " + result.version) + " dialokasikan ke <strong>" + K.esc(el.dataset.dept) + "</strong>."
          : K.esc(result.message));
        return;
      }
      case "reset-demo":
        openModal({
          title: "Kembalikan data contoh?",
          sub: "Semua perubahan yang Anda buat di penyimpanan lokal akan hilang.",
          body: '<div class="alert alert--block"><i class="ti ti-alert-triangle" aria-hidden="true"></i><div>Data contoh awal dimuat ulang: 12 style, dokumen, dan riwayat demo.</div></div>',
          confirm: "Kembalikan",
          intent: { type: "reset" }
        });
        return;
      default:
        console.warn("Aksi belum ditangani:", action);
    }
  }

  document.addEventListener("click", function (event) {
    const el = event.target.closest("[data-action]");
    if (!el) return;
    event.preventDefault();
    handleAction(el.dataset.action, el);
  });

  function refreshDirty(scope) {
    const form = scope && scope.dataset && scope.dataset.id ? scope : scope.closest("form");
    if (!form || !form.dataset.id || !K.dirtyKeys) return;
    const s = B.styleById(form.dataset.id);
    if (!s) return;
    const dirty = K.dirtyKeys(s);
    form.querySelectorAll("[data-field]").forEach(function (input) {
      const wrap = input.closest(".field");
      if (wrap) wrap.classList.toggle("is-dirty", dirty.indexOf(input.dataset.field) !== -1);
    });
    const counter = form.querySelector('[data-role="dirty-count"]');
    if (counter) counter.textContent = (dirty.length ? dirty.length : "Tidak ada") + " field berubah";
    const save = form.querySelector('button[type="submit"]');
    const reset = form.querySelector('[data-action="reset-draft"]');
    if (save) save.disabled = dirty.length === 0;
    if (reset) reset.disabled = dirty.length === 0;
  }

  document.addEventListener("submit", function (event) {
    const form = event.target.closest("form");
    if (!form) return;
    event.preventDefault();
    const handler = K.forms && K.forms[form.dataset.form];
    if (typeof handler === "function") {
      handler(form);
      return;
    }
    if (form.dataset.form === "modal") submitModal();
  });

  document.addEventListener("input", function (event) {
    const field = event.target.closest("[data-field]");
    if (field) {
      if (K.ui.dbDraft) K.ui.dbDraft.values[field.dataset.field] = field.value;
      refreshDirty(field);
      return;
    }
    const filter = event.target.closest("[data-filter]");
    if (filter) {
      const key = filter.dataset.filter;
      K.ui[key] = filter.value;
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(function () {
        K.render();
        const again = document.querySelector('[data-filter="' + key + '"]');
        if (again) {
          again.focus();
          const end = again.value.length;
          again.setSelectionRange(end, end);
        }
      }, 240);
    }
  });

  document.addEventListener("change", function (event) {
    const actioned = event.target.closest("[data-action]");
    if (actioned && K.changes && typeof K.changes[actioned.dataset.action] === "function") {
      K.changes[actioned.dataset.action](actioned);
      return;
    }
    const roleSelect = event.target.closest('[data-action="role"]');
    if (roleSelect) {
      B.setRole(roleSelect.value);
      K.render();
      return;
    }
    const field = event.target.closest("[data-field]");
    if (field) {
      if (K.ui.dbDraft) K.ui.dbDraft.values[field.dataset.field] = field.value;
      refreshDirty(field);
      return;
    }
    const filter = event.target.closest("[data-filter]");
    if (filter && filter.dataset.filter !== "dbQuery") {
      K.ui[filter.dataset.filter] = filter.value;
      K.render();
      return;
    }
    const cell = event.target.closest("[data-cell]");
    if (cell) {
      K.ui.cells[cell.dataset.cell] = cell.value;
      K.render();
    }
  });

  K.actions = K.actions || {};
  K.forms = K.forms || {};
})();
