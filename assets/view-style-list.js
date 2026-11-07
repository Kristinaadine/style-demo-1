/* ==========================================================================
   BRA Running Style — buyer-specific style folders and file versions
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const K = window.K;

  const normalizeWeek = function (value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  };

  function viewStyleList(params) {
    const canAdd = K.can ? K.can("canAdd") : true;
    const canUpload = K.can ? K.can("canUpload") : true;
    const canDelete = K.can ? K.can("canDelete") : true;
    const plannerFiles = B.get().plannerFiles || [];
    K.ui.styleListImportId = "current";
    const activeBatch = null;
    const allStyles = B.get().styles;
    const selectedWeekKey = normalizeWeek(K.ui.styleWeek || "");
    const buyers = B.WORKSPACE_BUYERS.concat(allStyles.map(function (style) {
      return style.buyer;
    }).filter(function (buyer, index, list) {
      return buyer && B.WORKSPACE_BUYERS.indexOf(buyer) === -1 && list.indexOf(buyer) === index;
    }).sort());
    const routeStyle = params.id
      ? (activeBatch ? allStyles.find(function (style) { return String(style.id) === String(params.id); }) : B.styleById(params.id))
      : null;
    const snapshotReadonly = !!activeBatch;
    const buyer = routeStyle ? routeStyle.buyer : K.ui.styleBuyer;
    const styles = allStyles.filter(function (style) {
      const matchesBuyer = !buyer || style.buyer === buyer;
      const query = K.ui.styleSearch.trim().toLowerCase();
      const matchesQuery = !query || (style.id + " " + style.desc).toLowerCase().indexOf(query) !== -1;
      const matchesWeek = !selectedWeekKey || normalizeWeek(style.week) === selectedWeekKey;
      return matchesBuyer && matchesQuery && matchesWeek;
    }).sort(function (a, b) { return a.id.localeCompare(b.id); });
    const currentStyle = routeStyle && styles.some(function (style) { return style.id === routeStyle.id; })
      ? routeStyle
      : (styles[0] || null);
    const currentBuyer = currentStyle ? currentStyle.buyer : buyer;
    const allStyleFiles = !snapshotReadonly && currentStyle ? B.styleFiles(currentStyle.id) : [];
    const styleList = styles.map(function (style) {
      const active = currentStyle && style.id === currentStyle.id;
      const folders = snapshotReadonly ? (Array.isArray(style.folders) ? style.folders : [style.id].filter(Boolean)) : B.foldersForStyle(style.id);
      const folderName = folders.indexOf(style.id) !== -1 ? style.id : (folders[0] || "");
      const actions = !snapshotReadonly && folderName
        ? '<div class="style-folder-row-actions">' +
            '<button type="button" class="icon-btn" data-rename-style-folder-root="' + K.esc(folderName) + '" data-style-id="' + K.esc(style.id) + '" title="Rename folder"><i class="ti ti-pencil"></i><span class="sr-only">Rename folder</span></button>' +
            '<button type="button" class="icon-btn icon-btn--danger" data-delete-style-folder-root="' + K.esc(folderName) + '" data-style-id="' + K.esc(style.id) + '" title="Hapus folder"><i class="ti ti-trash"></i><span class="sr-only">Hapus folder</span></button>' +
          '</div>'
        : "";
      return '<div class="style-folder-row' + (active ? " is-active" : "") + '"' +
        ' data-style-row="' + K.esc(style.id) + '">' +
        '<span class="style-folder-row__icon"><i class="ti ti-folder" aria-hidden="true"></i></span>' +
        '<span><strong class="mono">' + K.esc(style.id) + "</strong>" +
        '<small>' + K.esc(style.desc || style.brand || "Nama style belum diisi") + "</small></span>" +
        '<div class="style-folder-row__end">' + actions +
        '<a class="style-folder-arrow" href="#/folder-style/' + encodeURIComponent(style.id) + '">' +
        '<i class="ti ti-chevron-right" aria-hidden="true"></i><span class="sr-only">Buka folder ' + K.esc(style.id) + "</span></a></div></div>";
    }).join("");

    const currentFolders = snapshotReadonly && currentStyle
      ? (Array.isArray(currentStyle.folders) ? currentStyle.folders : [currentStyle.id].filter(Boolean))
      : (currentStyle ? B.foldersForStyle(currentStyle.id) : []);
    const currentAutoFolder = currentFolders.indexOf(currentStyle ? currentStyle.id : "") !== -1;
    const addFileButton = snapshotReadonly ? '<button type="button" class="btn-primary style-add-file-button" disabled title="Snapshot hanya-baca"><i class="ti ti-lock" aria-hidden="true"></i>Hanya-baca</button>' : '<button type="button" class="btn-primary style-add-file-button" data-toggle-style-file-form aria-expanded="false">' +
      '<i class="ti ti-plus" aria-hidden="true"></i>Tambah File</button>'; 
    const autoFolderActions = !snapshotReadonly && currentStyle && currentAutoFolder
      ? '<button type="button" class="icon-btn" data-rename-style-folder-root="' + K.esc(currentStyle.id) + '" data-style-id="' + K.esc(currentStyle.id) + '" title="Rename folder"><i class="ti ti-pencil"></i></button>' +
        '<button type="button" class="icon-btn icon-btn--danger" data-delete-style-folder-root="' + K.esc(currentStyle.id) + '" data-style-id="' + K.esc(currentStyle.id) + '" title="Hapus folder"><i class="ti ti-trash"></i></button>'
      : "";
    const stylePanel = currentStyle
      ? '<div class="style-folder-workspace">' +
          '<div class="folder-content">' +
              '<div class="style-add-file-panel" data-style-file-panel hidden>' +
                '<form class="workspace-form workspace-upload-form" data-workspace-form="style-file">' +
                  '<input type="hidden" name="styleId" value="' + K.esc(currentStyle.id) + '">' +
                  '<input type="hidden" name="folder" value="' + K.esc(currentStyle.id) + '">' +
                  '<div class="field"><label for="style-file">PILIH FILE</label>' +
                    '<input id="style-file" name="file" type="file" required></div>' +
                  '<div class="field"><label for="upload-standard-category">PILIH JENIS GARMENT</label>' +
                    '<select id="upload-standard-category" name="standardCategory" data-standard-category required>' +
                      '<option value="">Pilih jenis garment</option>' +
                      Object.keys(B.STANDARDIZATION_CATEGORIES).map(function (category) {
                        return '<option value="' + K.esc(category) + '">' + K.esc(category) + "</option>";
                      }).join("") + "</select></div>" +
                  '<div class="field"><label for="upload-standard-type">PILIH KATEGORI</label>' +
                    '<select id="upload-standard-type" name="standardType" required>' +
                      '<option value="">Pilih kategori terlebih dahulu</option></select></div>' +
                  '<button type="submit" class="btn-primary"><i class="ti ti-upload"></i>Unggah file</button>' +
                "</form>" +
              "</div>" +
            '<div class="style-auto-folder-card">' +
              '<span class="style-auto-folder-card__icon"><i class="ti ti-folder"></i></span>' +
              '<div><strong class="mono">' + K.esc(currentStyle.id) + '</strong>' +
              '<span>' + allStyleFiles.length + ' file tersimpan dalam folder style</span></div>' +
              '<div class="style-auto-folder-card__actions">' + addFileButton + autoFolderActions +
                '<a class="btn" href="#/folder-style/' + encodeURIComponent(currentStyle.id) + '"><i class="ti ti-folder-open"></i>Buka Folder</a>' +
              '</div></div>' +
          "</div></div>"
      : '<div class="style-folder-empty"><i class="ti ti-folder-off" aria-hidden="true"></i>' +
        "<strong>Belum ada style untuk buyer ini</strong>" +
        "<span>Tambahkan style terlebih dahulu agar folder dan file dapat dibuat.</span>" +
        '<div class="style-folder-empty__actions">' +
          '<a class="btn btn-primary" href="#/data-master"><i class="ti ti-plus" aria-hidden="true"></i>Tambah File</a>' +
          '<a class="btn" href="#/data-master">Buka Data Master</a>' +
        '</div></div>';

    const buyerOptions = '<option value="">Pilih buyer</option>' + buyers.map(function (value) {
      return '<option value="' + K.esc(value) + '">' + K.esc(value) + '</option>';
    }).join("");
    const productGroupOptions = '<option value=""></option>' + B.WORKSPACE_PRODUCT_GROUPS.map(function (value) {
      return '<option value="' + K.esc(value) + '">' + K.esc(value) + '</option>';
    }).join("");
    function isImageRecord(record) {
      const name = String(record.name || "").toLowerCase();
      const type = String(record.type || "").toLowerCase();
      return type.indexOf("image/") === 0 || /\.(png|jpe?g|gif|webp|bmp)$/i.test(name);
    }

    function latestStylePreview(styleId) {
      return B.styleFiles(styleId).filter(isImageRecord).sort(function (a, b) {
        const folderPriority = function (record) {
          const folders = record.folders || [];
          return folders.indexOf("Foto Running Style") !== -1 ? 0 : folders.indexOf("Foto Fitting") !== -1 ? 1 : 2;
        };
        return folderPriority(a) - folderPriority(b) || String(b.uploadedAt || "").localeCompare(String(a.uploadedAt || ""));
      })[0] || null;
    }

    const tableRows = styles.map(function (style) {
      const fileCount = snapshotReadonly ? 0 : B.styleFiles(style.id).length;
      const preview = snapshotReadonly ? null : latestStylePreview(style.id);
      const previewCell = snapshotReadonly
        ? '<div class="style-preview-wrap"><span class="style-preview-button" title="File snapshot tidak menyimpan foto aktif"><span><i class="ti ti-lock"></i><small>Snapshot</small></span></span></div>'
        : preview
          ? '<div class="style-preview-wrap"><button type="button" class="style-preview-button" data-preview-kind="style" data-blob-id="' + K.esc(preview.blobId) + '" data-file-name="' + K.esc(preview.name) + '" data-file-type="' + K.esc(preview.type) + '" title="Preview foto running style"><img data-style-thumbnail data-thumb-blob-id="' + K.esc(preview.previewBlobId || "") + '" data-full-blob-id="' + K.esc(preview.blobId) + '" alt="Foto ' + K.esc(style.id) + '"><span class="style-preview-placeholder"><i class="ti ti-photo"></i></span></button><label class="style-preview-replace" title="Ganti foto running style"><input hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" data-style-preview-replace data-style-id="' + K.esc(style.id) + '"><i class="ti ti-refresh"></i></label></div>'
          : '<label class="style-preview-button style-preview-button--upload" title="Upload foto running style"><input hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" data-style-preview-upload data-style-id="' + K.esc(style.id) + '"><span><i class="ti ti-photo-plus"></i><small>Upload</small></span></label>';
      return '<tr>' +
        '<td class="style-preview-cell">' + previewCell + '</td>' +
        '<td><a class="style-number-link mono" href="#/folder-style/' + encodeURIComponent(style.id) + '" title="Buka folder Style ' + K.esc(style.id) + '"><i class="ti ti-folder-open" aria-hidden="true"></i><span>' + K.esc(style.id) + '</span></a></td>' +
        '<td><input class="master-cell-input" data-style-id="' + K.esc(style.id) + '" data-master-field="desc" value="' + K.esc(style.desc || '') + '" placeholder="Nama style"' + (snapshotReadonly ? ' disabled' : '') + '></td>' +
        '<td><select class="master-cell-input" data-style-id="' + K.esc(style.id) + '" data-master-field="buyer"' + (snapshotReadonly ? ' disabled' : '') + '>' + buyers.map(function (value) {
          return '<option value="' + K.esc(value) + '"' + (value === style.buyer ? ' selected' : '') + '>' + K.esc(value) + '</option>';
        }).join('') + '</select></td>' +
        '<td><input class="master-cell-input" data-style-id="' + K.esc(style.id) + '" data-master-field="picMaster" value="' + K.esc(style.picMaster || '') + '" placeholder="PIC"' + (snapshotReadonly ? ' disabled' : '') + '></td>' +
        '<td><input class="master-cell-input master-cell-input--narrow" type="number" min="0" step="0.01" data-style-id="' + K.esc(style.id) + '" data-master-field="smv" value="' + K.esc(style.smv || '') + '"' + (snapshotReadonly ? ' disabled' : '') + '></td>' +
        '<td><input class="master-cell-input" data-style-id="' + K.esc(style.id) + '" data-master-field="remark" value="' + K.esc(style.remark || '') + '" placeholder="Keterangan"' + (snapshotReadonly ? ' disabled' : '') + '></td>' +
        '<td><a class="btn" href="#/folder-style/' + encodeURIComponent(style.id) + '"><i class="ti ti-folder-open"></i>Buka <span class="hint">' + fileCount + '</span></a></td>' +
        (canDelete ? ('<td><div class="master-row-actions"><button type="button" class="icon-btn icon-btn--danger" data-delete-style-row="' + K.esc(style.id) + '" title="Hapus"' + (snapshotReadonly ? ' disabled' : '') + '><i class="ti ti-trash"></i><span class="sr-only">Hapus</span></button></div></td>') : '') +
      '</tr>';
    }).join("");

    const importPanel = snapshotReadonly ? '<div class="panel style-index-add-panel"><div class="empty"><strong>Mode snapshot hanya-baca</strong><br><span>Pilih "Data Aktif" untuk mengubah atau menambah style.</span></div></div>' : '<details class="panel style-index-add-panel"><summary><i class="ti ti-plus" aria-hidden="true"></i>Tambah / Upload Data Style</summary>' +
      '<div class="style-index-add-grid"><button type="button" class="style-index-close" data-close-style-index aria-label="Tutup form"><i class="ti ti-x"></i></button>' +
      '<section class="style-index-entry-card"><div class="style-index-entry-card__head"><i class="ti ti-edit"></i><div><strong>Isi Manual</strong><span>Tambah satu style ke tabel master</span></div></div>' +
      '<form class="workspace-form workspace-form--grid" data-workspace-form="add-style">' +
      '<div class="field"><label for="style-index-product">Article / Product *</label><input id="style-index-product" name="product" required maxlength="80"></div>' +
      '<div class="field"><label for="style-index-buyer">Buyer *</label><select id="style-index-buyer" name="buyer" required>' + buyerOptions + '</select></div>' +
      '<div class="field"><label for="style-index-description">Nama style</label><input id="style-index-description" name="description" maxlength="160"></div>' +
      '<div class="field"><label for="style-index-week">Week</label><input id="style-index-week" name="week" placeholder="WK 11-14"></div>' +
      '<div class="field"><label for="style-index-opd">OPD</label><input id="style-index-opd" name="opd" type="date"></div>' +
      '<div class="field"><label for="style-index-delivery">Delivery</label><input id="style-index-delivery" name="deliveryDate" type="date"></div>' +
      '<div class="field"><label for="style-index-group">Product Group</label><select id="style-index-group" name="productGroupMaster">' + productGroupOptions + '</select></div>' +
      '<div class="field"><label for="style-index-nb">NB/B</label><select id="style-index-nb" name="nb"><option value=""></option><option>NB</option><option>B</option></select></div>' +
      '<div class="field"><label for="style-index-pic">PIC</label><input id="style-index-pic" name="picMaster"></div>' +
      '<div class="field"><label for="style-index-smv">SMV</label><input id="style-index-smv" name="smv" type="number" min="0" step="0.01"></div>' +
      '<div class="field field--wide"><label for="style-index-remark">Remark</label><input id="style-index-remark" name="remark"></div>' +
      '<button type="submit" class="btn-primary"><i class="ti ti-plus"></i>Simpan Style</button></form></section>' +
      '</div></details>';

    const plannerFolders = new Map();
    plannerFiles.forEach(function (record) {
      const week = String(record.week || "Tanpa WK").trim() || "Tanpa WK";
      if (!plannerFolders.has(week)) {
        plannerFolders.set(week, { week: week, files: [], importedAt: record.receivedAt });
      }
      const folder = plannerFolders.get(week);
      folder.files.push(record);
      if (!folder.importedAt || String(record.receivedAt || "") > String(folder.importedAt || "")) {
        folder.importedAt = record.receivedAt;
      }
    });
    const plannerCards = Array.from(plannerFolders.values()).map(function (folder) {
      const selected = normalizeWeek(folder.week) === selectedWeekKey;
      return '<div class="master-import-folder-wrap"><button type="button" class="master-import-folder' + (selected ? ' is-active' : '') + '" data-style-week="' + K.esc(folder.week) + '" aria-pressed="' + (selected ? 'true' : 'false') + '"><i class="ti ti-folder" aria-hidden="true"></i><span><strong>' +
        K.esc(folder.week) + '</strong><small>' + K.esc(K.formatDate(folder.importedAt)) + ' · ' + folder.files.length + ' file Planner</small></span></button></div>';
    }).join("");
    const selectedWeekLabel = K.ui.styleWeek ? '<button type="button" class="btn" data-style-week-clear><i class="ti ti-x"></i>Tampilkan semua Week</button>' : "";
    const folderPanel = '<section class="panel master-import-folders"><div class="master-import-folders__head"><div><h2 class="section-title">Folder Week / WK</h2><p class="section-note">Menampilkan folder berdasarkan minggu dari file yang sudah diunggah di Planner.</p></div>' + selectedWeekLabel + '</div><div class="master-import-folders__list">' +
      (plannerCards || '<div class="empty">Belum ada file Planner.</div>') + '</div></section>';

    return '<div class="page-head"><div>' +
      '<h1 class="page-title">Daftar Style</h1>' +
      '<p class="page-sub">Data Style dapat diisi manual dan diedit langsung pada tabel. Klik nama style untuk membuka folder.</p>' +
      '</div><div class="page-actions"><span class="hint">' + styles.length + ' style</span></div></div>' +
      '<div class="style-index-toolbar">' +
        '<label class="search style-index-search"><i class="ti ti-search"></i><input type="search" data-filter="styleSearch" value="' + K.esc(K.ui.styleSearch) + '" placeholder="Cari buyer, article, atau nama style"></label>' +
        '<select class="select" data-filter="styleBuyer" aria-label="Filter buyer" title="Filter per Buyer">' +
          '<option value="">Semua Buyer</option>' +
          buyers.map(function (b) {
            return '<option value="' + K.esc(b) + '"' + (K.ui.styleBuyer === b ? ' selected' : '') + '>' + K.esc(b) + '</option>';
          }).join('') +
        '</select>' +
        (canUpload ? ('<button type="button" class="btn style-index-upload-button" data-style-index-upload>' +
          '<i class="ti ti-upload" aria-hidden="true"></i><span>Upload Index</span></button>' +
          '<input hidden id="style-index-file" name="file" data-style-index-file type="file" accept=".xlsx,.xls,.csv" tabindex="-1">') : '') +
        (canAdd ? importPanel.replace('<details class="panel style-index-add-panel"><summary><i class="ti ti-plus" aria-hidden="true"></i>Tambah / Upload Data Style</summary>', '<details class="style-index-add-panel"><summary class="btn-primary style-index-add-button"><i class="ti ti-plus" aria-hidden="true"></i><span>Tambah Style</span><i class="ti ti-chevron-down style-index-add-chevron" aria-hidden="true"></i></summary>') : '') +
      '</div>' +
      folderPanel +
      '<section class="panel style-index-panel"><div class="table-wrap workspace-table-scroll"><table class="table workspace-master-table"><thead><tr>' +
      '<th>Preview Foto</th><th>Article / Style</th><th>Nama Style</th><th>Buyer</th><th>PIC</th><th>SMV</th><th>Remark</th><th>Folder</th>' + (canDelete ? '<th>Aksi</th>' : '') +
      '</tr></thead><tbody>' + (tableRows || '<tr><td colspan="9" class="empty">Belum ada data style. Tambahkan atau upload index running style.</td></tr>') + '</tbody></table></div></section>';
  }

  K.views["daftar-style"] = viewStyleList;
})();
