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
    masterWeek: "",
    styleBuyer: "",
    styleSearch: "",
    styleFolder: "",
    folderStyleActive: "",
    styleStandardCategory: "",
    styleStandardType: "",
    styleListImportId: "current"
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
    toast.innerHTML = '<span class="toast__message"></span>';
    toast.querySelector(".toast__message").textContent = message;
    toast.dataset.tone = type || "ok";
    toast.classList.add("is-open");
    toast.style.pointerEvents = "none";
    window.clearTimeout(K.toastTimer);
    window.clearInterval(K.toastCountdown);
    toast.querySelectorAll(".toast__countdown").forEach(function (countdown) { countdown.remove(); });
    K.toastTimer = window.setTimeout(function () {
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

  K.prompt = function (title, label, defaultValue, confirmLabel) {
    return new Promise(function (resolve) {
      const modal = document.getElementById("modal");
      modal.innerHTML = '<div class="modal prompt-modal"><div class="modal__head"><div><h2 class="modal__title">' + K.esc(title) + '</h2></div><button type="button" class="icon-btn" data-prompt-close aria-label="Tutup"><i class="ti ti-x"></i></button></div><form class="modal__body prompt-modal__body" data-prompt-form><div class="field"><label>' + K.esc(label) + '</label><input type="text" data-prompt-input required maxlength="180" value="' + K.esc(defaultValue || "") + '"></div><div class="confirm-modal__actions"><button type="button" class="btn" data-prompt-cancel>Batal</button><button type="submit" class="btn-primary" data-prompt-ok>' + K.esc(confirmLabel || "Simpan") + '</button></div></form></div>';
      modal.hidden = false;
      const input = modal.querySelector("[data-prompt-input]");
      input.focus();
      input.select();
      const finish = function (value) { modal.hidden = true; modal.innerHTML = ""; resolve(value); };
      modal.querySelector("[data-prompt-close]").addEventListener("click", function () { finish(null); });
      modal.querySelector("[data-prompt-cancel]").addEventListener("click", function () { finish(null); });
      modal.querySelector("[data-prompt-form]").addEventListener("submit", function (event) {
        event.preventDefault();
        finish(input.value);
      });
    });
  };

  async function hydrateStyleThumbnails() {
    const cache = new Map();
    const thumbnails = Array.from(document.querySelectorAll("[data-style-thumbnail]"));
    await Promise.all(thumbnails.map(async function (image) {
      const thumbId = image.dataset.thumbBlobId;
      const fullId = image.dataset.fullBlobId;
      const blobId = thumbId || fullId;
      if (!blobId) return;
      try {
        let url = cache.get(blobId);
        if (!url) {
          const blob = await B.getPreviewBlob(blobId, "image/jpeg");
          url = URL.createObjectURL(blob);
          cache.set(blobId, url);
        }
        image.src = url;
        image.classList.add("is-loaded");
        const placeholder = image.parentElement && image.parentElement.querySelector(".style-preview-placeholder");
        if (placeholder) placeholder.hidden = true;
      } catch (error) {
        image.removeAttribute("src");
      }
    }));
  }

  
  const WORKSPACE_ROLES = {
    admin: {
      id: "admin",
      label: "Admin",
      subLabel: "Administrator (Akses Penuh)",
      badgeColor: "#043168",
      badgeText: "Admin",
      icon: "ti-shield-check",
      avatar: "👑",
      routes: ["planner", "data-master", "daftar-style"],
      defaultRoute: "planner",
      canReset: true,
      canImport: true,
      canExport: true,
      canAdd: true,
      canEdit: true,
      canUpload: true,
      canUploadFiles: true,
      canDelete: true,
      canDeleteFiles: true,
      canUploadPlanner: true,
      canDownload: true,
      canPreview: true,
      description: "Memantau & mengelola seluruh modul sistem (Planner, Data Master, Daftar Style) serta kontrol database & reset."
    },
    planner: {
      id: "planner",
      label: "Planner",
      subLabel: "Planner (Rista)",
      badgeColor: "#00754a",
      badgeText: "Planner",
      icon: "ti-calendar-event",
      avatar: "📋",
      routes: ["planner"],
      defaultRoute: "planner",
      canReset: false,
      canImport: true,
      canExport: false,
      canAdd: false,
      canEdit: true,
      canUpload: false,
      canUploadFiles: false,
      canDelete: true,
      canDeleteFiles: false,
      canUploadPlanner: true,
      canDownload: true,
      canPreview: true,
      description: "Khusus menerima & mengunggah berkas New Style Updated mingguan, pratinjau spreadsheet, dan import ke Data Master."
    },
    ie: {
      id: "ie",
      label: "IE",
      subLabel: "IE (Suci)",
      badgeColor: "#1d4ed8",
      badgeText: "IE",
      icon: "ti-ruler-measure",
      avatar: "📐",
      routes: ["data-master", "daftar-style"],
      defaultRoute: "data-master",
      canReset: false,
      canImport: true,
      canExport: true,
      canAdd: true,
      canEdit: true,
      canUpload: true,
      canUploadFiles: true,
      canDelete: true,
      canDeleteFiles: true,
      canUploadPlanner: false,
      canDownload: true,
      canPreview: true,
      description: "Mengelola detail spesifikasi style di Data Master dan Daftar Style: delivery OPD, tambah style, import/export Excel, dan upload berkas teknis."
    },
    design: {
      id: "design",
      label: "Design",
      subLabel: "Design (Tim)",
      badgeColor: "#7c3aed",
      badgeText: "Design",
      icon: "ti-palette",
      avatar: "🎨",
      routes: ["planner", "data-master", "daftar-style"],
      defaultRoute: "daftar-style",
      canReset: false,
      canImport: false,
      canExport: false,
      canAdd: false,
      canEdit: false,
      canUpload: false,
      canUploadFiles: true,
      canDelete: false,
      canDeleteFiles: false,
      canUploadPlanner: false,
      canDownload: true,
      canPreview: true,
      description: "Memantau data di Planner, Data Master, dan Daftar Style serta mengunggah berkas foto/desain/fitting ke folder style."
    },
    manager: {
      id: "manager",
      label: "Manajer",
      subLabel: "Manajer (Executive)",
      badgeColor: "#b45309",
      badgeText: "Manajer",
      icon: "ti-briefcase",
      avatar: "👔",
      routes: ["planner", "data-master", "daftar-style"],
      defaultRoute: "planner",
      canReset: false,
      canImport: false,
      canExport: false,
      canAdd: false,
      canEdit: false,
      canUpload: false,
      canUploadFiles: false,
      canDelete: false,
      canDeleteFiles: false,
      canUploadPlanner: false,
      canDownload: true,
      canPreview: true,
      description: "Mengakses seluruh halaman (Planner, Data Master, Daftar Style) dalam mode monitoring dan pengawasan menyeluruh (lihat & unduh)."
    }
  };

  function getActiveRole() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const qRole = urlParams.get("role");
      if (qRole && WORKSPACE_ROLES[qRole]) {
        localStorage.setItem("bra-running-style-role", qRole);
        return qRole;
      }
    } catch (_) {}

    try {
      const stored = localStorage.getItem("bra-running-style-role");
      if (stored && WORKSPACE_ROLES[stored]) return stored;
    } catch (_) {}

    return "admin"; // Default to Administrator for the live portal as requested!
  }

  function setActiveRole(roleId) {
    if (!WORKSPACE_ROLES[roleId]) return;
    localStorage.setItem("bra-running-style-role", roleId);

    if (window.BRA && window.BRA.setRole) {
      const bRoleMap = { admin: "admin", planner: "md", ie: "ie", design: "pattern", manager: "qa" };
      window.BRA.setRole(bRoleMap[roleId] || "admin");
    }

    const roleObj = WORKSPACE_ROLES[roleId];
    const info = routeInfo();
    const currentBaseRoute = info.route === "folder-style" ? "daftar-style" : info.route;
    if (roleObj.routes.indexOf(currentBaseRoute) === -1) {
      window.location.hash = "#/" + roleObj.defaultRoute;
    } else {
      render();
    }
  }

  K.getActiveRole = getActiveRole;
  K.setActiveRole = setActiveRole;
  K.WORKSPACE_ROLES = WORKSPACE_ROLES;
  K.can = function (capability) {
    const roleId = getActiveRole();
    const roleObj = WORKSPACE_ROLES[roleId] || WORKSPACE_ROLES.admin;
    return Boolean(roleObj[capability]);
  };

  const ROLE_MENU_ID = "role-menu";

  function roleMenuTriggers() {
    return Array.from(document.querySelectorAll("[data-workspace-action='switch-role']"));
  }

  function closeRoleMenu() {
    const menu = document.getElementById(ROLE_MENU_ID);
    if (!menu) return;
    menu.remove();
    roleMenuTriggers().forEach(function (trigger) {
      trigger.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    });
    document.removeEventListener("pointerdown", onRoleMenuPointerDown, true);
    document.removeEventListener("keydown", onRoleMenuKeyDown, true);
    window.removeEventListener("resize", closeRoleMenu);
    window.removeEventListener("scroll", closeRoleMenu, true);
  }

  function onRoleMenuPointerDown(event) {
    if (event.target.closest("#" + ROLE_MENU_ID)) return;
    if (event.target.closest("[data-workspace-action='switch-role']")) return;
    closeRoleMenu();
  }

  function onRoleMenuKeyDown(event) {
    const menu = document.getElementById(ROLE_MENU_ID);
    if (!menu) return;
    if (event.key === "Escape") {
      const hadFocus = menu.contains(document.activeElement);
      closeRoleMenu();
      const trigger = document.querySelector(".topbar-user-btn");
      if (hadFocus && trigger) trigger.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = Array.from(menu.querySelectorAll("[data-role-option]"));
    if (!items.length) return;
    event.preventDefault();
    const index = items.indexOf(document.activeElement);
    const next = event.key === "ArrowDown"
      ? (index + 1) % items.length
      : (index - 1 + items.length) % items.length;
    items[next].focus();
  }

  function positionRoleMenu(menu, anchor) {
    const gap = 8;
    const rect = anchor.getBoundingClientRect();
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    let left = rect.right - width;
    if (left < gap) left = rect.left;
    left = Math.min(Math.max(left, gap), window.innerWidth - width - gap);
    let top = rect.bottom + gap;
    if (top + height > window.innerHeight - gap) {
      top = rect.top - height - gap;
      if (top < gap) top = Math.max(gap, window.innerHeight - height - gap);
    }
    menu.style.left = Math.round(left) + "px";
    menu.style.top = Math.round(top) + "px";
  }

  function openRoleMenu(anchorEl) {
    if (document.getElementById(ROLE_MENU_ID)) {
      closeRoleMenu();
      return;
    }
    const anchor = anchorEl || document.querySelector(".topbar-user-btn") || roleMenuTriggers()[0];
    if (!anchor) return;

    const current = getActiveRole();
    const currentRole = WORKSPACE_ROLES[current] || WORKSPACE_ROLES.admin;
    const options = Object.keys(WORKSPACE_ROLES).map(function (key) {
      const role = WORKSPACE_ROLES[key];
      const isActive = key === current;
      return '<button type="button" class="role-menu__item' + (isActive ? " is-active" : "") + '"' +
        ' role="menuitemradio" aria-checked="' + (isActive ? "true" : "false") + '"' +
        ' data-role-option="' + role.id + '">' +
          '<span class="role-menu__avatar" aria-hidden="true">' + role.avatar + "</span>" +
          '<span class="role-menu__text">' +
            '<span class="role-menu__label">' + K.esc(role.label) + "</span>" +
            '<span class="role-menu__sub">' + K.esc(role.subLabel) + "</span>" +
          "</span>" +
          (isActive ? '<i class="ti ti-check role-menu__check" aria-hidden="true"></i>' : "") +
        "</button>";
    }).join("");

    const menu = document.createElement("div");
    menu.id = ROLE_MENU_ID;
    menu.className = "role-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", "Ganti peran pengguna");
    menu.innerHTML =
      '<div class="role-menu__head">' +
        '<span class="role-menu__head-title"><i class="ti ti-user-switch" aria-hidden="true"></i> Simulasi login / ganti role</span>' +
        '<span class="role-menu__head-sub">Aktif: ' + K.esc(currentRole.label) + " · " + K.esc(currentRole.subLabel) + "</span>" +
      "</div>" +
      '<div class="role-menu__list">' + options + "</div>" +
      '<div class="role-menu__foot">Setiap peran hanya melihat halaman & fitur miliknya.</div>';
    document.body.appendChild(menu);
    positionRoleMenu(menu, anchor);
    anchor.classList.add("is-open");
    anchor.setAttribute("aria-expanded", "true");

    menu.querySelectorAll("[data-role-option]").forEach(function (button) {
      button.addEventListener("click", function () {
        const roleId = button.dataset.roleOption;
        closeRoleMenu();
        if (roleId === getActiveRole()) {
          K.toast("Anda sudah memakai peran " + WORKSPACE_ROLES[roleId].label + ".", "ok");
          return;
        }
        setActiveRole(roleId);
        K.toast("Beralih ke peran: " + WORKSPACE_ROLES[roleId].label, "ok");
      });
    });

    document.addEventListener("pointerdown", onRoleMenuPointerDown, true);
    document.addEventListener("keydown", onRoleMenuKeyDown, true);
    window.addEventListener("resize", closeRoleMenu);
    window.addEventListener("scroll", closeRoleMenu, true);

    const activeItem = menu.querySelector("[data-role-option].is-active");
    if (activeItem) activeItem.focus({ preventScroll: true });
  }
  K.openRoleMenu = openRoleMenu;
  K.closeRoleMenu = closeRoleMenu;
  K.showRoleModal = openRoleMenu;

  function routeInfo() {
    const parts = (window.location.hash || "#/planner").replace(/^#\/?/, "").split("/");
    return { route: parts[0] || "planner", id: parts[1] ? decodeURIComponent(parts[1]) : null };
  }

  function render() {
    const currentRole = getActiveRole();
    const roleObj = WORKSPACE_ROLES[currentRole] || WORKSPACE_ROLES.admin;
    const info = routeInfo();

    // Determine the base route
    const currentBaseRoute = info.route === "folder-style" ? "daftar-style" : info.route;

    // Check if current route is allowed for this role
    if (roleObj.routes.indexOf(currentBaseRoute) === -1) {
      // Silent redirect! No error prompt, no "Tidak Punya Akses" banner.
      window.location.hash = "#/" + roleObj.defaultRoute;
      return;
    }

    if (!NAV.some(function (item) { return item.id === info.route; }) && !K.views[info.route]) {
      window.location.hash = "#/" + roleObj.defaultRoute;
      return;
    }

    const active = currentBaseRoute;

    // Filter navigation menus according to active role permissions
    const allowedNav = NAV.filter(function (item) {
      return roleObj.routes.indexOf(item.id) !== -1;
    });

    // Build Rail (Sidebar)
    let railFootContent = "";
    if (roleObj.canReset) {
      railFootContent =
        '<div class="rail-foot"><strong>Running Style</strong>Kelola update dan berkas style.' +
        '<button type="button" data-workspace-reset="demo">Kembalikan data contoh</button>' +
        '<button type="button" class="rail-danger-link" data-workspace-reset="testing">Kosongkan semua data uji</button>' +
        '</div>';
    } else {
      railFootContent =
        '<div class="rail-foot"><strong>Running Style</strong>' +
        '<span style="font-size:11px; color:#8fa0b6; display:block; margin-top:2px;">Role: ' + K.esc(roleObj.subLabel) + '</span>' +
        '<button type="button" data-workspace-action="switch-role" style="color:#00e599; font-weight:600; text-decoration:none; margin-top:8px; display:inline-flex; align-items:center; gap:4px; font-size:11.5px; background:none; border:none; padding:0; cursor:pointer;">' +
          '<i class="ti ti-user-switch"></i> Ganti Role / Akun' +
        '</button>' +
        '</div>';
    }

    rail.innerHTML =
      '<div class="brand"><img class="brand__mark" src="assets/bra-logo.png" alt="Logo BRA"><span>' +
        '<span class="brand__name">RUNNING STYLE</span>' +
        '<span class="brand__sub">Planner · Data · Berkas</span></span></div>' +
      '<div class="user-profile-badge" data-workspace-action="switch-role" role="button" tabindex="0" aria-haspopup="menu" aria-expanded="false" title="Ganti role / simulasi login">' +
        '<span class="user-avatar">' + roleObj.avatar + '</span>' +
        '<div class="user-meta">' +
          '<span class="user-name">' + K.esc(roleObj.label) + '</span>' +
          '<span class="user-role">' + K.esc(roleObj.subLabel) + '</span>' +
        '</div>' +
        '<i class="ti ti-chevron-right" style="font-size:12px; opacity:0.6; color:#fff;"></i>' +
      '</div>' +
      '<div class="nav-group"><p class="nav-label">Menu utama</p>' +
        allowedNav.map(function (item) {
          return '<a class="nav-item' + (active === item.id ? " is-active" : "") +
            '" href="#/' + item.id + '">' +
            '<i class="ti ' + item.icon + '" aria-hidden="true"></i><span>' +
            K.esc(item.label) + "</span></a>";
        }).join("") +
      '</div>' + railFootContent;

    // Topbar
    const navItem = NAV.filter(function (item) {
      return item.id === currentBaseRoute;
    })[0] || { title: "Folder Style" };

    const isSubPage = !NAV.some(function (item) { return item.id === info.route; }) || Boolean(info.id);
    const backButton = isSubPage
      ? ((info.route === "folder-style" || (info.route === "daftar-style" && info.id))
          ? '<a class="btn topbar-back-btn" href="#/daftar-style" aria-label="Kembali ke daftar style">' +
              '<i class="ti ti-arrow-left" aria-hidden="true"></i><span>Kembali</span>' +
            '</a>'
          : '<button class="btn topbar-back-btn" onclick="window.history.back()" aria-label="Kembali ke halaman sebelumnya">' +
              '<i class="ti ti-arrow-left" aria-hidden="true"></i><span>Kembali</span>' +
            '</button>')
      : '';

    topbar.innerHTML =
      '<button class="btn nav-toggle" data-workspace-action="toggle-nav" aria-label="Buka navigasi">' +
        '<i class="ti ti-menu"></i></button>' +
      backButton +
      '<div class="crumb"><span class="crumb__current">' + K.esc(navItem.title) + "</span></div>" +
      '<div style="margin-left:auto; display:flex; align-items:center; gap:10px;">' +
        (currentRole === "admin"
          ? '<span class="admin-portal-pill"><i class="ti ti-shield-check"></i> <span>Portal Administrator (Full Access)</span></span>'
          : '<button type="button" class="btn" data-workspace-action="set-role-admin" style="display:inline-flex; align-items:center; gap:6px; font-size:12px; padding:5px 12px; background:#043168; color:#fff; border-radius:9999px; border:none; font-weight:600; cursor:pointer;"><i class="ti ti-shield-check"></i> Kembali ke Mode Admin</button>') +
        '<button type="button" class="topbar-user-btn" data-workspace-action="switch-role" title="Ganti role / simulasi login" aria-haspopup="menu" aria-expanded="false" aria-label="Ganti role, aktor aktif ' + K.esc(roleObj.label) + '">' +
          '<span style="font-size:16px;" aria-hidden="true">' + roleObj.avatar + '</span>' +
          '<span>' + K.esc(roleObj.label) + '</span>' +
          '<i class="ti ti-chevron-down topbar-user-btn__chev" style="font-size:11px; opacity:0.6;" aria-hidden="true"></i>' +
        '</button>' +
        '<a href="prototype/index.html" style="display:inline-flex; align-items:center; gap:6px; background:#00754a; color:#ffffff; padding:6px 14px; border-radius:9999px; font-size:12px; font-weight:700; text-decoration:none; box-shadow:0 2px 4px rgba(0,117,74,0.25); transition:opacity 0.2s;" onmouseover="this.style.opacity=0.9" onmouseout="this.style.opacity=1">' +
          '<i class="ti ti-palette"></i> <span>Portal Prototype UI (Tailwind)</span>' +
        '</a>' +
      '</div>';

    view.innerHTML = K.views[info.route](info);
    hydrateStyleThumbnails();
    document.title = "BRA · " + navItem.title + (currentRole !== "admin" ? " (" + roleObj.label + ")" : " [Administrator]");
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
    const snapshotMutationControl = event.target.closest("[data-style-preview-replace], [data-style-preview-upload], [data-master-field], [data-master-photo-uploaded], [data-delete-style-row], [data-edit-style-row], [data-toggle-style-file-form], form[data-workspace-form]");
    if (snapshotMutationControl && ((K.ui.masterImportId && K.ui.masterImportId !== "current") || (K.ui.styleListImportId && K.ui.styleListImportId !== "current"))) {
      K.toast("Snapshot bersifat hanya-baca. Pilih data aktif untuk mengubah atau menambah data.", "error");
      if (typeof event.target.value === "string" && event.target.type === "file") event.target.value = "";
      return;
    }

    const filterSelect = event.target.closest('select[data-filter^="masterFilter."]');
    if (filterSelect) {
      const key = filterSelect.dataset.filter.slice("masterFilter.".length);
      K.ui.masterFilters[key] = filterSelect.value;
      K.ui.masterFilterOpen = key;
      rerenderKeepingFocus(filterSelect);
      return;
    }

    const previewReplace = event.target.closest("[data-style-preview-replace]");
    if (previewReplace) {
      const file = previewReplace.files && previewReplace.files[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|webp|gif|bmp)$/i.test(file.type)) {
        K.toast("Gunakan foto PNG, JPG/JPEG, WEBP, GIF, atau BMP.", "error");
        previewReplace.value = "";
        return;
      }
      if (file.size > 1024 * 1024 * 1024) {
        K.toast("Ukuran foto maksimal 1 GB per berkas.", "error");
        previewReplace.value = "";
        return;
      }
      const styleId = previewReplace.dataset.styleId;
      if (!window.confirm("Ganti foto lama untuk Style " + styleId + " dengan foto baru ini?")) {
        previewReplace.value = "";
        return;
      }
      try {
        if (B.foldersForStyle(styleId).indexOf("Foto Running Style") === -1) {
          B.addStyleFolder(styleId, "Foto Running Style");
        }
        const newRecord = await B.addStyleFile(styleId, ["Foto Running Style"], file, {});
        const oldPreviewRecords = B.get().workspaceFiles.filter(function (record) {
          return record.id !== newRecord.id && record.styleId === styleId && Array.isArray(record.folders) && record.folders.indexOf("Foto Running Style") !== -1;
        });
        for (const oldRecord of oldPreviewRecords) {
          await B.deleteWorkspaceFile(oldRecord.blobId);
        }
        K.toast("Foto preview untuk Style " + styleId + " berhasil diganti.");
        render();
      } catch (error) {
        K.toast(error.message || "Foto preview gagal diganti.", "error");
        previewReplace.value = "";
      }
      return;
    }

    const previewUpload = event.target.closest("[data-style-preview-upload]");
    if (previewUpload) {
      const file = previewUpload.files && previewUpload.files[0];
      if (!file) return;
      if (!/^image\/(png|jpeg|webp|gif|bmp)$/i.test(file.type)) {
        K.toast("Gunakan foto PNG, JPG/JPEG, WEBP, GIF, atau BMP.", "error");
        previewUpload.value = "";
        return;
      }
      if (file.size > 1024 * 1024 * 1024) {
        K.toast("Ukuran foto maksimal 1 GB per berkas.", "error");
        previewUpload.value = "";
        return;
      }
      const styleId = previewUpload.dataset.styleId;
      try {
        if (B.foldersForStyle(styleId).indexOf("Foto Running Style") === -1) {
          B.addStyleFolder(styleId, "Foto Running Style");
        }
        await B.addStyleFile(styleId, ["Foto Running Style"], file, {});
        K.toast("Foto preview untuk Style " + styleId + " berhasil disimpan.");
        render();
      } catch (error) {
        K.toast(error.message || "Foto preview gagal disimpan.", "error");
        previewUpload.value = "";
      }
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

    if ((K.ui.masterImportId && K.ui.masterImportId !== "current") || (K.ui.styleListImportId && K.ui.styleListImportId !== "current")) {
      const readonlyControl = event.target.closest("[data-master-field], [data-master-photo-uploaded], [data-delete-style-row], [data-edit-style-row], [data-style-preview-replace], [data-style-preview-upload]");
      if (readonlyControl) {
        K.toast("Snapshot bersifat hanya-baca. Pilih Data Master Aktif untuk mengubah data.", "error");
        return;
      }
    }

    const photoUploaded = event.target.closest("[data-master-photo-uploaded]");
    if (photoUploaded) {
      try {
        const isChecked = event.target.checked === true;
        B.updateMaster(photoUploaded.dataset.styleId, "photoUploaded", isChecked);
        photoUploaded.setAttribute("aria-label", isChecked ? "Foto sudah diunggah" : "Foto belum diunggah");
        K.toast(isChecked ? "Foto ditandai sudah diunggah." : "Checklist foto dikosongkan kembali.");
      } catch (error) {
        photoUploaded.checked = !photoUploaded.checked;
        K.toast(error.message, "error");
      }
      return;
    }

    const field = event.target.closest("[data-master-field]");
    if (field) {
      if (field.dataset.masterField === "templatePhotoStatus") {
        field.classList.toggle("master-template-status--ready", field.value === "ready");
        field.classList.toggle("master-template-status--missing", field.value !== "ready");
      }
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
    if ((K.ui.masterImportId && K.ui.masterImportId !== "current") || (K.ui.styleListImportId && K.ui.styleListImportId !== "current")) {
      K.toast("Snapshot bersifat hanya-baca. Pilih Data Master Aktif untuk mengubah atau menambah data.", "error");
      return;
    }
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
        const existing = B.get().plannerFiles.find(function (record) {
          return String(record.name || "").toLowerCase() === String(file && file.name || "").toLowerCase();
        });
        if (existing && B.importedFileStillInMaster(file.name)) {
          const firstWarning = await K.confirm(
            'Peringatan: file "' + file.name + '" pernah diupload dan datanya masih ada di Data Master. Upload ulang dapat memperbarui atau mendeteksi data yang sama.',
            "Lanjutkan",
            "Batalkan"
          );
          if (!firstWarning) return;
          const secondWarning = await K.confirm(
            "Konfirmasi kedua: apakah Anda yakin ingin mengupload ulang file yang sama?",
            "Ya, upload ulang",
            "Batalkan"
          );
          if (!secondWarning) return;
        }
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
        const productId = String(data.get("product") || "").trim();
        const duplicateStyle = B.get().styles.find(function (style) {
          return String(style.id || "").toLowerCase() === productId.toLowerCase();
        });
        if (duplicateStyle) {
          throw new Error('Peringatan: data tidak diizinkan ganda. Article/Style "' + duplicateStyle.id + '" sudah ada di Data Master; tidak ada data baru yang ditambahkan.');
        }
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
    const snapshotMutationControl = event.target.closest("[data-delete-style-row], [data-edit-style-row], [data-rename-style-folder-root], [data-delete-style-folder-root], [data-toggle-style-file-form], [data-rename-file], [data-delete-file], [data-delete-style-folder], [data-style-preview-replace], [data-style-preview-upload]");
    if (snapshotMutationControl && ((K.ui.masterImportId && K.ui.masterImportId !== "current") || (K.ui.styleListImportId && K.ui.styleListImportId !== "current"))) {
      K.toast("Snapshot bersifat hanya-baca. Pilih data aktif untuk mengubah atau menghapus data.", "error");
      return;
    }

    
    const switchRole = event.target.closest("[data-workspace-action='switch-role']");
    if (switchRole) {
      openRoleMenu(switchRole);
      return;
    }

    const setRoleAdmin = event.target.closest("[data-workspace-action='set-role-admin']");
    if (setRoleAdmin) {
      setActiveRole("admin");
      K.toast("Kembali ke Portal Administrator (Akses Penuh).", "ok");
      return;
    }

    const cancelAddMasterStyle = event.target.closest("[data-cancel-add-master-style]");
    if (cancelAddMasterStyle) {
      const form = cancelAddMasterStyle.closest("form");
      if (form) form.reset();
      const panel = cancelAddMasterStyle.closest("details");
      if (panel) panel.open = false;
      return;
    }

    const closeToast = event.target.closest("[data-close-toast]");
    if (closeToast) {
      toast.classList.remove("is-open");
      toast.style.pointerEvents = "none";
      window.clearTimeout(K.toastTimer);
      return;
    }

    const resetButton = event.target.closest("[data-workspace-reset]");
    if (resetButton) {
      const mode = resetButton.dataset.workspaceReset;
      if (mode === "demo") {
        const confirmed = await K.confirm("Kembalikan data contoh awal? Semua perubahan saat ini akan diganti.", "Kembalikan", "Batal");
        if (!confirmed) return;
        B.reset();
        K.render();
        toast("Data contoh awal dimuat ulang.");
      } else if (mode === "testing") {
        const confirmed = await K.confirm("Kosongkan semua style, file Planner, folder, file style, dan berkas uji? Data tidak dapat dipulihkan.", "Kosongkan Semua", "Batal");
        if (!confirmed) return;
        try {
          await B.resetAllData();
          window.location.hash = "#/planner";
          K.render();
          K.toast("Semua data uji berhasil dihapus.");
        } catch (error) {
          K.toast(error.message, "error");
        }
      }
      return;
    }

    const masterWeekClear = event.target.closest("[data-master-week-clear]");
    if (masterWeekClear) {
      K.ui.masterWeek = "";
      render();
      return;
    }

    const masterWeekFolder = event.target.closest("[data-master-week]");
    if (masterWeekFolder) {
      const selectedWeek = masterWeekFolder.dataset.masterWeek;
      K.ui.masterWeek = String(K.ui.masterWeek || "").trim().toLowerCase().replace(/\s+/g, " ") === selectedWeek.trim().toLowerCase().replace(/\s+/g, " ") ? "" : selectedWeek;
      render();
      return;
    }

    const styleWeekClear = event.target.closest("[data-style-week-clear]");
    if (styleWeekClear) {
      K.ui.styleWeek = "";
      render();
      return;
    }

    const styleWeekFolder = event.target.closest("[data-style-week]");
    if (styleWeekFolder) {
      const selectedWeek = styleWeekFolder.dataset.styleWeek;
      K.ui.styleWeek = String(K.ui.styleWeek || "").trim().toLowerCase().replace(/\s+/g, " ") === selectedWeek.trim().toLowerCase().replace(/\s+/g, " ") ? "" : selectedWeek;
      render();
      return;
    }

    const renameMasterImport = event.target.closest("[data-rename-master-import]");
    if (renameMasterImport) {
      const batchId = renameMasterImport.dataset.renameMasterImport;
      const batch = (B.get().masterImportBatches || []).find(function (item) { return item.id === batchId; });
      if (!batch) { K.toast("Folder/snapshot import tidak ditemukan.", "error"); return; }
      const newName = await K.prompt("Edit Folder Import Data Master", "Nama folder / file snapshot", batch.fileName || "", "Simpan Perubahan");
      if (newName != null) {
        try { B.renameMasterImportBatch(batchId, newName); K.toast("Nama folder import berhasil diperbarui."); render(); }
        catch (error) { K.toast(error.message, "error"); }
      }
      return;
    }

    const deleteMasterImport = event.target.closest("[data-delete-master-import]");
    if (deleteMasterImport) {
      const batchId = deleteMasterImport.dataset.deleteMasterImport;
      const batch = (B.get().masterImportBatches || []).find(function (item) { return item.id === batchId; });
      if (!batch) { K.toast("Folder/snapshot import tidak ditemukan.", "error"); return; }
      const confirmed = await K.confirm(
        'Hapus folder/snapshot "' + (batch.fileName || "Import Data Master") + '"? Data Master aktif dan isi file Planner tidak akan dihapus.',
        "Hapus Folder",
        "Batalkan"
      );
      if (confirmed) {
        try {
          B.deleteMasterImportBatch(batchId);
          if (K.ui.masterImportId === batchId) K.ui.masterImportId = "current";
          if (K.ui.styleListImportId === batchId) K.ui.styleListImportId = "current";
          K.toast("Folder/snapshot import berhasil dihapus."); render();
        } catch (error) { K.toast(error.message, "error"); }
      }
      return;
    }

    const styleImportBatch = event.target.closest("[data-style-import-batch]");
    if (styleImportBatch) {
      const selectedId = styleImportBatch.dataset.styleImportBatch;
      K.ui.styleListImportId = selectedId;
      render();
      return;
    }

    const masterCurrentBatch = event.target.closest("[data-master-current-batch]");
    if (masterCurrentBatch) {
      K.ui.masterImportId = "current";
      render();
      return;
    }

    const masterImportBatch = event.target.closest("[data-master-import-batch]");
    if (masterImportBatch) {
      const selectedId = masterImportBatch.dataset.masterImportBatch;
      K.ui.masterImportId = K.ui.masterImportId === selectedId ? "current" : selectedId;
      render();
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
      const previousImports = (B.get().indexImports || []).filter(function (item) {
        return String(item.fileName || "").trim().toLowerCase() === String(fileName || "").trim().toLowerCase();
      });
      if (previousImports.length) {
        const confirmedAgain = await K.confirm(
          'Peringatan duplikasi: file "' + fileName + '" sudah pernah di-import ' + previousImports.length + ' kali. Mengimport ulang dapat membuat folder/ snapshot dan data style baru ganda.',
          "Tetap import ulang",
          "Batalkan"
        );
        if (!confirmedAgain) return;
        const confirmedSecond = await K.confirm(
          "Konfirmasi kedua: Anda yakin ingin mengimport file yang sama kembali?",
          "Ya, import ulang",
          "Batalkan"
        );
        if (!confirmedSecond) return;
      }
      try {
        importPlannerBtn.disabled = true;
        importPlannerBtn.textContent = "Membaca file…";
        await new Promise(function (resolve) { setTimeout(resolve, 30); });
        const blob = await B.getPreviewBlob(blobId, fileType);
        const file = new File([blob], fileName, { type: fileType });
        let parsed = await BRAImportEngine.readPivotSheet(file);
        if (!parsed.rows.length) throw new Error("Sheet PIVOT tidak memiliki data Style yang bisa dibaca.");

        const schema = [
          { name: "style", label: "Style / Article", aliases: ["STYLE", "ARTICLE", "STYLE CODE", "STYLE CODIFICATION"] },
          { name: "buyer", label: "Buyer / Customer", aliases: ["BUYER", "CUSTOMER"] },
          { name: "description", label: "Description / Nama Style", aliases: ["STYLE DESCRIPTION", "DESCRIPTION", "NAME STYLE"] },
          { name: "group", label: "Product Group / Type", aliases: ["TYPE", "PRODUCT GROUP"] },
          { name: "week", label: "Minggu", aliases: ["WEEK", "WK"], allowContains: false },
          { name: "opd", label: "OPD / Email Received Date", aliases: ["OPD", "ORDER RECEIVED DATE", "EMAIL RECEIVED DATE"] },
          { name: "delivery", label: "Delivery Date", aliases: ["DEL DATE", "DELIVERY DATE", "BUYER ORIG DEL DATE"] },
          { name: "smv", label: "SMV", aliases: ["SMV"] },
          { name: "bonding", label: "Bonding Status / NB-B", aliases: ["BONDING STATUS", "NB", "BONDING"] },
          { name: "pic", label: "PIC", aliases: ["MD OIC", "PIC", "PIC MASTER"] },
          { name: "remark", label: "Remark", aliases: ["REMARKS OS", "REVISED EXFTY REMARKS", "REMARK", "NOTE"] }
        ];

        const mapping = BRAImportEngine.buildMapping(parsed.headers, schema);
        const plannerWeek = importPlannerBtn.dataset.fileWeek || "";
        const modal = document.getElementById("modal");
        let selectedMode = "preserve";

        const renderPreview = function () {
          const currentMapping = BRAImportEngine.buildMapping(parsed.headers, schema);
          const previewHeaders = [currentMapping.style, currentMapping.buyer, currentMapping.group, currentMapping.description, currentMapping.delivery, currentMapping.smv].filter(Boolean);
          const previewRows = parsed.rows.slice(0, 20);
          const sheetOptions = "";
          const mappingRows = schema.map(function (field) {
            return '<tr><td>' + K.esc(field.label) + '</td><td><strong>' + K.esc(currentMapping[field.name] || "Tidak terpetakan") + '</strong></td></tr>';
          }).join('');
          modal.innerHTML =
            '<div class="import-preview-modal"><div class="modal__head"><div>' +
              '<h2 class="modal__title">Preview & Mapping Import</h2><p class="modal__sub">' + K.esc(fileName) + '</p>' +
            '</div><button type="button" class="icon-btn" data-import-preview-close aria-label="Tutup"><i class="ti ti-x"></i></button></div>' +
            '<div class="modal__body">' +
              '<div class="form-grid" style="grid-template-columns: minmax(220px,1fr) minmax(220px,1fr); align-items:end"><div class="field"><label>Worksheet sumber</label><input value="PIVOT" readonly></div>' +
              '<label>Perlakuan data lama<select data-import-mode><option value="preserve"'+(selectedMode === "preserve" ? " selected" : "")+'>Isi hanya kolom yang ditemukan</option><option value="replace"'+(selectedMode === "replace" ? " selected" : "")+'>Ganti field yang dipetakan</option></select></label></div>' +
              '<div class="import-preview-note">Hanya sheet <strong>PIVOT</strong> yang dibaca. Style per Artikel diproses satu kali dengan versi data terbaru, berdasarkan penanggalan delivery.</div>' +
              '<div class="import-preview-table"><table class="table"><thead><tr>' + previewHeaders.map(function (h) { return '<th>' + K.esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
              previewRows.map(function (row) { return '<tr>' + previewHeaders.map(function (h) { return '<td>' + K.esc(row[h]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
              '<details style="margin-top:12px"><summary>Daftar pemetaan kolom (' + Object.keys(currentMapping).length + ' field)</summary><table class="table"><tbody>' + mappingRows + '</tbody></table></details>' +
            '</div>' +
            '<div class="import-preview-footer"><button type="button" class="btn" data-import-preview-cancel>Batal</button><button type="button" class="btn-primary" data-import-preview-ok><i class="ti ti-upload"></i> Import ke Data Master</button></div>' +
            '</div>';

          modal.querySelector("[data-import-preview-close]").addEventListener("click", function () { modal.hidden = true; resolvePreview(false); });
          modal.querySelector("[data-import-preview-cancel]").addEventListener("click", function () { modal.hidden = true; resolvePreview(false); });
          modal.querySelector("[data-import-preview-ok]").addEventListener("click", function () { modal.hidden = true; resolvePreview(true); });
          modal.querySelector("[data-import-mode]").addEventListener("change", function (event) { selectedMode = event.target.value; });
        };

        let resolvePreview;
        const confirmed = await new Promise(function (resolve) { resolvePreview = resolve; modal.hidden = false; renderPreview(); });
        if (!confirmed) return;

        let skipped = 0;
        const seen = {};
        const duplicateKeys = {};
        const importedStyleIds = [];
        const inputs = [];
        importPlannerBtn.textContent = "Memproses data…";
        parsed.rows.forEach(function (row) {
          const currentMapping = mapping;
          const product = String(row[currentMapping.style] || "").trim();
          if (!product) { skipped++; return; }
          const key = product.toLowerCase();
          if (seen[key]) duplicateKeys[key] = (duplicateKeys[key] || 0) + 1;
          seen[key] = true;
          const buyerText = String(row[currentMapping.buyer] || "").trim();
          const buyerAliases = {
            "AME": "AME", "AMERICAN EAGLE": "AME",
            "AEO": "AME", "AEQ": "AME",
            "HBA": "HBI", "HANESBRANDS": "HBI",
            "HBI": "HBI",
            "DELTA GALIL": "DTG/Delta Galil", "DELTA GALIL INDUSTRIES": "DTG/Delta Galil", "DELTA GALIL USA": "DTG/Delta Galil",
            "DTG": "DTG/Delta Galil",
            "KOMAR SOURCING LIMITED": "KMR/Komar", "KOMAR": "KMR/Komar",
            "VICTORIA'S SECRET": "VS/Victoria's Secret", "VICTORIA SECRET": "VS/Victoria's Secret",
            "VSS": "VS/Victoria's Secret", "SPANX": "SPX/Spanx",
            "WACOAL": "WAC US/Wacoal", "WACOAL CORP.": "WAC US/Wacoal", "WACOAL CORP": "WAC US/Wacoal",
            "BONPRIX": "BPX", "BPX": "BPX",             "BNP": "BPX", "OTTO": "OTTO", "OTTO INTERNATIONAL BANGKOK LTD": "OTTO",
            "SIMON DE WINTER": "SDW", "EVEDEN LTD": "EVDN", "EVEDEN": "EVDN",
            "HENNESS & MAURITZ AB": "H&M", "H&M": "H&M",
            "PT. PACIFIC BRANDS INDONESIA": "PBI", "TRIUMPH INTERNATIONAL AG": "TIG",
            "BRAVISSIMO LTD": "BRVS", "BASIC RESOURCES INC": "BR",
            "TARGET AUSTRALIA PTY LTD": "TAG", "JCPENNEY": "JCP",
            "ARIELA ALPHA INTERNATIONAL": "AAI", "ART MARTIN TUNISIE D": "ART MARTIN",
            "FRUIT OF THE LOOM": "FOTL", "HANESBRANDS INC": "HBI", "CHAMPION EUROPE SRL": "CHP/Champion"          };
          const buyerTextUpper = buyerText.toUpperCase().replace(/\s+/g, " ").trim().replace(/[.,]+$/, "");
          let buyer = buyerAliases[buyerTextUpper] || "";
          if (!buyer && buyerTextUpper.indexOf("WACOAL") === 0) buyer = "WAC US/Wacoal";
          if (!buyer && buyerTextUpper.indexOf("DELTA GALIL") === 0) buyer = "DTG/Delta Galil";
          if (!buyer && buyerTextUpper.indexOf("VICTORIA") === 0) buyer = "VS/Victoria's Secret";
          if (!buyer && buyerTextUpper.indexOf("AMERICAN EAGLE") === 0) buyer = "AME";
          if (!buyer && buyerTextUpper.indexOf("KOMAR") === 0) buyer = "KMR/Komar";
          if (!buyer && buyerTextUpper.indexOf("SIMON DE WINTER") === 0) buyer = "SDW";
          if (!buyer && buyerTextUpper.indexOf("EVEDEN") === 0) buyer = "EVDN";
          if (!buyer && buyerTextUpper.indexOf("HENNESS") === 0) buyer = "H&M";
          if (!buyer && buyerTextUpper.indexOf("PACIFIC BRANDS") === 0) buyer = "PBI";
          if (!buyer && buyerTextUpper.indexOf("TRIUMPH") === 0) buyer = "TIG";
          if (!buyer && buyerTextUpper.indexOf("BRAVISSIMO") === 0) buyer = "BRVS";
          if (!buyer && buyerTextUpper.indexOf("BASIC RESOURCES") === 0) buyer = "BR";
          if (!buyer && buyerTextUpper.indexOf("TARGET AUSTRALIA") === 0) buyer = "TAG";
          if (!buyer && buyerTextUpper.indexOf("JCP") === 0) buyer = "JCP";
          if (!buyer && buyerTextUpper.indexOf("ARIELA") === 0) buyer = "AAI";
          if (!buyer && buyerTextUpper.indexOf("ART MARTIN") === 0) buyer = "ART MARTIN";
          if (!buyer && buyerTextUpper.indexOf("FRUIT OF THE LOOM") === 0) buyer = "FOTL";
          if (!buyer && buyerTextUpper.indexOf("HANESBRANDS") === 0) buyer = "HBI";
          if (!buyer && buyerTextUpper.indexOf("CHAMPION") === 0) buyer = "CHP/Champion";
          if (!buyer) {
            buyer = B.WORKSPACE_BUYERS.find(function (v) {
              return String(v).toLowerCase() === buyerText.toLowerCase();
            }) || "";
          }
          if (!buyer) { skipped++; duplicateKeys[key] = 0; return; }
          const groupText = String(row[currentMapping.group] || "").trim();
          let productGroupMaster = "";
          if (groupText) {
            productGroupMaster = B.WORKSPACE_PRODUCT_GROUPS.find(function (v) { return v.toLowerCase() === groupText.toLowerCase(); }) || "";
          }
          const bondingText = String(row[currentMapping.bonding] || "").trim().toUpperCase();
          const nb = bondingText.indexOf("BOND") !== -1 ? (bondingText.indexOf("NON") === -1 ? "B" : "NB") : "";
          const importedInput = {
            product: product, buyer: buyer,
            description: String(row[currentMapping.description] || "").trim(),
            week: String(row[currentMapping.week] || plannerWeek || "").trim(),
            opd: BRAImportEngine.formatDate(row[currentMapping.opd]),
            deliveryDate: BRAImportEngine.formatDate(row[currentMapping.delivery]),
            productGroupMaster: productGroupMaster,
            nb: nb,
            picMaster: String(row[currentMapping.pic] || "").trim(),
            smv: String(row[currentMapping.smv] || "").trim(),
            remark: String(row[currentMapping.remark] || "").trim(),
            preserveMissing: selectedMode === "preserve"
          };
          const existingIndex = inputs.findIndex(function (input) {
            return String(input.product || "").toLowerCase() === key;
          });
          if (existingIndex === -1) {
            inputs.push(importedInput);
          } else {
            skipped++;
            const existingInput = inputs[existingIndex];
            const existingDelivery = String(existingInput.deliveryDate || "");
            const newDelivery = String(importedInput.deliveryDate || "");
            if (newDelivery && (!existingDelivery || newDelivery > existingDelivery)) {
              inputs[existingIndex] = importedInput;
            }
          }
          if (importedStyleIds.indexOf(product) === -1) importedStyleIds.push(product);
        });
        importPlannerBtn.textContent = "Memperbarui Data Master…";
        await new Promise(function (resolve) { setTimeout(resolve, 30); });
        const batchResult = await B.applyMasterImport(inputs, importedStyleIds);
        const added = batchResult.added;
        const replaced = batchResult.replaced;
        const removed = batchResult.removed;
        skipped += batchResult.skipped;
        B.recordIndexImport({ fileName: fileName, sheetName: parsed.sheetName, importedAt: new Date().toISOString(), added: added, replaced: replaced, removed: removed, skipped: skipped, rowCount: parsed.detailRowCount || parsed.rows.length, styleRowCount: parsed.explicitStyleCells || parsed.rows.length, uniqueStyleCount: parsed.uniqueStyleCount || parsed.rows.length, rowCountUnique: parsed.rows.length, styleIds: importedStyleIds });
        const masterCount = B.get().styles.length;
        K.toast("Sinkronisasi Pivot selesai: " + masterCount + " style di Data Master (" + removed + " lama dihapus). Hanya Style yang ada di sheet PIVOT yang dipertahankan.");
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
        K.ui.masterImportId = "current";
        K.ui.styleListImportId = "current";
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
      const newName = await K.prompt("Rename Folder Style", "Nama baru folder style", oldName, "Simpan Nama");
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
      const newName = await K.prompt("Rename Folder", "Nama baru folder", oldName, "Simpan Nama");
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
      window.location.hash = "#/folder-style/" + encodeURIComponent(styleRow.dataset.styleRow);
      return;
    }

    const openFolder = event.target.closest("[data-open-style-folder]");
    if (openFolder) {
      event.preventDefault();
      K.ui.styleFolder = openFolder.dataset.openStyleFolder;
      window.location.hash = "#/folder-style/" + encodeURIComponent(openFolder.dataset.styleId);
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
      const newName = await K.prompt("Rename File", "Nama baru file", oldName, "Simpan Nama");
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
    const roleObj = WORKSPACE_ROLES[getActiveRole()] || WORKSPACE_ROLES.admin;
    if (!window.location.hash) window.location.hash = "#/" + roleObj.defaultRoute;
    if (B.requestPersistentStorage) B.requestPersistentStorage();
    render();

    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("login") === "1") {
        setTimeout(function () { openRoleMenu(); }, 200);
      }
    } catch (_) {}
  };
})();
