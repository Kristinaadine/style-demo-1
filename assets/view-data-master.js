/* ==========================================================================
   BRA Running Style — searchable and editable master index
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const K = window.K;

  function option(value, selected, label) {
    return '<option value="' + K.esc(value) + '"' + (value === selected ? " selected" : "") +
      ">" + K.esc(label == null ? value : label) + "</option>";
  }

  function selectOptions(values, selected, firstLabel) {
    return option("", selected, firstLabel) + values.map(function (value) {
      return option(value, selected);
    }).join("");
  }

  function filterHeader(key, label, highlighted, options) {
    if (options && options.length === 0) return '<th class="master-column' + (highlighted ? " master-column--highlight" : "") + '"><div class="master-column__content"><span>' + label + "</span></div></th>";
    const active = Boolean(K.ui.masterFilters[key]);
    const control = options
      ? '<select data-filter="masterFilter.' + key + '" aria-label="Filter ' + label + '"><option value="">Semua</option>' +
        options.map(function (value) {
          return '<option value="' + K.esc(value) + '"' + (K.ui.masterFilters[key] === value ? " selected" : "") + ">" + K.esc(value) + "</option>";
        }).join("") + "</select>"
      : '<input type="search" data-filter="masterFilter.' + key + '" value="' +
        K.esc(K.ui.masterFilters[key] || "") + '" placeholder="Ketik nilai…" aria-label="Filter ' + label + '">';
    return '<th class="master-column' + (highlighted ? " master-column--highlight" : "") + '">' +
      '<div class="master-column__content"><span>' + label + "</span>" +
      '<details class="master-column-filter' + (active ? " is-active" : "") + '" data-master-column-filter="' +
        key + '"' + (K.ui.masterFilterOpen === key ? " open" : "") + ">" +
        '<summary aria-label="Filter ' + label + '" title="Filter ' + label + '"></summary>' +
        '<div class="master-column-filter__menu"><label>Filter ' + label + control +
        "</label></div></details></div></th>";
  }

  function dataField(style, field, value, type, extra) {
    const attrs = extra || "";
    return '<input class="master-cell-input" type="' + type + '" value="' + K.esc(value) +
      '" data-style-id="' + K.esc(style.id) + '" data-master-field="' + field + '"' +
      attrs + ">";
  }

  function viewDataMaster() {
    const batches = B.get().masterImportBatches || [];
    if (!K.ui.masterImportId) K.ui.masterImportId = "current";
    if (!K.ui.masterImportId) K.ui.masterImportId = "current";
    const activeBatch = K.ui.masterImportId === "current"
      ? null
      : (batches.find(function (batch) { return batch.id === K.ui.masterImportId; }) || null);
    if (K.ui.masterImportId !== "current" && !activeBatch) {
      K.ui.masterImportId = "current";
    }
    const styles = activeBatch && Array.isArray(activeBatch.styles)
      ? activeBatch.styles
      : B.get().styles;
    const duplicateGroups = styles.reduce(function (groups, style) {
      const key = String(style.id || "").trim().replace(/\s+/g, " ").toLowerCase();
      if (!key) return groups;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(style);
      return groups;
    }, new Map());
    const duplicateStyles = Array.from(duplicateGroups.entries()).filter(function (entry) { return entry[1].length > 1; });
    const buyers = B.WORKSPACE_BUYERS.concat(styles.map(function (style) {
      return style.buyer;
    }).filter(function (buyer, index, list) {
      return buyer && buyer !== "ADIDAS" && B.WORKSPACE_BUYERS.indexOf(buyer) === -1 && list.indexOf(buyer) === index;
    }).sort());
    const filtered = styles.filter(function (style) {
      const template = activeBatch ? null : B.latestFolderFile(style.id, "Template Photo Running Style");
      const photo = activeBatch ? null : B.latestFolderFile(style.id, "Foto Fitting");
      const values = {
        product: style.id + " " + style.desc,
        week: style.week,
        opd: style.opd,
        deliveryDate: style.deliveryDate,
        buyer: style.buyer,
        brand: style.brand,
        productGroup: style.productGroupMaster,
        nb: style.nb,
        pic: style.picMaster,
        template: (style.templatePhotoStatus === "ready" || (style.templatePhotoStatus !== "missing" && template) ? "Sudah Ada" : "Belum Ada"),
        photo: (Object.prototype.hasOwnProperty.call(style, "photoUploaded") ? style.photoUploaded : Boolean(photo)) ? "Sudah diunggah " + (style.photoDate || (photo ? K.formatDate(photo.uploadedAt) : "")) : "Belum diunggah " + (style.photoDate || ""),
        smv: style.smv,
        remark: style.remark
      };
      return Object.keys(K.ui.masterFilters).every(function (key) {
        const query = (K.ui.masterFilters[key] || "").trim().toLowerCase();
        return !query || String(values[key] == null ? "" : values[key]).toLowerCase().indexOf(query) !== -1;
      });
    }).sort(function (a, b) {
      return a.buyer.localeCompare(b.buyer) || a.id.localeCompare(b.id);
    });

    const snapshotReadonly = activeBatch ? " disabled" : "";
    const rows = filtered.map(function (style) {
      const template = activeBatch ? null : B.latestFolderFile(style.id, "Template Photo Running Style");
      const photo = activeBatch ? null : B.latestFolderFile(style.id, "Foto Fitting");
      const manualTemplateStatus = style.templatePhotoStatus === "ready" || style.templatePhotoStatus === "missing"
        ? style.templatePhotoStatus
        : (template ? "ready" : "missing");
      const templateLabel = template ? K.formatDate(template.uploadedAt) : "Belum dilengkapi";
      const photoDate = typeof style.photoDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(style.photoDate)
        ? style.photoDate
        : (photo && photo.uploadedAt ? String(photo.uploadedAt).slice(0, 10) : "");
      const photoUploaded = style.photoUploaded === true || (!activeBatch && Boolean(photo));
      const buyerFolder = encodeURIComponent(style.id);
      return "<tr>" +
        '<td class="master-product"><a class="master-product__link mono" href="#/folder-style/' +
          buyerFolder + '">' + K.esc(style.id) + "</a>" +
          dataField(style, "desc", style.desc, "text", ' placeholder="Nama product / style"' + snapshotReadonly) + "</td>" +
        "<td>" + dataField(style, "week", style.week, "text", ' placeholder="WK 11-14"' + snapshotReadonly) + "</td>" +
        "<td>" + dataField(style, "opd", style.opd, "date", snapshotReadonly) + "</td>" +
        "<td>" + dataField(style, "deliveryDate", style.deliveryDate, "date", snapshotReadonly) + "</td>" +
        "<td><select class=\"master-cell-input\" data-style-id=\"" + K.esc(style.id) +
          '" data-master-field="buyer"' + snapshotReadonly + '>' + buyers.map(function (buyer) {
            return option(buyer, style.buyer);
          }).join("") + "</select></td>" +
        "<td><select class=\"master-cell-input\" data-style-id=\"" + K.esc(style.id) +
          '" data-master-field="productGroupMaster"' + snapshotReadonly + '>' +
          option("", style.productGroupMaster, "") +
          B.WORKSPACE_PRODUCT_GROUPS.map(function (group) { return option(group, style.productGroupMaster); }).join("") +
          "</select></td>" +
        "<td><select class=\"master-cell-input\" data-style-id=\"" + K.esc(style.id) +
          '" data-master-field="nb"' + snapshotReadonly + '>' +
          option("", style.nb, "") +
          option("NB", style.nb) + option("B", style.nb) +
          "</select></td>" +
        "<td>" + dataField(style, "picMaster", style.picMaster, "text", snapshotReadonly) + "</td>" +
        '<td><select class="master-cell-input master-template-status ' + (manualTemplateStatus === "ready" ? "master-template-status--ready" : "master-template-status--missing") + '" data-style-id="' + K.esc(style.id) +
          '" data-master-field="templatePhotoStatus"' + snapshotReadonly + ' title="Status template foto" aria-label="Status template foto untuk ' + K.esc(style.id) + '">' +
          '<option value="ready"' + (manualTemplateStatus === "ready" ? " selected" : "") + '>Sudah Ada</option>' +
          '<option value="missing"' + (manualTemplateStatus === "missing" ? " selected" : "") + '>Belum Ada</option>' +
          '</select></td>' +
        '<td><div class="master-photo-date-control"><input class="master-cell-input master-photo-date" type="date" value="' + K.esc(photoDate) +
          '" data-style-id="' + K.esc(style.id) + '" data-master-field="photoDate" aria-label="Photo date untuk ' + K.esc(style.id) + '"' + snapshotReadonly + '>' +
          '<label class="master-photo-uploaded" title="Foto sudah diunggah"><input type="checkbox" data-master-photo-uploaded="true" data-style-id="' + K.esc(style.id) + '" aria-label="' + (photoUploaded ? "Foto sudah diunggah" : "Foto belum diunggah") + '"' +
          snapshotReadonly + (photoUploaded ? " checked" : "") + '><span aria-hidden="true"></span></label></div></td>' +
        "<td>" + dataField(style, "smv", style.smv, "number", ' min="0" step="0.01" placeholder="Menit"' + snapshotReadonly) + "</td>" +
        "<td>" + dataField(style, "remark", style.remark, "text", ' placeholder="Tambah keterangan"' + snapshotReadonly) + "</td>" +
        '<td><div class="master-row-actions"><button type="button" class="icon-btn icon-btn--danger" data-delete-style-row="' + K.esc(style.id) + '"' + snapshotReadonly + ' title="Hapus style ini"><i class="ti ti-trash"></i><span class="sr-only">Hapus</span></button></div></td>' +
      "</tr>";
    }).join("");

    const batchNameCounts = new Map();
    batches.forEach(function (batch) {
      const name = String(batch.fileName || "Import Data Master").trim().toLowerCase();
      batchNameCounts.set(name, (batchNameCounts.get(name) || 0) + 1);
    });
    const duplicateBatchNames = Array.from(batchNameCounts.entries()).filter(function (entry) { return entry[1] > 1; });
    const batchCards = batches.map(function (batch) {
      const selected = activeBatch && activeBatch.id === batch.id;
      const styleCount = Array.isArray(batch.styles) ? batch.styles.length : 0;
      const normalizedName = String(batch.fileName || "Import Data Master").trim().toLowerCase();
      const duplicateCount = batchNameCounts.get(normalizedName) || 0;
      const duplicateClass = duplicateCount > 1 ? " is-duplicate" : "";
      const duplicateBadge = duplicateCount > 1 ? '<small class="master-duplicate-badge">Duplikat · muncul ' + duplicateCount + ' kali</small>' : "";
      return '<div class="master-import-folder-wrap' + duplicateClass + (selected ? ' is-active' : '') + '">' +
        '<button type="button" class="master-import-folder' + duplicateClass + (selected ? ' is-active' : '') + '" data-master-import-batch="' + K.esc(batch.id) + '">' +
        '<i class="ti ti-folder" aria-hidden="true"></i><span><strong>' + K.esc(batch.fileName || "Import Data Master") + '</strong>' + duplicateBadge +
        '<small>' + K.esc(K.formatDate(batch.importedAt)) + ' · ' + styleCount + ' style</small></span></button>' +
        '<div class="master-import-folder-actions"><button type="button" class="icon-btn" data-rename-master-import="' + K.esc(batch.id) + '" title="Edit nama folder"><i class="ti ti-pencil"></i><span class="sr-only">Edit</span></button>' +
        '<button type="button" class="icon-btn icon-btn--danger" data-delete-master-import="' + K.esc(batch.id) + '" title="Hapus folder"><i class="ti ti-trash"></i><span class="sr-only">Hapus</span></button></div></div>';
    }).join("");
    const activeCard = '<div class="master-import-folder-wrap' + (!activeBatch ? " is-active" : "") + '">' +
      '<button type="button" class="master-import-folder' + (!activeBatch ? " is-active" : "") + '" data-master-current-batch>' +
      '<i class="ti ti-table" aria-hidden="true"></i><span><strong>Data Aktif</strong>' +
      '<small>' + (B.get().styles || []).length + ' style dapat diedit</small></span></button></div>';
    const duplicateWarning = duplicateBatchNames.length
      ? '<div class="master-duplicate-warning"><i class="ti ti-alert-triangle" aria-hidden="true"></i><div><strong>Peringatan: ditemukan folder atau snapshot import ganda.</strong><span>' + duplicateBatchNames.map(function (entry) { const sample = batches.find(function (batch) { return String(batch.fileName || "Import Data Master").trim().toLowerCase() === entry[0]; }); return K.esc(sample && sample.fileName ? sample.fileName : "File tidak diketahui") + " muncul " + entry[1] + " kali"; }).join("; ") + '. Kemungkinan file sudah diklik Import ke Data Master lebih dari sekali.</span></div></div>'
      : "";
    const batchPanel = batches.length
      ? '<section class="panel master-import-folders"><div class="master-import-folders__head"><div><h2 class="section-title">Folder Import Data Master</h2><p class="section-note">Pilih "Data Aktif" untuk mengedit, atau pilih snapshot untuk melihat data lama secara hanya-baca.</p></div></div>' + duplicateWarning + '<div class="master-import-folders__list">' + activeCard + batchCards + '</div></section>'
      : '<section class="panel master-import-folders"><div class="master-import-folders__head"><div><h2 class="section-title">Folder Import Data Master</h2><p class="section-note">Belum ada snapshot. Folder akan otomatis muncul setelah file diimport dari Planner atau Data Master.</p></div></div><div class="master-import-folders__list">' + activeCard + '</div></section>';

    return '<div class="page-head"><div>' +
      '<h1 class="page-title">Data Master</h1>' +
      '<p class="page-sub">Cari dan perbarui informasi style, jadwal, PIC, status template, foto fitting, dan keterangan.</p>' +
      "</div><div class=\"page-actions\">" +
        '<a class="btn" href="#/daftar-style">Buka folder style</a>' +
        '<button type="button" class="btn" data-master-import-excel title="Import data style dari file Excel atau CSV">' +
          '<i class="ti ti-upload" aria-hidden="true"></i>Import Excel</button>' +
        '<input hidden id="master-import-file" type="file" accept=".xlsx,.xls,.csv" data-master-import-file>' +
        '<button type="button" class="btn" data-master-export-excel title="Export semua data ke file Excel">' +
          '<i class="ti ti-file-spreadsheet" aria-hidden="true"></i>Export Excel</button>' +
        '<button type="button" class="btn btn--danger" data-master-reset-styles title="Hapus semua data style untuk import ulang">' +
          '<i class="ti ti-trash" aria-hidden="true"></i>Reset Data</button>' +
      "</div></div>" +
      batchPanel +
      (activeBatch
        ? '<div class="panel workspace-add-panel"><div class="empty"><strong>Mode snapshot hanya-baca</strong><br><span>Gunakan tombol "Data Aktif" untuk menambah atau mengedit data.</span></div></div>'
        : '<details class="panel workspace-add-panel"><summary><i class="ti ti-plus" aria-hidden="true"></i>Tambah style ke Data Master</summary>' +
          '<form class="workspace-form workspace-form--grid" data-workspace-form="add-style">' +
          '<div class="field"><label for="new-product">Article / Product *</label><input id="new-product" name="product" required maxlength="80"></div>' +
          '<div class="field"><label for="new-brand">Brand</label><input id="new-brand" name="brand" maxlength="120" placeholder="Opsional"></div>' +
          '<div class="field"><label for="new-description">Nama product / style</label><input id="new-description" name="description" maxlength="160"></div>' +
          '<div class="field"><label for="new-buyer">Buyer *</label><select id="new-buyer" name="buyer" required>' +
            selectOptions(B.WORKSPACE_BUYERS, "", "Pilih buyer") + "</select></div>" +
          '<div class="field"><label for="new-week">Week</label><input id="new-week" name="week" placeholder="WK 11-14"></div>' +
          '<div class="field"><label for="new-opd">OPD / First receipt</label><input id="new-opd" name="opd" type="date"></div>' +
          '<div class="field"><label for="new-delivery">Delivery Date / Sample</label><input id="new-delivery" name="deliveryDate" type="date"></div>' +
          '<div class="field"><label for="new-group">Product Group</label><select id="new-group" name="productGroupMaster">' +
            selectOptions(B.WORKSPACE_PRODUCT_GROUPS, "", "") + "</select></div>" +
          '<div class="field"><label for="new-nb">NB/B</label><select id="new-nb" name="nb"><option value=""></option><option value="NB">NB</option><option value="B">B</option></select></div>' +
          '<div class="field"><label for="new-pic">PIC PM/MD</label><input id="new-pic" name="picMaster" maxlength="100"></div>' +
          '<div class="field"><label for="new-smv">SMV (menit)</label><input id="new-smv" name="smv" type="number" min="0" step="0.01"></div>' +
          '<div class="field field--wide"><label for="new-remark">Remark / Keterangan</label><input id="new-remark" name="remark" maxlength="500"></div>' +
          '<div class="workspace-form-actions field--wide"><button type="submit" class="btn-primary">Simpan style</button>' +
            '<button type="button" class="btn" data-cancel-add-master-style>Batalkan</button></div>' +
          "</form></details>") +
      '<section class="panel workspace-table-panel' + (activeBatch ? ' master-table-snapshot' : '') + '">' +
        '<div class="panel__head workspace-filter-head"><div><h2 class="section-title">Index running style</h2>' +
          '<p class="section-note master-sync-summary">Menampilkan ' + filtered.length + " dari " + styles.length + " style</p></div></div>" +
        '<div class="table-wrap workspace-table-scroll"><table class="table workspace-master-table">' +
          "<thead><tr>" +
            filterHeader("product", "Product / Article") +
            filterHeader("week", "Week") +
            filterHeader("opd", "OPD") +
            filterHeader("deliveryDate", "Delivery Date") +
            filterHeader("buyer", "Buyer") +
            filterHeader("productGroup", "Product Group", false, B.WORKSPACE_PRODUCT_GROUPS) +
            filterHeader("nb", "NB/B", false, ["NB", "B"]) +
            filterHeader("pic", "PIC PM / MD", false, []) +
            filterHeader("template", "Template Photo Running Style", false) +
            filterHeader("photo", "Photo Date", false) +
            filterHeader("smv", "SMV · menit") +
            filterHeader("remark", "Remark / Keterangan", false) +
            '<th>Aksi</th>' +
          "</tr></thead>" +
          "<tbody>" + (rows || '<tr><td colspan="13" class="empty">Tidak ada style yang cocok dengan filter.</td></tr>') + "</tbody>" +
        "</table></div></section>";
  }

  K.views["data-master"] = viewDataMaster;
})();
