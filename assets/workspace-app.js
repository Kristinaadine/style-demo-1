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
  K.ui = {
    masterFilters: {},
    masterFilterOpen: "",
    styleBuyer: "",
    styleSearch: "",
    styleFolder: ""
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
    toast.textContent = message;
    toast.dataset.tone = type || "ok";
    toast.classList.add("is-open");
    window.clearTimeout(K.toastTimer);
    K.toastTimer = window.setTimeout(function () { toast.classList.remove("is-open"); }, 4500);
  };

  function routeInfo() {
    const parts = (window.location.hash || "#/planner").replace(/^#\/?/, "").split("/");
    return { route: parts[0] || "planner", id: parts[1] ? decodeURIComponent(parts[1]) : null };
  }

  function render() {
    const info = routeInfo();
    if (!NAV.some(function (item) { return item.id === info.route; })) {
      window.location.hash = "#/planner";
      return;
    }

    const active = info.route === "daftar-style" ? "daftar-style" : info.route;
    rail.innerHTML =
      '<div class="brand"><span class="brand__mark">BRA</span><span>' +
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

    const navItem = NAV.filter(function (item) { return item.id === info.route; })[0];
    topbar.innerHTML =
      '<button class="btn nav-toggle" data-workspace-action="toggle-nav" aria-label="Buka navigasi">' +
        '<i class="ti ti-menu"></i></button>' +
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
    const filter = event.target.closest("[data-filter-select]");
    if (filter) {
      K.ui[filter.dataset.filterSelect] = filter.value;
      render();
      return;
    }

    const field = event.target.closest("[data-master-field]");
    if (field) {
      try {
        B.updateMaster(field.dataset.styleId, field.dataset.masterField, field.value);
        field.value = B.styleById(field.dataset.styleId)[field.dataset.masterField];
        K.toast("Perubahan Data Master disimpan.");
      } catch (error) {
        K.toast(error.message, "error");
        render();
      }
    }
  });

  document.addEventListener("submit", async function (event) {
    const form = event.target.closest("form[data-workspace-form]");
    if (!form) return;
    event.preventDefault();
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
        const categories = data.getAll("alsoFolder");
        categories.push(data.get("folder"));
        const record = await B.addStyleFile(data.get("styleId"), categories, file);
        K.ui.styleFolder = data.get("folder");
        K.toast("File " + record.name + " versi " + record.version + " berhasil disimpan.");
        render();
      } else if (form.dataset.workspaceForm === "add-folder") {
        B.addFolder(data.get("buyer"), data.get("name"));
        K.toast("Folder baru ditambahkan untuk buyer " + data.get("buyer") + ".");
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

  document.addEventListener("click", async function (event) {
    const toggle = event.target.closest("[data-workspace-action='toggle-nav']");
    if (toggle) {
      app.classList.toggle("is-nav-open");
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
    render();
  };
})();
