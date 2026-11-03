/* ==========================================================================
   BRA Running Style — three-feature workspace shell and interactions
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const K = (window.K = window.K || {});
  const rail = document.getElementById("rail");
  const topbar = document.getElementById("topbar");
  const view = document.getElementById("view");
  const app = document.querySelector(".app");
  const toast = document.getElementById("toast");
  const NAV = [
    { id: "planner", label: "Planner", icon: "ti-calendar-week", title: "Planner mingguan" },
    { id: "data-master", label: "Data Master", icon: "ti-table", title: "Data Master" },
    { id: "daftar-style", label: "Daftar Style", icon: "ti-folders", title: "Daftar Style" }
  ];

  K.views = {};
  function addRequiredMarkers() {
    document.querySelectorAll("form").forEach(function (form) {
      form.querySelectorAll("[required]").forEach(function (control) {
        if (control.disabled) return;
        let labels = [];
        if (control.id) {
          labels = Array.from(form.querySelectorAll('label[for="' + CSS.escape(control.id) + '"]'));
        }
        if (!labels.length && control.closest("label")) labels = [control.closest("label")];
        if (!labels.length) {
          const field = control.closest(".field");
          if (field) labels = Array.from(field.querySelectorAll("label")).slice(0, 1);
        }
        labels.forEach(function (label) {
          if (label.querySelector(".required-mark")) return;
          const marker = document.createElement("span");
          marker.className = "required-mark";
          marker.textContent = "*";
          marker.setAttribute("aria-hidden", "true");
          marker.title = "Wajib diisi";
          label.appendChild(marker);
        });
      });
    });
  }

  addRequiredMarkers();
  const requiredMarkerObserver = new MutationObserver(function () {
    addRequiredMarkers();
  });
  requiredMarkerObserver.observe(document.body, { childList: true, subtree: true });

  K.ui = {
    masterFilters: {},
    masterFilterOpen: "",
    styleBuyer: "",
    styleSearch: "",
    styleFolder: "",
    folderStyleActive: "",
    styleStandardCategory: "",
    styleStandardType: ""
  };
  K.esc = function (value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  };
  K.formatDate = function (value) {
    if (!value) return "—";
    const date = new Date(value.length === 10 ? value + "T00:00:00" : value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  };
  K.formatBytes = function (bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };
  K.toast = function (message, type) {
    toast.innerHTML = '<span class="toast__message"></span><span class="toast__countdown" aria-label="Notifikasi akan tertutup dalam 4 detik">4</span>';
    toast.querySelector(".toast__message").textContent = message;
    toast.dataset.tone = type || "ok";
    toast.classList.add("is-open");
    toast.style.pointerEvents = "none";
    window.clearTimeout(K.toastTimer);
    window.clearInterval(K.toastCountdown);
    let remaining = 4;
    K.toastCountdown = window.setInterval(function () {
      remaining -= 1;
      const countdown = toast.querySelector(".toast__countdown");
      if (countdown) countdown.textContent = String(Math.max(remaining, 1));
      if (remaining <= 0) window.clearInterval(K.toastCountdown);
    }, 1000);
    K.toastTimer = window.setTimeout(function () {
      window.clearInterval(K.toastCountdown);
      toast.classList.remove("is-open");
    }, 4000);
  };

  K.confirm = function (message, confirmLabel, cancelLabel) {
    return new Promise(function (resolve) {
      const modal = document.getElementById("modal");
      modal.innerHTML = '<div class="modal confirm-modal"><div class="modal__head"><div><h2 class="modal__title">Konfirmasi</h2></div><button type="button" class="icon-btn" data-confirm-close aria-label="Tutup konfirmasi"><i class="ti ti-x"></i></button></div><div class="modal__body confirm-modal__body"><p></p><div class="confirm-modal__actions"><button type="button" class="btn" data-confirm-cancel>Tutup</button><button type="button" class="btn-primary" data-confirm-ok>Lanjutkan</button></div></div></div>';
      modal.querySelector("p").textContent = message;
      modal.querySelector("[data-confirm-cancel]").textContent = cancelLabel || "Batal";
      modal.querySelector("[data-confirm-ok]").textContent = confirmLabel || "Lanjutkan";
      modal.hidden = false;
      const finish = function (result) { modal.hidden = true; modal.innerHTML = ""; resolve(result); };
      modal.querySelector("[data-confirm-close]").addEventListener("click", function () { finish(false); });
      modal.querySelector("[data-confirm-cancel]").addEventListener("click", function () { finish(false); });
      modal.querySelector("[data-confirm-ok]").addEventListener("click", function () { finish(true); });
    });
  };

  function routeInfo() {
    const parts = (window.location.hash || "#/planner").replace(/^#\/?/, "").split("/");
    return { route: parts[0] || "planner", id: parts[1] ? decodeURIComponent(parts[1]) : null };
  }

  function render() {
    const info = routeInfo();
    if (!NAV.some(function (item) { return item.id === info.route; }) && !K.views[info.route]) {
      window.location.hash = "#/planner";
      return;
    }

    const active = info.route === "folder-style" ? "daftar-style" : info.route;
    rail.innerHTML =
      '<div class="brand"><img class="brand__mark" src="assets/bra-logo.png" alt="Logo BRA"><span>' +
        '<span class="brand__name">RUNNING STYLE</span>' +
        '<span class="brand__sub">Planner · Data · Berkas</span></span></div>' +
      '<div class="nav-group"><p class="nav-label">Menu utama</p>' +
        NAV.map(function (item) {
          return '<a class="nav-item' + (active === item.id ? " is-active" : "") +
            '" href="#/' + item.id + '">' +
            '<i class="ti ' + item.icon + '" aria-hidden="true"></i><span>' +
            K.esc(item.label) + "</span></a>";
        }).join("") +
      '</div><div class="rail-foot"><strong>Running Style</strong>Kelola update dan berkas style.</div>';

    const navItem = NAV.filter(function (item) {
      return item.id === (info.route === "folder-style" ? "daftar-style" : info.route);
    })[0] || { title: "Folder Style" };
    const isSubPage = !NAV.some(function (item) { return item.id === info.route; });
    const backButton = isSubPage
      ? '<button class="btn topbar-back-btn" onclick="window.history.back()" aria-label="Kembali ke halaman sebelumnya">' +
          '<i class="ti ti-arrow-left" aria-hidden="true"></i><span>Kembali</span>' +
        '</button>'
      : '';
    topbar.innerHTML =
      '<button class="btn nav-toggle" data-workspace-action="toggle-nav" aria-label="Buka navigasi">' +
        '<i class="ti ti-menu"></i></button>' +
      backButton +
      '<div class="crumb"><span class="crumb__current">' + K.esc(navItem.title) +
        "</span></div>";

    view.innerHTML = K.views[info.route](info);
    document.title = "BRA · " + navItem.title;
    app.classList.remove("is-nav-open");
  }

  K.render = render;
  K.routeInfo = routeInfo;

  function rerenderKeepingFocus(element) {
    const key = element.dataset.filter;
    const value = element.value;
    if (key.indexOf("masterFilter.") === 0) {
      K.ui.masterFilterOpen = key.slice("masterFilter.".length);
    }
    render();
    const replacement = document.querySelector('[data-filter="' + key + '"]');
    if (replacement) {
      replacement.focus();
      replacement.value = value;
      if (key.indexOf("masterFilter.") === 0) {
        replacement.closest(".master-column-filter").open = true;
      }
      if (replacement.setSelectionRange) replacement.setSelectionRange(value.length, value.length);
    }
  }

  let filterTimer;
  document.addEventListener("input", function (event) {
    const input = event.target.closest("[data-filter]");
    if (!input) return;
    if (input.dataset.filter.indexOf("masterFilter.") === 0) {
      K.ui.masterFilters[input.dataset.filter.slice("masterFilter.".length)] = input.value;
    } else {
      K.ui[input.dataset.filter] = input.value;
    }
    window.clearTimeout(filterTimer);
    filterTimer = window.setTimeout(function () { rerenderKeepingFocus(input); }, 160);
  });

  document.addEventListener("toggle", function (event) {
    if (event.target.matches(".master-column-filter")) {
      K.ui.masterFilterOpen = event.target.open ? event.target.dataset.masterColumnFilter : "";
    }
  }, true);

  document.addEventListener("change", async function (event) {
    const filterSelect = event.target.closest('select[data-filter^="masterFilter."]');
    if (filterSelect) {
      const key = filterSelect.dataset.filter.slice("masterFilter.".length);
      K.ui.masterFilters[key] = filterSelect.value;
      K.ui.masterFilterOpen = key;
      rerenderKeepingFocus(filterSelect);
      return;
    }

    const standardCategory = event.target.closest("[data-standard-category]");
    if (standardCategory) {
      const category = standardCategory.value;
      const typeSelect = document.getElementById("upload-standard-type");
      if (typeSelect) {
        typeSelect.innerHTML = '<option value="">Pilih kategori</option>' + (category ? B.STANDARDIZATION_CATEGORIES[category].map(function (type) {
          return '<option value="' + K.esc(type) + '">' + K.esc(type) + "</option>";
        }).join("") : "");
        typeSelect.disabled = !category;
        typeSelect.required = !!category;
      }
      return;
    }

    const filter = event.target.closest("[data-filter-select]");
    if (filter) {
      const key = filter.dataset.filterSelect;
      K.ui[key] = filter.value;
      if (key === "styleStandardCategory") K.ui.styleStandardType = "";
      render();
      return;
    }

    const nonMasterFilterSelect = event.target.closest('select[data-filter]:not([data-filter^="masterFilter."])');
    if (nonMasterFilterSelect) {
      K.ui[nonMasterFilterSelect.dataset.filter] = nonMasterFilterSelect.value;
      render();
      return;
    }

    const field = event.target.closest("[data-master-field]");
    if (field) {
      try {
        if (field.dataset.masterField === "id") {
          const newId = B.renameMasterStyle(field.dataset.styleId, field.value);
          field.dataset.styleId = newId;
          field.value = newId;
        } else {
          B.updateMaster(field.dataset.styleId, field.dataset.masterField, field.value);
          field.value = B.styleById(field.dataset.styleId)[field.dataset.masterField];
        }
        K.toast("Perubahan Data Master disimpan.");
      } catch (error) {
        K.toast(error.message, "error");
        render();
      }
    }
  });

  function clearFieldError(control) {
    control.classList.remove("is-invalid");
    control.removeAttribute("aria-invalid");
    control.removeAttribute("aria-describedby");
    const field = control.closest(".field") || control.parentElement;
    if (field) {
      field.classList.remove("is-invalid");
      const error = field.querySelector(".field__error");
      if (error) error.remove();
    }
  }

  function markFieldError(control, message) {
    if (!control) return;
    control.classList.add("is-invalid");
    const field = control.closest(".field") || control.parentElement;
    if (!field) return;
    field.classList.add("is-invalid");
    let error = field.querySelector(".field__error");
    if (!error) {
      error = document.createElement("p");
      error.className = "field__error";
      error.setAttribute("role", "alert");
      field.appendChild(error);
    }
    error.innerHTML = '<span class="field__error-text"></span><button type="button" class="field__error-close" aria-label="Tutup peringatan"><i class="ti ti-x"></i></button>';
    error.querySelector(".field__error-text").textContent = message || "Isian ini wajib diisi.";
    error.querySelector(".field__error-close").addEventListener("click", function () {
      clearFieldError(control);
    });
    if (control.id) {
      const errorId = control.id + "-error";
      error.id = errorId;
      control.setAttribute("aria-invalid", "true");
      control.setAttribute("aria-describedby", errorId);
    }
  }

  function validationMessage(control) {
    if (control.type === "file") return "Pilih file yang akan diunggah.";
    if (control.tagName === "SELECT") return "Silakan pilih salah satu opsi.";
    if (control.validity && control.validity.patternMismatch) return control.title || "Format isian tidak sesuai.";
    return "Field ini wajib diisi.";
  }

  document.addEventListener("invalid", function (event) {
    markFieldError(event.target, validationMessage(event.target));
    const submit = event.target.form && event.target.form.querySelector('[type="submit"]');
    if (submit && K.toast) K.toast("Lengkapi isian yang ditandai sebelum melanjutkan.", "error");
  }, true);

  document.addEventListener("input", function (event) {
    if (event.target.matches("input, select, textarea")) clearFieldError(event.target);
  }, true);

  document.addEventListener("change", function (event) {
    if (event.target.matches("input, select, textarea")) clearFieldError(event.target);
    if (event.target.matches("[data-style-index-file]")) {
      if (!event.target.files || !event.target.files.length) return;
      let form = event.target.closest("form[data-workspace-form]");
      if (!form) {
        form = document.createElement("form");
        form.dataset.workspaceForm = "import-style-index";
        form.appendChild(event.target);
        document.body.appendChild(form);
      }
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }

    if (event.target.matches("[data-master-import-file]")) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      (async function () {
        try {
          const parsed = await BRAImportEngine.readTableFile(file);
          if (!parsed.rows.length) throw new Error("File tidak memiliki baris data.");
          const previewHeaders = parsed.headers.slice(0, 8);
          const previewRows = parsed.rows.slice(0, 25);
          const previewHtml =
            '<div class="import-preview-modal">' +
              '<div class="modal__head"><div>' +
                '<h2 class="modal__title">Preview Import: ' + K.esc(file.name) + '</h2>' +
                '<p class="modal__sub">Sheet: ' + K.esc(parsed.sheetName) + ' · ' + parsed.rows.length + ' baris ditemukan</p>' +
              '</div><button type="button" class="icon-btn" data-import-preview-close aria-label="Tutup"><i class="ti ti-x"></i></button></div>' +
              '<div class="modal__body">' +
                '<div class="import-preview-note">Data lama dengan Article/Style yang sama akan diganti. Style baru akan ditambahkan.</div>' +
                '<div class="import-preview-table"><table class="table"><thead><tr>' +
                  previewHeaders.map(function (h) { return '<th>' + K.esc(h) + '</th>'; }).join('') +
                '</tr></thead><tbody>' +
                  previewRows.map(function (row) {
                    return '<tr>' + previewHeaders.map(function (h) { return '<td>' + K.esc(row[h]) + '</td>'; }).join('') + '</tr>';
                  }).join('') +
                '</tbody></table></div>' +
                '<div class="confirm-modal__actions">' +
                  '<button type="button" class="btn" data-import-preview-cancel>Batal</button>' +
                  '<button type="button" class="btn-primary" data-import-preview-ok>Simpan ke Data Master</button>' +
                '</div>' +
              '</div>' +
            '</div>';
          const confirmed = await new Promise(function (resolve) {
            const modal = document.getElementById("modal");
            modal.hidden = false;
            modal.innerHTML = previewHtml;
            modal.querySelector("[data-import-preview-close]").addEventListener("click", function () { modal.hidden = true; resolve(false); });
            modal.querySelector("[data-import-preview-cancel]").addEventListener("click", function () { modal.hidden = true; resolve(false); });
            modal.querySelector("[data-import-preview-ok]").addEventListener("click", function () { modal.hidden = true; resolve(true); });
          });
          if (!confirmed) return;
          let added = 0; let replaced = 0; let skipped = 0;
          const seen = {};
          parsed.rows.forEach(function (row) {
            const product = String(BRAImportEngine.getValue(row, ["article", "style", "product", "articleno"])).trim();
            if (!product) { skipped++; return; }
            const buyerText = String(BRAImportEngine.getValue(row, ["buyer"])).trim();
            const buyer = B.WORKSPACE_BUYERS.find(function (v) { return v.toLowerCase() === buyerText.toLowerCase(); });
            if (!buyer) { skipped++; return; }
            const groupText = String(BRAImportEngine.getValue(row, ["productgroup", "category", "group"])).trim();
            const productGroupMaster = B.WORKSPACE_PRODUCT_GROUPS.find(function (v) { return v.toLowerCase() === groupText.toLowerCase(); }) || "";
            try {
              const key = product.toLowerCase();
              const result = B.upsertMasterStyle({
                product: product, buyer: buyer,
                description: String(BRAImportEngine.getValue(row, ["name", "description", "namestyle", "desc"])).trim(),
                week: String(BRAImportEngine.getValue(row, ["week", "wk"])).trim(),
                opd: BRAImportEngine.formatDate(BRAImportEngine.getValue(row, ["opd"])),
                deliveryDate: BRAImportEngine.formatDate(BRAImportEngine.getValue(row, ["delivery", "deliverydate"])),
                productGroupMaster: productGroupMaster,
                nb: String(BRAImportEngine.getValue(row, ["nb", "bntype"])).trim().toUpperCase(),
                picMaster: String(BRAImportEngine.getValue(row, ["pic", "picmaster"])).trim(),
                smv: String(BRAImportEngine.getValue(row, ["smv"])).trim(),
                remark: String(BRAImportEngine.getValue(row, ["remark", "keterangan", "note"])).trim()
              });
              if (seen[key] || result.replaced) replaced++; else added++;
              seen[key] = true;
            } catch (e) { skipped++; }
          });
          B.recordIndexImport({ fileName: file.name, sheetName: parsed.sheetName, importedAt: new Date().toISOString(), added: added, replaced: replaced, skipped: skipped, rowCount: parsed.rows.length });
          K.toast("Import selesai: " + added + " ditambahkan, " + replaced + " diganti, " + skipped + " dilewati.");
          event.target.value = "";
          render();
        } catch (err) {
          K.toast(err.message, "error");
        }
      })();
    }
  }, true);

  document.addEventListener("submit", async function (event) {
    const form = event.target.closest("form[data-workspace-form]");
    if (!form) return;
    event.preventDefault();
    const requiredControls = Array.from(form.querySelectorAll("[required]"));
    const emptyControl = requiredControls.find(function (control) {
      if (control.disabled || !control.offsetParent) return false;
      if (control.type === "file") return !control.files || control.files.length === 0;
      return String(control.value == null ? "" : control.value).trim() === "";
    });
    if (emptyControl) {
      markFieldError(emptyControl, validationMessage(emptyControl));
      emptyControl.focus();
      if (K.toast) K.toast("Lengkapi semua isian wajib sebelum melanjutkan.", "error");
      return;
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      const firstInvalid = form.querySelector(":invalid");
      if (firstInvalid) {
        markFieldError(firstInvalid, validationMessage(firstInvalid));
        firstInvalid.focus();
      }
      if (K.toast) K.toast("Lengkapi semua isian wajib sebelum melanjutkan.", "error");
      return;
    }
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      const data = new FormData(form);
      if (form.dataset.workspaceForm === "planner") {
        const file = form.querySelector('input[type="file"]').files[0];
        const record = await B.addPlannerFile(data.get("week"), file);
        K.toast("File " + record.displayName + " berhasil disimpan.");
        render();
      } else if (form.dataset.workspaceForm === "style-file") {
        const file = form.querySelector('input[type="file"]').files[0];
        const styleId = data.get("styleId");
        const folderName = data.get("folder") || styleId;
        const existingFolders = B.foldersForStyle(styleId);
        if (existingFolders.indexOf(folderName) === -1) B.addStyleFolder(styleId, folderName);
        const categories = data.getAll("alsoFolder");
        categories.push(folderName);
        const record = await B.addStyleFile(styleId, categories, file, {
          category: data.get("standardCategory"),
          type: data.get("standardType")
        });
        K.ui.styleFolder = data.get("folder");
        K.toast("File " + record.name + " versi " + record.version + " berhasil disimpan.");
        render();
      } else if (form.dataset.workspaceForm === "add-style-folder") {
        B.addStyleFolder(data.get("styleId"), data.get("name"));
        K.ui.folderStyleActive = data.get("name").trim();
        K.toast("Folder baru berhasil dibuat.");
        render();
      } else if (form.dataset.workspaceForm === "style-folder-file") {
        const file = form.querySelector('input[type="file"]').files[0];
        const record = await B.addStyleFile(data.get("styleId"), [data.get("folder")], file, {});
        K.ui.folderStyleActive = data.get("folder");
        K.toast("File " + record.name + " berhasil diunggah ke folder.");
        render();
      } else if (form.dataset.workspaceForm === "add-folder") {
        B.addFolder(data.get("buyer"), data.get("name"));
        K.toast("Folder baru ditambahkan untuk buyer " + data.get("buyer") + ".");
        render();
      } else if (form.dataset.workspaceForm === "import-style-index") {
        const file = form.querySelector('input[type="file"]').files[0];
        const parsed = await BRAImportEngine.readTableFile(file);
        if (!parsed.rows.length) throw new Error("File index tidak memiliki baris data.");

        const preview = parsed.rows.slice(0, 10).map(function (row) {
          return String(BRAImportEngine.getValue(row, ["article", "style", "product"])).trim();
        }).filter(Boolean).join(", ");
        const previewHeaders = parsed.headers.slice(0, 8);
        const previewRows = parsed.rows.slice(0, 25);
        const previewHtml = '<div class="import-preview-modal"><div class="modal__head"><div><h2 class="modal__title">Preview Index</h2><p class="modal__sub">Worksheet: ' + K.esc(parsed.sheetName) + ' · ' + parsed.rows.length + ' baris ditemukan</p></div><button type="button" class="icon-btn" data-import-preview-close aria-label="Tutup preview"><i class="ti ti-x"></i></button></div><div class="modal__body"><div class="import-preview-note">Data lama dengan Article/Style yang sama akan diganti dengan data baru.</div><div class="import-preview-table"><table class="table"><thead><tr>' + previewHeaders.map(function (header) { return '<th>' + K.esc(header) + '</th>'; }).join('') + '</tr></thead><tbody>' + previewRows.map(function (row) { return '<tr>' + previewHeaders.map(function (header) { return '<td>' + K.esc(row[header]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div><div class="confirm-modal__actions"><button type="button" class="btn" data-import-preview-cancel>Batal</button><button type="button" class="btn-primary" data-import-preview-ok>Simpan Data</button></div></div></div>';
        const confirmed = await new Promise(function (resolve) {
          const modal = document.getElementById("modal");
          modal.hidden = false;
          modal.innerHTML = previewHtml;
          modal.querySelector("[data-import-preview-close]").addEventListener("click", function () { modal.hidden = true; resolve(false); });
          modal.querySelector("[data-import-preview-cancel]").addEventListener("click", function () { modal.hidden = true; resolve(false); });
          modal.querySelector("[data-import-preview-ok]").addEventListener("click", function () { modal.hidden = true; resolve(true); });
        });
        if (!confirmed) return;

        let added = 0;
        let replaced = 0;
        let skipped = 0;
        const seen = {};
        parsed.rows.forEach(function (row) {
          const product = String(BRAImportEngine.getValue(row, ["article", "style", "product"])).trim();
          if (!product) { skipped++; return; }
          const buyerText = String(BRAImportEngine.getValue(row, ["buyer"])).trim();
          const buyer = B.WORKSPACE_BUYERS.find(function (value) {
            return value.toLowerCase() === buyerText.toLowerCase();
          });
          if (!buyer) { skipped++; return; }
          const groupText = String(BRAImportEngine.getValue(row, ["productgroup", "category"])).trim();
          const productGroupMaster = B.WORKSPACE_PRODUCT_GROUPS.find(function (value) {
            return value.toLowerCase() === groupText.toLowerCase();
          }) || "";
          try {
            const key = product.toLowerCase();
            const result = B.upsertMasterStyle({
              product: product,
              buyer: buyer,
              description: String(BRAImportEngine.getValue(row, ["name", "description", "namestyle"])).trim(),
              week: String(BRAImportEngine.getValue(row, ["week", "wk"])).trim(),
              opd: BRAImportEngine.formatDate(BRAImportEngine.getValue(row, ["opd"])),
              deliveryDate: BRAImportEngine.formatDate(BRAImportEngine.getValue(row, ["delivery", "deliverydate"])),
              productGroupMaster: productGroupMaster,
              nb: String(BRAImportEngine.getValue(row, ["nb", "bntype"])).trim().toUpperCase(),
              picMaster: String(BRAImportEngine.getValue(row, ["pic", "picmaster"])).trim(),
              smv: String(BRAImportEngine.getValue(row, ["smv"])).trim(),
              remark: String(BRAImportEngine.getValue(row, ["remark", "keterangan", "note"])).trim()
            });
            if (seen[key] || result.replaced) replaced++;
            else added++;
            seen[key] = true;
          } catch (error) { skipped++; }
        });
        K.toast("Import selesai: " + added + " style ditambahkan, " + replaced + " style diganti, " + skipped + " baris dilewati.");
        B.recordIndexImport({ fileName: file.name, sheetName: parsed.sheetName, importedAt: new Date().toISOString(), added: added, replaced: replaced, skipped: skipped, rowCount: parsed.rows.length });
        form.querySelector('input[type="file"]').value = "";
        render();
      } else if (form.dataset.workspaceForm === "add-style") {
        const style = B.addMasterStyle({
          product: data.get("product"),
          buyer: data.get("buyer"),
          brand: data.get("brand"),
          description: data.get("description"),
          week: data.get("week"),
          opd: data.get("opd"),
          deliveryDate: data.get("deliveryDate"),
          productGroupMaster: data.get("productGroupMaster"),
          nb: data.get("nb"),
          picMaster: data.get("picMaster"),
          smv: data.get("smv"),
          remark: data.get("remark")
        });
        K.toast("Style " + style.id + " berhasil ditambahkan.");
        render();
      }
    } catch (error) {
      K.toast(error.message, "error");
    } finally {
      if (submit && document.body.contains(submit)) submit.disabled = false;
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    app.classList.remove("is-nav-open");
    const modal = document.getElementById("modal");
    if (!modal.hidden) {
      modal.hidden = true;
      modal.innerHTML = "";
      if (K.previewUrl) { URL.revokeObjectURL(K.previewUrl); K.previewUrl = null; }
    }
  });

  const navRail = document.getElementById("rail");
  let closeRailTimer = 0;

  function scheduleRailClose(delay) {
    window.clearTimeout(closeRailTimer);
    closeRailTimer = window.setTimeout(function () {
      if (app.classList.contains("is-nav-open") && window.matchMedia("(max-width: 900px)").matches) {
        app.classList.remove("is-nav-open");
      }
    }, delay || 120);
  }

  if (navRail) {
    navRail.addEventListener("pointerleave", function () {
      scheduleRailClose(180);
    });
    navRail.addEventListener("pointerenter", function () {
      window.clearTimeout(closeRailTimer);
    });
  }

  document.addEventListener("pointerdown", function (event) {
    if (!app.classList.contains("is-nav-open") || window.matchMedia("(min-width: 901px)").matches) return;
    if (navRail && navRail.contains(event.target)) return;
    if (event.target.closest("[data-workspace-action='toggle-nav']")) return;
    scheduleRailClose(0);
  });

  document.addEventListener("click", async function (event) {
    const closeToast = event.target.closest("[data-close-toast]");
    if (closeToast) {
      toast.classList.remove("is-open");
      toast.style.pointerEvents = "none";
      window.clearTimeout(K.toastTimer);
      return;
    }

    const closeStyleIndex = event.target.closest("[data-close-style-index]");
    if (closeStyleIndex) {
      const panel = closeStyleIndex.closest("details");
      if (panel) panel.open = false;
      return;
    }

    const styleIndexUpload = event.target.closest("[data-style-index-upload]");
    if (styleIndexUpload) {
      const input = document.querySelector("[data-style-index-file]");
      if (input) input.click();
      return;
    }

    // ---- Import file Planner ke Data Master ----
    const importPlannerBtn = event.target.closest("[data-import-planner-to-master]");
    if (importPlannerBtn) {
      const blobId = importPlannerBtn.dataset.blobId;
      const fileName = importPlannerBtn.dataset.fileName;
      const fileType = importPlannerBtn.dataset.fileType;
      try {
        importPlannerBtn.disabled = true;
        importPlannerBtn.textContent = "Membaca…";
        const blob = await B.getPreviewBlob(blobId, fileType);
        const file = new File([blob], fileName, { type: fileType });
        const parsed = await BRAImportEngine.readTableFile(file);
        if (!parsed.rows.length) throw new Error("File tidak memiliki baris data yang bisa dibaca.");

        const previewHeaders = parsed.headers.slice(0, 8);
        const previewRows = parsed.rows.slice(0, 25);
        const previewHtml =
          '<div class="import-preview-modal">' +
            '<div class="modal__head"><div>' +
              '<h2 class="modal__title">Preview Import: ' + K.esc(fileName) + '</h2>' +
              '<p class="modal__sub">Sheet: ' + K.esc(parsed.sheetName) + ' · ' + parsed.rows.length + ' baris ditemukan</p>' +
            '</div><button type="button" class="icon-btn" data-import-preview-close aria-label="Tutup"><i class="ti ti-x"></i></button></div>' +
            '<div class="modal__body">' +
              '<div class="import-preview-note">Data lama dengan Article/Style yang sama akan diganti. Style baru akan ditambahkan.</div>' +
              '<div class="import-preview-table"><table class="table"><thead><tr>' +
                previewHeaders.map(function (h) { return '<th>' + K.esc(h) + '</th>'; }).join('') +
              '</tr></thead><tbody>' +
                previewRows.map(function (row) {
                  return '<tr>' + previewHeaders.map(function (h) { return '<td>' + K.esc(row[h]) + '</td>'; }).join('') + '</tr>';
                }).join('') +
              '</tbody></table></div>' +
              '<div class="confirm-modal__actions">' +
                '<button type="button" class="btn" data-import-preview-cancel>Batal</button>' +
                '<button type="button" class="btn-primary" data-import-preview-ok>Simpan ke Data Master</button>' +
              '</div>' +
            '</div>' +
          '</div>';

        const confirmed = await new Promise(function (resolve) {
          const modal = document.getElementById("modal");
          modal.hidden = false;
          modal.innerHTML = previewHtml;
          modal.querySelector("[data-import-preview-close]").addEventListener("click", function () { modal.hidden = true; resolve(false); });
          modal.querySelector("[data-import-preview-cancel]").addEventListener("click", function () { modal.hidden = true; resolve(false); });
          modal.querySelector("[data-import-preview-ok]").addEventListener("click", function () { modal.hidden = true; resolve(true); });
        });
        if (!confirmed) return;

        let added = 0; let replaced = 0; let skipped = 0;
        const seen = {};
        parsed.rows.forEach(function (row) {
          const product = String(BRAImportEngine.getValue(row, ["article", "style", "product", "articleno", "styleno"])).trim();
          if (!product) { skipped++; return; }
          const buyerText = String(BRAImportEngine.getValue(row, ["buyer"])).trim();
          const buyer = B.WORKSPACE_BUYERS.find(function (v) { return v.toLowerCase() === buyerText.toLowerCase(); });
          if (!buyer) { skipped++; return; }
          const groupText = String(BRAImportEngine.getValue(row, ["productgroup", "category", "group"])).trim();
          const productGroupMaster = B.WORKSPACE_PRODUCT_GROUPS.find(function (v) { return v.toLowerCase() === groupText.toLowerCase(); }) || "";
          try {
            const key = product.toLowerCase();
            const result = B.upsertMasterStyle({
              product: product,
              buyer: buyer,
              description: String(BRAImportEngine.getValue(row, ["name", "description", "namestyle", "stylename", "desc"])).trim(),
              week: String(BRAImportEngine.getValue(row, ["week", "wk"])).trim(),
              opd: BRAImportEngine.formatDate(BRAImportEngine.getValue(row, ["opd"])),
              deliveryDate: BRAImportEngine.formatDate(BRAImportEngine.getValue(row, ["delivery", "deliverydate"])),
              productGroupMaster: productGroupMaster,
              nb: String(BRAImportEngine.getValue(row, ["nb", "bntype"])).trim().toUpperCase(),
              picMaster: String(BRAImportEngine.getValue(row, ["pic", "picmaster"])).trim(),
              smv: String(BRAImportEngine.getValue(row, ["smv"])).trim(),
              remark: String(BRAImportEngine.getValue(row, ["remark", "keterangan", "note"])).trim()
            });
            if (seen[key] || result.replaced) replaced++;
            else added++;
            seen[key] = true;
          } catch (e) { skipped++; }
        });
        B.recordIndexImport({ fileName: fileName, sheetName: parsed.sheetName, importedAt: new Date().toISOString(), added: added, replaced: replaced, skipped: skipped, rowCount: parsed.rows.length });
        K.toast("Import selesai: " + added + " style ditambahkan, " + replaced + " diganti, " + skipped + " dilewati. Buka Data Master untuk melihat hasilnya.");
        render();
      } catch (error) {
        K.toast(error.message, "error");
      } finally {
        if (document.body.contains(importPlannerBtn)) {
          importPlannerBtn.disabled = false;
          importPlannerBtn.innerHTML = '<i class="ti ti-database-import" aria-hidden="true"></i>Import ke Data Master';
        }
      }
      return;
    }

    // ---- Import Excel langsung di Data Master ----
    const masterImportBtn = event.target.closest("[data-master-import-excel]");
    if (masterImportBtn) {
      const input = document.querySelector("[data-master-import-file]");
      if (input) { input.value = ""; input.click(); }
      return;
    }

    // ---- Export Data Master ke Excel ----
    const exportExcelBtn = event.target.closest("[data-master-export-excel]");    if (exportExcelBtn) {
      try {
        const styles = B.get().styles;
        if (!styles.length) { K.toast("Belum ada data untuk diekspor.", "error"); return; }
        const XLSX = window.XLSX;
        const rows = styles.map(function (s) {
          return {
            "Article / Style": s.id,
            "Nama Style": s.desc || "",
            "Buyer": s.buyer || "",
            "Product Group": s.productGroupMaster || "",
            "NB/B": s.nb || "",
            "Week": s.week || "",
            "OPD": s.opd || "",
            "Delivery Date": s.deliveryDate || "",
            "PIC": s.picMaster || "",
            "SMV": s.smv || "",
            "Remark": s.remark || ""
          };
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Master");
        XLSX.writeFile(wb, "data-master-" + B.today() + ".xlsx");
        K.toast(styles.length + " style diekspor ke Excel.");
      } catch (error) {
        K.toast("Gagal export: " + error.message, "error");
      }
      return;
    }

    // ---- Reset semua data style ----
    const resetStylesBtn = event.target.closest("[data-master-reset-styles]");
    if (resetStylesBtn) {
      const count = B.get().styles.length;
      if (!count) { K.toast("Belum ada data style untuk direset.", "error"); return; }
      const confirmed = await K.confirm(
        "Hapus semua " + count + " data style dari Data Master? Folder dan file yang terkait juga akan dihapus. Aksi ini tidak bisa dibatalkan.",
        "Ya, Hapus Semua", "Batal"
      );
      if (!confirmed) return;
      try {
        const ids = B.get().styles.map(function (s) { return s.id; });
        for (const id of ids) {
          try { await B.deleteMasterStyle(id); } catch (e) { /* lewati jika sudah terhapus */ }
        }
        K.toast("Semua data style berhasil dihapus. Silakan import file baru.");
        render();
      } catch (error) {
        K.toast(error.message, "error");
      }
      return;
    }

    const addFileToggle = event.target.closest("[data-toggle-style-file-form]");
    if (addFileToggle) {
      const panel = addFileToggle.closest(".folder-content").querySelector("[data-style-file-panel]");
      if (panel) {
        const opening = panel.hidden;
        panel.hidden = !opening;
        addFileToggle.setAttribute("aria-expanded", opening ? "true" : "false");
        addFileToggle.innerHTML = opening
          ? '<i class="ti ti-x" aria-hidden="true"></i>Tutup Form'
          : '<i class="ti ti-plus" aria-hidden="true"></i>Tambah File';
        if (opening) {
          const firstControl = panel.querySelector("select, input[type='file']");
          if (firstControl) firstControl.focus();
        }
      }
      return;
    }

    const editStyleRow = event.target.closest("[data-edit-style-row]");
    if (editStyleRow) {
      const styleId = editStyleRow.dataset.editStyleRow;
      const row = editStyleRow.closest("tr");
      const controls = Array.from(row.querySelectorAll("[data-style-id][data-master-field]"));
      if (editStyleRow.dataset.mode !== "save") {
        controls.forEach(function (control) { control.disabled = false; });
        editStyleRow.dataset.mode = "save";
        editStyleRow.title = "Simpan";
        editStyleRow.innerHTML = '<i class="ti ti-device-floppy"></i><span class="sr-only">Simpan</span>'; 
        row.classList.add("master-row-is-editing");
        if (controls[0]) controls[0].focus();
      } else {
        try {
          controls.forEach(function (control) {
            B.updateMaster(styleId, control.dataset.masterField, control.value);
          });
          K.toast("Perubahan style " + styleId + " berhasil disimpan.");
          render();
        } catch (error) { K.toast(error.message, "error"); }
      }
      return;
    }

    const deleteStyleRow = event.target.closest("[data-delete-style-row]");
    if (deleteStyleRow) {
      const styleId = deleteStyleRow.dataset.deleteStyleRow;
      if (await K.confirm('Hapus style "' + styleId + '" beserta folder dan file yang terkait?', "Hapus", "Batal")) {
        try {
          await B.deleteMasterStyle(styleId);
          K.toast("Style " + styleId + " berhasil dihapus.");
          render();
        } catch (error) { K.toast(error.message, "error"); }
      }
      return;
    }

    const deletePlannerFileBtn = event.target.closest("[data-delete-planner-file]");
    if (deletePlannerFileBtn) {
      const blobId = deletePlannerFileBtn.dataset.blobId;
      const fileName = deletePlannerFileBtn.dataset.fileName;
      if (await K.confirm('Hapus file "' + fileName + '" dari Planner?', "Hapus", "Batal")) {
        try {
          await B.deletePlannerFile(blobId);
          K.toast('File "' + fileName + '" berhasil dihapus.');
          render();
        } catch (error) { K.toast(error.message, "error"); }
      }
      return;
    }

    const modal = document.getElementById("modal");
    if (!modal.hidden && event.target === modal) {
      modal.hidden = true;
      modal.innerHTML = "";
      if (K.previewUrl) { URL.revokeObjectURL(K.previewUrl); K.previewUrl = null; }
      return;
    }

    const toggle = event.target.closest("[data-workspace-action='toggle-nav']");
    if (toggle) {
      app.classList.toggle("is-nav-open");
      return;
    }

    const renameRootFolder = event.target.closest("[data-rename-style-folder-root]");
    if (renameRootFolder) {
      const styleId = renameRootFolder.dataset.styleId;
      const oldName = renameRootFolder.dataset.renameStyleFolderRoot;
      const newName = window.prompt("Nama baru folder style:", oldName);
      if (newName != null) {
        try {
          const renamed = B.renameStyleFolder(styleId, oldName, newName);
          K.toast("Nama folder style berhasil diubah menjadi " + renamed + ".");
          render();
        } catch (error) { K.toast(error.message, "error"); }
      }
      return;
    }

    const deleteRootFolder = event.target.closest("[data-delete-style-folder-root]");
    if (deleteRootFolder) {
      const styleId = deleteRootFolder.dataset.styleId;
      const folderName = deleteRootFolder.dataset.deleteStyleFolderRoot;
      if (await K.confirm('Hapus folder style "' + folderName + '"? File tetap tersimpan.', "Hapus", "Batal")) {
        try {
          B.deleteStyleFolder(styleId, folderName);
          K.toast("Folder style " + folderName + " berhasil dihapus.");
          render();
        } catch (error) { K.toast(error.message, "error"); }
      }
      return;
    }

    const renameFolder = event.target.closest("[data-rename-style-folder]");
    if (renameFolder) {
      const styleId = routeInfo().id;
      const oldName = renameFolder.dataset.renameStyleFolder;
      const newName = window.prompt("Nama baru folder:", oldName);
      if (newName != null) {
        try {
          const renamed = B.renameStyleFolder(styleId, oldName, newName);
          if (K.ui.folderStyleActive === oldName) K.ui.folderStyleActive = renamed;
          K.toast("Folder berhasil diganti nama menjadi " + renamed + ".");
          render();
        } catch (error) { K.toast(error.message, "error"); }
      }
      return;
    }

    const deleteFolder = event.target.closest("[data-delete-style-folder]");
    if (deleteFolder) {
      const styleId = routeInfo().id;
      const folderName = deleteFolder.dataset.deleteStyleFolder;
      if (await K.confirm('Hapus folder "' + folderName + '"? File akan tetap tersimpan.', "Hapus", "Batal")) {
        try {
          B.deleteStyleFolder(styleId, folderName);
          if (K.ui.folderStyleActive === folderName) K.ui.folderStyleActive = "";
          K.toast("Folder " + folderName + " berhasil dihapus.");
          render();
        } catch (error) { K.toast(error.message, "error"); }
      }
      return;
    }

    const styleFolder = event.target.closest("[data-style-folder]");
    if (styleFolder) {
      K.ui.folderStyleActive = styleFolder.dataset.styleFolder;
      render();
      return;
    }

    const styleRow = event.target.closest("[data-style-row]");
    if (styleRow && !event.target.closest("a")) {
      window.location.hash = "#/daftar-style/" + encodeURIComponent(styleRow.dataset.styleRow);
      return;
    }

    const openFolder = event.target.closest("[data-open-style-folder]");
    if (openFolder) {
      event.preventDefault();
      K.ui.styleFolder = openFolder.dataset.openStyleFolder;
      window.location.hash = "#/daftar-style/" + encodeURIComponent(openFolder.dataset.styleId);
      return;
    }

    const folder = event.target.closest("[data-folder]");
    if (folder) {
      K.ui.styleFolder = folder.dataset.folder;
      render();
      return;
    }

    const renameFile = event.target.closest("[data-rename-file]");
    if (renameFile) {
      const oldName = renameFile.dataset.fileName;
      const newName = window.prompt("Nama baru file:", oldName);
      if (newName != null) {
        try {
          if (renameFile.dataset.renameFile === "planner") {
            B.renamePlannerFile(renameFile.dataset.blobId, newName);
          } else {
            B.renameWorkspaceFile(renameFile.dataset.blobId, newName);
          }
          K.toast("Nama file berhasil diperbarui.");
          render();
        } catch (error) { K.toast(error.message, "error"); }
      }
      return;
    }

    const deleteFile = event.target.closest("[data-delete-file='style']");
    if (deleteFile) {
      const fileName = deleteFile.dataset.fileName;
      if (await K.confirm('Hapus file "' + fileName + '"? File dan metadata-nya akan dihapus permanen dari browser.', "Hapus", "Batal")) {
        try {
          await B.deleteWorkspaceFile(deleteFile.dataset.blobId);
          K.toast("File " + fileName + " berhasil dihapus.");
          render();
        } catch (error) { K.toast(error.message, "error"); }
      }
      return;
    }

    const closePreview = event.target.closest("[data-close-preview]");
    if (closePreview) {
      const modal = document.getElementById("modal");
      modal.hidden = true;
      modal.innerHTML = "";
      if (K.previewUrl) { URL.revokeObjectURL(K.previewUrl); K.previewUrl = null; }
      return;
    }

    const preview = event.target.closest("[data-preview-kind]");
    if (preview) {
      preview.disabled = true;
      const modal = document.getElementById("modal");
      const name = preview.dataset.fileName;
      const type = preview.dataset.fileType || "";
      const extension = name.split(".").pop().toLowerCase();
      try {
        const blob = await B.getPreviewBlob(preview.dataset.blobId, type);
        if (K.previewUrl) URL.revokeObjectURL(K.previewUrl);
        K.previewUrl = URL.createObjectURL(blob);
        let content = "";

        if (/^(pdf)$/i.test(extension) || type === "application/pdf") {
          content = '<iframe class="file-preview-frame" src="' + K.previewUrl + '#toolbar=1" title="Preview PDF"></iframe>';
        } else if (/^(png|jpe?g|gif|webp|bmp|svg)$/i.test(extension) || type.indexOf("image/") === 0) {
          content = '<div class="file-preview-image"><img src="' + K.previewUrl + '" alt="' + K.esc(name) + '"></div>';
        } else if (/^(txt|csv|json|xml|log|md)$/i.test(extension) || type.indexOf("text/") === 0) {
          const text = await blob.slice(0, 2 * 1024 * 1024).text();
          content = '<pre class="file-preview-text">' + K.esc(text) + '</pre>';
        } else if (/^(xlsx|xlsm)$/i.test(extension)) {
          if (!window.XLSX) throw new Error("Pustaka preview Excel belum tersedia.");
          if (blob.size > 1024 * 1024 * 1024) throw new Error("Ukuran file melebihi batas 1 GB per berkas.");
          content = '<div class="file-preview-loading"><i class="ti ti-loader-2"></i><span>Membaca worksheet Excel…</span></div>';
          modal.innerHTML = '<div class="modal file-preview-modal"><div class="modal__head file-preview-head"><div><h2 class="modal__title">' + K.esc(name) + '</h2><p class="modal__sub">Preview Excel</p></div><button type="button" class="icon-btn" data-close-preview aria-label="Tutup preview"><i class="ti ti-x"></i></button></div><div class="modal__body file-preview-body">' + content + '</div></div>';
          modal.hidden = false;
          const workbook = XLSX.read(await blob.arrayBuffer(), { type: "array", cellDates: true, sheetRows: 301, dense: true });
          const sheetNames = workbook.SheetNames || [];
          const sheetOptions = sheetNames.map(function (sheetName) { return '<option value="' + K.esc(sheetName) + '">' + K.esc(sheetName) + '</option>'; }).join("");
          const renderSheet = function (sheetName) {
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) return "";
            const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
            range.e.r = Math.min(range.e.r, 299);
            range.e.c = Math.min(range.e.c, 49);
            return XLSX.utils.sheet_to_html(sheet, { header: "", footer: "", editable: false, range: range });
          };
          const firstSheet = sheetNames[0] || "";
          modal.querySelector(".file-preview-body").innerHTML = '<div class="excel-preview-toolbar"><label>Worksheet</label><select data-excel-sheet>' + sheetOptions + '</select><span>Preview dibatasi 300 baris × 50 kolom</span></div><div class="excel-preview-table">' + renderSheet(firstSheet) + '</div>';
          modal.querySelector("[data-excel-sheet]").addEventListener("change", function () {
            modal.querySelector(".excel-preview-table").innerHTML = renderSheet(this.value);
          });
        } else {
          content = '<div class="file-preview-empty"><i class="ti ti-file"></i><strong>Preview belum tersedia untuk format ini.</strong><span>Gunakan tombol Unduh untuk membuka ' + K.esc(extension.toUpperCase()) + '.</span></div>';
        }

        if (!/^(xlsx|xlsm)$/i.test(extension)) {
          modal.innerHTML = '<div class="modal file-preview-modal"><div class="modal__head file-preview-head"><div><h2 class="modal__title">' + K.esc(name) + '</h2><p class="modal__sub">Preview file</p></div><button type="button" class="icon-btn" data-close-preview aria-label="Tutup preview"><i class="ti ti-x"></i></button></div><div class="modal__body file-preview-body">' + content + '</div></div>';
          modal.hidden = false;
        }
      } catch (error) {
        K.toast(error.message, "error");
        modal.hidden = true;
      } finally {
        preview.disabled = false;
      }
      return;
    }

    const download = event.target.closest("[data-download-kind]");
    if (download) {
      download.disabled = true;
      try {
        await B.downloadFile(download.dataset.blobId, download.dataset.fileName, download.dataset.fileType);
      } catch (error) {
        K.toast(error.message, "error");
      } finally {
        download.disabled = false;
      }
    }
  });

  window.addEventListener("hashchange", render);

  window.BOOT = function () {
    B.load();
    try {
      B.initWorkspace();
    } catch (error) {
      render();
      K.toast(error.message, "error");
      return;
    }
    if (!window.location.hash) window.location.hash = "#/planner";
    if (B.requestPersistentStorage) B.requestPersistentStorage();
    render();
  };
})();
