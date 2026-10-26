/* ==========================================================================
   BRA Running Style — actions for style workspace and allocation matrix
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const K = window.K;

  K.actions = K.actions || {};
  K.changes = K.changes || {};
  K.modalIntents = K.modalIntents || {};

  K.actions.tab = function (el) {
    K.ui.tab = el.dataset.tab;
    K.render();
  };

  K.actions["doc-select"] = function (el) {
    K.ui.docCat = el.dataset.cat;
    K.render();
  };

  K.changes["ui-style"] = function (el) {
    window.location.hash = "#/blue-files/" + el.value;
  };

  K.actions["toggle-alloc"] = function (el) {
    const styleId = el.dataset.style;
    const cat = el.dataset.cat;
    const dept = el.dataset.dept;
    const s = B.styleById(styleId);
    const doc = B.docOf(s, cat);
    if (!doc) return;

    if (doc.alloc[dept]) {
      B.deallocate(styleId, cat, dept);
      K.render();
      K.toast("Alokasi " + K.esc(cat) + " untuk " + K.esc(dept) + " dicabut.");
      return;
    }
    const result = B.allocate(styleId, cat, dept);
    K.render();
    K.toast(result.ok
      ? K.esc(cat + " " + result.version) + " dialokasikan ke <strong>" + K.esc(dept) + "</strong>."
      : K.esc(result.message));
  };

  K.actions["move-alloc"] = function (el) {
    const result = B.moveAllocation(el.dataset.style, el.dataset.cat);
    K.render();
    K.toast(result.ok
      ? "Alokasi dipindahkan ke " + K.esc(result.version) + " untuk " + K.esc(result.departments.join(", ")) + "."
      : K.esc(result.message));
  };

  K.actions["draft-side"] = function (el) {
    const row = B.createDraft(el.dataset.style, el.dataset.side);
    K.render();
    K.toast("Draft " + K.esc(el.dataset.side + " " + row.v) + " dibuat. Versi terbit tidak berubah.");
  };

  K.actions["return-doc"] = function (el) {
    const s = B.styleById(el.dataset.style);
    K.openModal({
      title: "Kembalikan untuk revisi",
      sub: s.id + " · " + el.dataset.cat + " " + el.dataset.v,
      body: '<div class="field"><label for="ret-note">Catatan revisi</label>' +
        '<textarea id="ret-note" placeholder="Apa yang harus diperbaiki?"></textarea></div>' +
        '<div class="alert alert--att"><i class="ti ti-alert-triangle" aria-hidden="true"></i>' +
        "<div>Berkas ini keluar dari antrean verifikasi. Unggahan berikutnya menjadi versi baru.</div></div>",
      confirm: "Kembalikan",
      intent: { type: "return", styleId: el.dataset.style, cat: el.dataset.cat, version: el.dataset.v }
    });
  };

  K.modalIntents["return"] = function (intent) {
    const note = document.getElementById("ret-note");
    B.returnDoc(intent.styleId, intent.cat, intent.version, note ? note.value : "");
    K.closeModal();
    K.render();
    K.toast(K.esc(intent.cat + " " + intent.version) + " dikembalikan untuk revisi.");
  };
})();
