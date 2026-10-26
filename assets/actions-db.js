/* ==========================================================================
   BRA Running Style — actions for database editing and cell editing
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const K = window.K;

  K.actions = K.actions || {};
  K.forms = K.forms || {};
  K.modalIntents = K.modalIntents || {};

  /* ------------------------------------------------------------ style switch */

  K.actions["select-style"] = function (el) {
    const id = el.dataset.id;
    if (id === K.ui.dbStyleId) return;

    const current = B.styleById(K.ui.dbStyleId);
    const dirty = current && K.dirtyKeys ? K.dirtyKeys(current) : [];
    if (dirty.length) {
      K.openModal({
        title: "Perubahan belum disimpan",
        sub: current.id + " · " + dirty.length + " field berubah",
        body: '<div class="alert alert--att"><i class="ti ti-alert-triangle" aria-hidden="true"></i>' +
          "<div>Membuka style lain akan membuang perubahan yang belum disimpan pada " + K.esc(current.id) + ".</div></div>",
        confirm: "Lepas & buka " + id,
        intent: { type: "discard-switch", id: id }
      });
      return;
    }
    K.ui.dbStyleId = id;
    K.ui.dbDraft = null;
    K.render();
  };

  K.modalIntents["discard-switch"] = function (intent) {
    K.ui.dbStyleId = intent.id;
    K.ui.dbDraft = null;
    K.closeModal();
    K.render();
    K.toast("Perubahan dibuang. Style " + K.esc(intent.id) + " dibuka.");
  };

  K.actions["reset-draft"] = function () {
    K.ui.dbDraft = null;
    K.render();
    K.toast("Perubahan pada panel dibatalkan.");
  };

  K.actions["clear-filters"] = function () {
    K.ui.dbQuery = "";
    K.ui.dbBuyer = "";
    K.ui.dbWeek = "";
    K.ui.dbDev = "";
    K.render();
  };

  /* ---------------------------------------------------------------- cell edit */

  K.actions["discard-cell"] = function (el) {
    delete K.ui.cells[el.dataset.cell];
    K.render();
  };

  K.actions["discard-cells"] = function () {
    K.ui.cells = {};
    K.render();
    K.toast("Semua perubahan sel dibatalkan.");
  };

  K.actions["save-cells"] = function () {
    const list = K.cellChanges();
    if (!list.length) return;
    if (!B.can("bulk")) {
      K.toast("Peran ini tidak boleh mengedit massal.");
      return;
    }
    const byStyle = {};
    list.forEach(function (change) {
      if (!byStyle[change.id]) byStyle[change.id] = { pic: {} };
      if (change.field.indexOf("pic.") === 0) {
        byStyle[change.id].pic[change.field.slice(4)] = change.after;
      } else if (change.field === "mc") {
        byStyle[change.id].mc = Number(change.after);
      } else {
        byStyle[change.id][change.field] = change.after;
      }
    });
    const ids = Object.keys(byStyle);
    ids.forEach(function (id) { B.updateStyle(id, byStyle[id]); });
    K.ui.cells = {};
    K.render();
    K.toast("<strong>" + list.length + "</strong> sel disimpan pada " + ids.length + " style.");
  };

  /* ------------------------------------------------------------------ export */

  K.actions["export-csv"] = function () {
    const rows = K.filteredStyles();
    const csv = B.exportCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bra-running-style-" + B.today() + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    K.toast(rows.length + " style diekspor ke CSV.");
  };

  /* -------------------------------------------------------------- style form */

  K.forms.style = function (form) {
    const id = form.dataset.id;
    const s = B.styleById(id);
    if (!s) return;
    const dirty = K.dirtyKeys(s);
    if (!dirty.length) return;

    const draft = K.ui.dbDraft.values;
    const patch = { pic: {} };

    dirty.forEach(function (key) {
      if (key.indexOf("pic.") === 0) {
        patch.pic[key.slice(4)] = draft[key];
      } else if (key === "mc") {
        patch.mc = Number(draft.mc) || s.mc;
      } else {
        patch[key] = draft[key];
      }
    });

    B.updateStyle(id, patch);
    K.ui.dbDraft = null;
    K.render();
    K.toast("Perubahan disimpan pada <strong>" + K.esc(id) + "</strong> · " + dirty.length + " field.");
  };
})();
