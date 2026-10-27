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

  function filterHeader(key, label, highlighted) {
    const active = Boolean(K.ui.masterFilters[key]);
    return '<th class="master-column' + (highlighted ? " master-column--highlight" : "") + '">' +
      '<div class="master-column__content"><span>' + label + "</span>" +
      '<details class="master-column-filter' + (active ? " is-active" : "") + '" data-master-column-filter="' +
        key + '"' + (K.ui.masterFilterOpen === key ? " open" : "") + ">" +
        '<summary aria-label="Filter ' + label + '" title="Filter ' + label + '"></summary>' +
        '<div class="master-column-filter__menu"><label>Filter ' + label +
          '<input type="search" data-filter="masterFilter.' + key + '" value="' +
          K.esc(K.ui.masterFilters[key] || "") + '" placeholder="Ketik nilai…" aria-label="Filter ' + label + '">' +
        "</label></div></details></div></th>";
  }

  function dataField(style, field, value, type, extra) {
    const attrs = extra || "";
    return '<input class="master-cell-input" type="' + type + '" value="' + K.esc(value) +
      '" data-style-id="' + K.esc(style.id) + '" data-master-field="' + field + '"' +
      attrs + ">";
  }

  function viewDataMaster() {
    const styles = B.get().styles;
    const buyers = B.WORKSPACE_BUYERS.concat(styles.map(function (style) {
      return style.buyer;
    }).filter(function (buyer, index, list) {
      return buyer && B.WORKSPACE_BUYERS.indexOf(buyer) === -1 && list.indexOf(buyer) === index;
    }).sort());
    const filtered = styles.filter(function (style) {
      const template = B.latestFolderFile(style.id, "Template FRONT-BACK");
      const photo = B.latestFolderFile(style.id, "Foto Fitting");
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
        template: template ? "Lengkap " + K.formatDate(template.uploadedAt) : "Belum ada",
        photo: photo ? "Ada foto " + K.formatDate(photo.uploadedAt) : "Belum ada",
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

    const rows = filtered.map(function (style) {
      const template = B.latestFolderFile(style.id, "Template FRONT-BACK");
      const photo = B.latestFolderFile(style.id, "Foto Fitting");
      const templateLabel = template ? K.formatDate(template.uploadedAt) : "Belum dilengkapi";
      const photoLabel = photo ? K.formatDate(photo.uploadedAt) : "Belum diunggah";
      const buyerFolder = encodeURIComponent(style.id);
      return "<tr>" +
        '<td class="master-product"><a class="master-product__link mono" href="#/daftar-style/' +
          buyerFolder + '">' + K.esc(style.id) + "</a>" +
          dataField(style, "desc", style.desc, "text", ' placeholder="Nama product / style"') + "</td>" +
        "<td>" + dataField(style, "week", style.week, "text", ' placeholder="WK 11-14"') + "</td>" +
        "<td>" + dataField(style, "opd", style.opd, "date") + "</td>" +
        "<td>" + dataField(style, "deliveryDate", style.deliveryDate, "date") + "</td>" +
        "<td><select class=\"master-cell-input\" data-style-id=\"" + K.esc(style.id) +
          '" data-master-field="buyer">' + buyers.map(function (buyer) {
            return option(buyer, style.buyer);
          }).join("") + "</select></td>" +
        "<td>" + dataField(style, "brand", style.brand, "text", ' placeholder="Brand"') + "</td>" +
        '<td class="mono">' + K.esc(style.id) + "</td>" +
        "<td><select class=\"master-cell-input\" data-style-id=\"" + K.esc(style.id) +
          '" data-master-field="productGroupMaster">' +
          option("", style.productGroupMaster, "Pilih kategori") +
          B.WORKSPACE_PRODUCT_GROUPS.map(function (group) { return option(group, style.productGroupMaster); }).join("") +
          "</select></td>" +
        "<td><select class=\"master-cell-input master-cell-input--narrow\" data-style-id=\"" + K.esc(style.id) +
          '" data-master-field="nb">' +
          option("", style.nb, "—") + option("B", style.nb) + option("NB", style.nb) +
          "</select></td>" +
        "<td>" + dataField(style, "picMaster", style.picMaster, "text", ' placeholder="Nama PIC"') + "</td>" +
        '<td><a class="master-status ' + (template ? "master-status--ready" : "master-status--missing") +
          '" href="#/daftar-style/' + buyerFolder + '" data-open-style-folder="Template FRONT-BACK" ' +
          'data-style-id="' + K.esc(style.id) + '" title="Buka folder template FRONT-BACK">' +
          "<strong>" + K.esc(template ? "Lengkap" : "Belum ada") + "</strong>" +
          '<span>' + K.esc(templateLabel) + "</span></a></td>" +
        '<td><a class="master-status ' + (photo ? "master-status--ready" : "master-status--missing") +
          '" href="#/daftar-style/' + buyerFolder + '" data-open-style-folder="Foto Fitting" ' +
          'data-style-id="' + K.esc(style.id) + '" title="Buka folder Foto Fitting">' +
          "<strong>" + K.esc(photo ? "Ada foto" : "Belum ada") + "</strong>" +
          '<span>' + K.esc(photoLabel) + "</span></a></td>" +
        "<td>" + dataField(style, "smv", style.smv, "number", ' min="0" step="0.01" placeholder="Menit"') + "</td>" +
        "<td>" + dataField(style, "remark", style.remark, "text", ' placeholder="Tambah keterangan"') + "</td>" +
      "</tr>";
    }).join("");

    return '<div class="page-head"><div>' +
      '<h1 class="page-title">Data Master</h1>' +
      '<p class="page-sub">Cari dan perbarui informasi style, jadwal, PIC, status template, foto fitting, dan keterangan.</p>' +
      "</div><div class=\"page-actions\"><a class=\"btn\" href=\"#/daftar-style\">Buka folder style</a></div></div>" +
      '<details class="panel workspace-add-panel"><summary><i class="ti ti-plus" aria-hidden="true"></i>Tambah style ke Data Master</summary>' +
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
            selectOptions(B.WORKSPACE_PRODUCT_GROUPS, "", "Pilih kategori") + "</select></div>" +
          '<div class="field"><label for="new-nb">NB/B</label><select id="new-nb" name="nb">' +
            option("", "", "Pilih") + option("B", "", "Bonding (B)") + option("NB", "", "Non-Bonding (NB)") + "</select></div>" +
          '<div class="field"><label for="new-pic">PIC PM/MD</label><input id="new-pic" name="picMaster" maxlength="100"></div>' +
          '<div class="field"><label for="new-smv">SMV (menit)</label><input id="new-smv" name="smv" type="number" min="0" step="0.01"></div>' +
          '<div class="field field--wide"><label for="new-remark">Remark / Keterangan</label><input id="new-remark" name="remark" maxlength="500"></div>' +
          '<button type="submit" class="btn-primary">Simpan style</button>' +
        "</form></details>" +
      '<section class="panel workspace-table-panel">' +
        '<div class="panel__head workspace-filter-head"><div><h2 class="section-title">Index running style</h2>' +
          '<p class="section-note">Menampilkan ' + filtered.length + " dari " + styles.length + " style</p></div></div>" +
        '<div class="table-wrap workspace-table-scroll"><table class="table workspace-master-table">' +
          "<thead><tr>" +
            filterHeader("product", "Product / Article") +
            filterHeader("week", "Week") +
            filterHeader("opd", "OPD") +
            filterHeader("deliveryDate", "Delivery Date") +
            filterHeader("buyer", "Buyer") +
            filterHeader("brand", "Brand") +
            filterHeader("productGroup", "Product Group") +
            filterHeader("nb", "NB/B") +
            filterHeader("pic", "PIC PM / MD", true) +
            filterHeader("template", "Template FRONT-BACK", true) +
            filterHeader("photo", "Photo Date", true) +
            filterHeader("smv", "SMV · menit") +
            filterHeader("remark", "Remark / Keterangan", true) +
          "</tr></thead>" +
          "<tbody>" + (rows || '<tr><td colspan="13" class="empty">Tidak ada style yang cocok dengan filter.</td></tr>') + "</tbody>" +
        "</table></div></section>";
  }

  K.views["data-master"] = viewDataMaster;
})();
