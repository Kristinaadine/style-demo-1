/* ==========================================================================
   BRA Running Style — hash router
   ========================================================================== */

(function () {
  "use strict";

  const K = window.K;

  const railEl = document.getElementById("rail");
  const topbarEl = document.getElementById("topbar");
  const viewEl = document.getElementById("view");

  function routeInfo() {
    const raw = (window.location.hash || "#/tindak-lanjut").replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean);
    return { route: parts[0] || "tindak-lanjut", id: parts[1] || null };
  }

  function render() {
    const info = routeInfo();
    railEl.innerHTML = K.renderRail(info.route);
    topbarEl.innerHTML = K.renderTopbar(info.route, { id: info.id });

    const view = K.views[info.route];
    viewEl.innerHTML = view
      ? view(info)
      : '<div class="panel"><div class="empty">Halaman ini belum tersedia.</div></div>';

    document.title = "BRA · " + K.navTitle(info.route, info);
    document.querySelector(".app").classList.remove("is-nav-open");
  }

  K.render = render;
  K.routeInfo = routeInfo;

  window.addEventListener("hashchange", render);

  window.BOOT = function boot() {
    window.BRA.load();
    if (!window.location.hash) window.location.hash = "#/tindak-lanjut";
    render();
  };
})();
