/* Role-Based Access Control for BRA Running Style Prototype */

const ROLES = {
  IE: {
    label: "IE (Suci)",
    pages: ["data-master", "daftar-style"],
    planner: { view: false, download: false, upload: false, import: false, rename: false, delete: false },
    dataMaster: { view: true, edit: true, addStyle: true, import: true, export: true, reset: true, filter: true },
    daftarStyle: { view: true, edit: true, addStyle: true, uploadIndex: true, uploadFile: true, download: true, preview: true }
  },
  PLANNER: {
    label: "Planner (Rista)",
    pages: ["planner"],
    planner: { view: true, download: true, upload: true, import: true, rename: true, delete: true },
    dataMaster: { view: false, edit: false, addStyle: false, import: false, export: false, reset: false, filter: false },
    daftarStyle: { view: false, edit: false, addStyle: false, uploadIndex: false, uploadFile: false, download: false, preview: false }
  },
  DESIGN: {
    label: "Design (Tim)",
    pages: ["planner", "data-master", "daftar-style"],
    planner: { view: true, download: true, upload: false, import: false, rename: false, delete: false },
    dataMaster: { view: true, edit: false, addStyle: false, import: false, export: false, reset: false, filter: true },
    daftarStyle: { view: true, edit: false, addStyle: false, uploadIndex: false, uploadFile: true, download: true, preview: true }
  },
  MANAGER: {
    label: "Manajer",
    pages: ["planner", "data-master", "daftar-style"],
    planner: { view: true, download: true, upload: false, import: false, rename: false, delete: false },
    dataMaster: { view: true, edit: false, addStyle: false, import: false, export: false, reset: false, filter: true },
    daftarStyle: { view: true, edit: false, addStyle: false, uploadIndex: false, uploadFile: false, download: true, preview: true }
  }
};

const CURRENT_ROLE_KEY = "bra_prototype_role";

function getCurrentRole() {
  try {
    const stored = localStorage.getItem(CURRENT_ROLE_KEY);
    if (stored && ROLES[stored]) return stored;
  } catch (_) {}
  return null;
}

function setCurrentRole(roleKey) {
  localStorage.setItem(CURRENT_ROLE_KEY, roleKey);
}

function clearRole() {
  localStorage.removeItem(CURRENT_ROLE_KEY);
}

function canAccessPage(roleKey, pageId) {
  const role = ROLES[roleKey];
  if (!role) return false;
  return role.pages.indexOf(pageId) !== -1;
}

function getPermission(roleKey, section) {
  const role = ROLES[roleKey];
  if (!role) return null;
  return role[section] || null;
}

function renderRoleSelector(containerId, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const current = getCurrentRole();
  const options = Object.entries(ROLES).map(([key, role]) => {
    const selected = current === key ? "selected" : "";
    return `<option value="${key}" ${selected}>${role.label}</option>`;
  }).join("");
  container.innerHTML = `
    <label class="text-xs font-bold text-[#454845] uppercase tracking-wider mb-1 block">Aktor / Role</label>
    <select id="roleSelect" class="w-full px-3 py-1.5 text-xs rounded border border-[#caced0] bg-white text-black focus:outline-none focus:border-[#00754a]">
      ${options}
    </select>
  `;
  const select = document.getElementById("roleSelect");
  select.addEventListener("change", function () {
    setCurrentRole(this.value);
    if (typeof onChange === "function") onChange(this.value);
    else location.reload();
  });
}

function requireRole(allowedRoles, redirectPage) {
  const current = getCurrentRole();
  if (!current) {
    if (redirectPage) location.href = redirectPage;
    return false;
  }
  if (allowedRoles.indexOf(current) === -1) {
    if (redirectPage) location.href = redirectPage;
    return false;
  }
  return true;
}

window.RoleAuth = {
  ROLES,
  getCurrentRole,
  setCurrentRole,
  clearRole,
  canAccessPage,
  getPermission,
  renderRoleSelector,
  requireRole
};
