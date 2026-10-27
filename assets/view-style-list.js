/* ==========================================================================
   BRA Running Style — buyer-specific style folders and file versions
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const K = window.K;

  function viewStyleList(params) {
    const allStyles = B.get().styles;
    const buyers = B.WORKSPACE_BUYERS.concat(allStyles.map(function (style) {
      return style.buyer;
    }).filter(function (buyer, index, list) {
      return buyer && B.WORKSPACE_BUYERS.indexOf(buyer) === -1 && list.indexOf(buyer) === index;
    }).sort());
    const routeStyle = params.id ? B.styleById(params.id) : null;
    const buyer = routeStyle ? routeStyle.buyer : K.ui.styleBuyer;
    const styles = allStyles.filter(function (style) {
      const matchesBuyer = !buyer || style.buyer === buyer;
      const query = K.ui.styleSearch.trim().toLowerCase();
      const matchesQuery = !query || (style.id + " " + style.desc + " " + style.brand).toLowerCase().indexOf(query) !== -1;
      return matchesBuyer && matchesQuery;
    }).sort(function (a, b) { return a.id.localeCompare(b.id); });
    const currentStyle = routeStyle && styles.some(function (style) { return style.id === routeStyle.id; })
      ? routeStyle
      : (styles[0] || null);
    const currentBuyer = currentStyle ? currentStyle.buyer : buyer;
    const folders = currentStyle ? B.foldersForBuyer(currentStyle.buyer) : [];
    if (currentStyle && folders.indexOf(K.ui.styleFolder) === -1) K.ui.styleFolder = folders[0] || "";
    const activeFolder = currentStyle ? K.ui.styleFolder : "";

    const styleList = styles.map(function (style) {
      const active = currentStyle && style.id === currentStyle.id;
      return '<a class="style-folder-row' + (active ? " is-active" : "") +
        '" href="#/daftar-style/' + encodeURIComponent(style.id) + '">' +
        '<span class="style-folder-row__icon"><i class="ti ti-folder" aria-hidden="true"></i></span>' +
        '<span><strong class="mono">' + K.esc(style.id) + "</strong>" +
        '<small>' + K.esc(style.desc || style.brand || "Nama style belum diisi") + "</small></span>" +
        '<i class="ti ti-chevron-right" aria-hidden="true"></i></a>';
    }).join("");

    const folderTabs = folders.map(function (folder) {
      const count = currentStyle ? B.styleFiles(currentStyle.id, folder).length : 0;
      return '<button type="button" class="folder-tab' + (activeFolder === folder ? " is-active" : "") +
        '" data-folder="' + K.esc(folder) + '"' +
        (currentStyle ? "" : " disabled") + ">" +
        '<i class="ti ti-folder" aria-hidden="true"></i><span>' + K.esc(folder) + "</span>" +
        '<span class="folder-tab__count">' + count + "</span></button>";
    }).join("");

    const files = currentStyle && activeFolder ? B.styleFiles(currentStyle.id, activeFolder) : [];
    const fileRows = files.map(function (record) {
      return "<tr>" +
        "<td><div class=\"strong\">" + K.esc(record.name) + "</div>" +
          '<div class="cell-sub">' + K.esc(record.type) + "</div></td>" +
        '<td class="mono">V' + K.esc(record.version) + "</td>" +
        '<td class="nowrap">' + K.esc(K.formatDate(record.uploadedAt)) + "</td>" +
        "<td>" + K.esc(record.uploadedBy) + "</td>" +
        '<td class="mono nowrap">' + K.esc(K.formatBytes(record.size)) + "</td>" +
        '<td><div class="file-folder-links">' + record.folders.map(function (folder) {
          return '<span class="chip">' + K.esc(folder) + "</span>";
        }).join("") + "</div></td>" +
        '<td><button type="button" class="btn" data-download-kind="style"' +
          ' data-blob-id="' + K.esc(record.blobId) + '"' +
          ' data-file-name="' + K.esc(record.name) + '"' +
          ' data-file-type="' + K.esc(record.type) + '">' +
          '<i class="ti ti-download" aria-hidden="true"></i>Unduh</button></td>' +
      "</tr>";
    }).join("");

    const stylePanel = currentStyle
      ? '<div class="style-folder-workspace">' +
          '<div class="style-folder-heading"><div><p class="eyebrow">' + K.esc(currentStyle.buyer) +
            " / " + K.esc(currentStyle.brand) + "</p>" +
            '<h2 class="mono">' + K.esc(currentStyle.id) + "</h2>" +
            '<p class="hint">' + K.esc(currentStyle.desc || "Nama style belum diisi") + "</p></div>" +
            '<span class="chip">' + K.esc(currentStyle.picMaster || "PIC belum diisi") + "</span></div>" +
          '<div class="folder-browser"><aside class="folder-list" aria-label="Folder fungsi">' +
            '<div class="folder-list__head"><strong>Folder kebutuhan</strong><span class="hint">khusus buyer ini</span></div>' +
            folderTabs +
            '<details class="folder-add"><summary><i class="ti ti-folder-plus" aria-hidden="true"></i>Tambah folder</summary>' +
              '<form class="workspace-form" data-workspace-form="add-folder">' +
                '<input type="hidden" name="buyer" value="' + K.esc(currentStyle.buyer) + '">' +
                '<div class="field"><label for="new-folder-name">Nama folder</label>' +
                  '<input id="new-folder-name" name="name" maxlength="60" required></div>' +
                '<button type="submit" class="btn-primary">Simpan folder</button>' +
              "</form></details>" +
          "</aside>" +
          '<section class="folder-content"><div class="folder-content__head"><div>' +
              '<p class="eyebrow">Folder aktif</p><h3>' + K.esc(activeFolder) + "</h3></div>" +
              '<span class="hint">' + files.length + " versi file" + (files.length === 1 ? "" : "") + "</span></div>" +
            '<form class="workspace-form workspace-upload-form" data-workspace-form="style-file">' +
              '<input type="hidden" name="styleId" value="' + K.esc(currentStyle.id) + '">' +
              '<input type="hidden" name="folder" value="' + K.esc(activeFolder) + '">' +
              '<div class="field"><label for="style-file">Pilih file untuk folder “' + K.esc(activeFolder) + "”</label>" +
                '<input id="style-file" name="file" type="file" required></div>' +
              '<details class="folder-link-options"><summary>Tautkan file ke folder lain (tanpa menggandakan file)</summary>' +
                '<div class="folder-link-options__list">' + folders.filter(function (folder) {
                  return folder !== activeFolder;
                }).map(function (folder) {
                  return '<label><input type="checkbox" name="alsoFolder" value="' + K.esc(folder) + '">' +
                    "<span>" + K.esc(folder) + "</span></label>";
                }).join("") + "</div></details>" +
              '<button type="submit" class="btn-primary"><i class="ti ti-upload"></i>Unggah file</button>' +
            "</form>" +
            '<div class="table-wrap"><table class="table"><thead><tr><th>Nama file</th><th>Versi</th>' +
              "<th>Diunggah</th><th>PIC</th><th>Ukuran</th><th>Dirujuk di folder</th><th>Aksi</th></tr></thead>" +
              "<tbody>" + (fileRows || '<tr><td colspan="7" class="empty">Belum ada file di folder ini. Unggah file untuk menambahkan versi pertama.</td></tr>') + "</tbody>" +
            "</table></div>" +
          "</section></div></div>"
      : '<div class="style-folder-empty"><i class="ti ti-folder-off" aria-hidden="true"></i>' +
        "<strong>Pilih atau tambahkan style</strong>" +
        "<span>Gunakan Data Master untuk membuat article/style baru.</span>" +
        '<a class="btn" href="#/data-master">Buka Data Master</a></div>';

    return '<div class="page-head"><div>' +
      '<h1 class="page-title">Daftar Style</h1>' +
      '<p class="page-sub">Pilih buyer dan article untuk membuka folder kebutuhan, mengunggah file, serta melihat riwayat versi.</p>' +
      "</div><div class=\"page-actions\"><a class=\"btn\" href=\"#/data-master\">Buka Data Master</a></div></div>" +
      '<section class="panel style-browser-panel">' +
        '<div class="style-browser-filters">' +
          '<label class="field"><span class="field__label">Buyer</span><select data-filter-select="styleBuyer">' +
            '<option value="">Semua buyer</option>' + buyers.map(function (value) {
              return '<option value="' + K.esc(value) + '"' +
                (value === currentBuyer ? " selected" : "") + ">" + K.esc(value) + "</option>";
            }).join("") + "</select></label>" +
          '<label class="search"><i class="ti ti-search" aria-hidden="true"></i>' +
            '<input type="search" data-filter="styleSearch" value="' + K.esc(K.ui.styleSearch) +
            '" placeholder="Cari article atau nama style" aria-label="Cari style"></label>' +
          '<span class="hint">' + styles.length + " style</span></div>" +
        '<div class="style-browser-layout"><aside class="style-folder-nav" aria-label="Daftar article">' +
          '<div class="style-folder-nav__head"><strong>Article / Style</strong><span>' + styles.length + "</span></div>" +
          (styleList || '<p class="empty">Belum ada style untuk filter ini.</p>') +
        "</aside>" + stylePanel + "</div></section>";
  }

  K.views["daftar-style"] = viewStyleList;
})();
