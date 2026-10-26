/* ==========================================================================
   BRA Running Style — actions for import, monitoring and activity log
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const K = window.K;

  K.actions = K.actions || {};
  K.changes = K.changes || {};

  function refreshImport() {
    const parsed = K.ui.importParsed;
    if (!parsed || parsed.error) {
      K.ui.importRec = null;
      return;
    }
    parsed.blankRule = K.ui.importBlankRule;
    K.ui.importRec = B.reconcile(parsed);
  }

  function loadText(text, label) {
    const parsed = B.buildImport(text);
    if (parsed.error) {
      K.ui.importParsed = null;
      K.ui.importRec = null;
      K.toast(K.esc(parsed.error));
      K.render();
      return;
    }
    K.ui.importParsed = parsed;
    K.ui.importFile = label;
    K.ui.importDecisions = {};
    K.ui.importStep = 2;
    refreshImport();
    K.render();
    K.toast("Berkas <strong>" + K.esc(label) + "</strong> terbaca: " + parsed.totalRows + " baris, " +
      parsed.headers.length + " kolom. Validasi isi ada di langkah rekonsiliasi.");
  }

  K.changes["import-file"] = function (el) {
    const file = el.files && el.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () { loadText(String(reader.result), file.name); };
    reader.onerror = function () { K.toast("Berkas tidak dapat dibaca."); };
    reader.readAsText(file);
  };

  K.actions["import-sample"] = function () {
    loadText(B.importSampleCsv(), "contoh-running-style-wk43.csv");
  };

  K.changes["import-source"] = function (el) {
    K.ui.importSource = el.value;
    K.render();
  };

  K.changes["import-map"] = function (el) {
    K.ui.importParsed.mapping[Number(el.dataset.index)] = el.value;
    refreshImport();
    K.render();
  };

  K.changes["import-blank"] = function (el) {
    K.ui.importBlankRule = el.value;
    refreshImport();
    K.render();
  };

  K.changes["import-decision"] = function (el) {
    K.ui.importDecisions[el.dataset.row] = el.value;
    K.render();
  };

  K.actions["import-next"] = function () {
    if (K.ui.importStep === 2) refreshImport();
    K.ui.importStep = Math.min(4, K.ui.importStep + 1);
    K.render();
  };

  K.actions["import-back"] = function () {
    K.ui.importStep = Math.max(1, K.ui.importStep - 1);
    K.render();
  };

  K.actions["import-reset"] = function () {
    K.ui.importParsed = null;
    K.ui.importRec = null;
    K.ui.importDecisions = {};
    K.ui.importResult = null;
    K.ui.importStep = 1;
    K.ui.importFile = "";
    K.render();
  };

  K.actions["import-commit"] = function () {
    if (!B.can("import")) {
      K.toast("Peran ini tidak boleh mengimpor.");
      return;
    }
    if (!K.ui.importRec) return;
    const result = B.commitImport(K.ui.importParsed, K.ui.importRec, K.ui.importSource, K.ui.importFile);
    K.ui.importResult = result;
    K.ui.importStep = 4;
    K.render();
    K.toast("Impor <strong>" + K.esc(result.batch.id) + "</strong> selesai: " + result.created +
      " style baru, " + result.updatedFields + " field diperbarui, " + result.skipped + " baris dikecualikan.");
  };

  K.actions["log-filter"] = function (el) {
    K.ui.logFilter = el.dataset.type;
    K.render();
  };
})();
