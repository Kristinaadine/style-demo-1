/* BRA — reusable file/table import engine */
(function () {
  "use strict";

  const XLSX = function () { return window.XLSX; };

  function normalizeHeader(value) {
    return String(value == null ? "" : value).toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function readTableFile(file, options) {
    if (!file) throw new Error("Pilih file yang akan diunggah.");
    if (!XLSX()) throw new Error("Pustaka pembaca Excel/CSV belum tersedia.");

    const sheetRows = options && options.sheetRows;
    return file.arrayBuffer().then(function (buffer) {
      const workbook = XLSX().read(buffer, { type: "array", cellDates: true, sheetRows: sheetRows || 0 });
      const sheetNames = workbook.SheetNames || [];
      if (!sheetNames.length) throw new Error("File tidak memiliki worksheet atau sheet.");

      const sheetName = options && options.sheetName && sheetNames.indexOf(options.sheetName) !== -1
        ? options.sheetName
        : sheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX().utils.sheet_to_json(sheet, { defval: "", raw: false });
      return {
        workbook: workbook,
        sheetName: sheetName,
        sheetNames: sheetNames,
        headers: rows.length ? Object.keys(rows[0]) : XLSX().utils.sheet_to_json(sheet, { header: 1, defval: "" }).shift() || [],
        rows: rows
      };
    });
  }

  function getValue(row, aliases) {
    const aliasKeys = aliases.map(normalizeHeader).filter(Boolean);
    const keys = Object.keys(row || {});

    for (let i = 0; i < aliasKeys.length; i++) {
      for (let j = 0; j < keys.length; j++) {
        if (normalizeHeader(keys[j]) === aliasKeys[i]) return row[keys[j]];
      }
    }

    for (let i = 0; i < aliasKeys.length; i++) {
      for (let j = 0; j < keys.length; j++) {
        const normalized = normalizeHeader(keys[j]);
        if (normalized.indexOf(aliasKeys[i]) !== -1 || aliasKeys[i].indexOf(normalized) !== -1) {
          return row[keys[j]];
        }
      }
    }
    return "";
  }

  function buildMapping(headers, schema) {
    const mapping = {};
    schema.forEach(function (field) {
      let match = "";
      for (let i = 0; i < field.aliases.length && !match; i++) {
        const alias = normalizeHeader(field.aliases[i]);
        match = headers.find(function (header) { return normalizeHeader(header) === alias; }) || "";
      }
      if (!match && field.allowContains !== false) {
        match = headers.find(function (header) {
          const normalizedHeader = normalizeHeader(header);
          return field.aliases.some(function (alias) {
            const normalizedAlias = normalizeHeader(alias);
            return normalizedAlias && normalizedHeader.indexOf(normalizedAlias) !== -1;
          });
        }) || "";
      }
      if (match) mapping[field.name] = match;
    });
    return mapping;
  }

  function readPivotSheet(file, options) {
    if (!file) throw new Error("Pilih file yang akan diunggah.");
    if (!XLSX()) throw new Error("Pustaka pembaca Excel/CSV belum tersedia.");
    return file.arrayBuffer().then(function (buffer) {
      const workbook = XLSX().read(buffer, { type: "array", cellDates: true });
      const sheetNames = workbook.SheetNames || [];
      const sheetName = sheetNames.find(function (name) { return String(name).trim().toUpperCase() === "PIVOT"; });
      if (!sheetName) throw new Error("Sheet Pivot tidak ditemukan. File harus memiliki worksheet bernama PIVOT.");
      const sheet = workbook.Sheets[sheetName];
      const matrix = XLSX().utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
      let headerIndex = -1;
      let header = [];
      for (let i = 0; i < matrix.length; i++) {
        const normalized = matrix[i].map(normalizeHeader);
        if (normalized.indexOf("emailreceiveddate") !== -1 && normalized.indexOf("style") !== -1) {
          headerIndex = i;
          header = matrix[i].map(function (value) { return String(value || "").trim(); });
          break;
        }
      }
      if (headerIndex === -1) throw new Error("Header tabel Pivot tidak ditemukan. Pastikan sheet PIVOT berasal dari format Planner yang benar.");

      const columnIndex = {};
      header.forEach(function (value, index) { columnIndex[normalizeHeader(value)] = index; });
      const get = function (row, names) {
        for (let i = 0; i < names.length; i++) {
          const index = columnIndex[normalizeHeader(names[i])];
          if (index != null && row[index] != null && String(row[index]).trim()) return String(row[index]).trim();
        }
        return "";
      };

      const deliverySortValue = function (value) {
        const text = String(value || "").trim();
        let parts = text.match(/^([0-1]?\d)[-/]([0-3]?\d)[-/](\d{2}|\d{4})$/);
        if (parts && Number(parts[1]) <= 12 && Number(parts[2]) <= 31) {
          const year = parts[3].length === 2 ? "20" + parts[3] : parts[3];
          return Number(year) * 10000 + Number(parts[1]) * 100 + Number(parts[2]);
        }
        parts = text.match(/^([0-3]?\d)[-/]([0-1]?\d)[-/](\d{2}|\d{4})$/);
        if (parts && Number(parts[1]) <= 31 && Number(parts[2]) <= 12) {
          const year = parts[3].length === 2 ? "20" + parts[3] : parts[3];
          return Number(year) * 10000 + Number(parts[2]) * 100 + Number(parts[1]);
        }
        return 0;
      };

      let receivedDate = "";
      let customer = "";
      let style = "";
      let group = "";
      let typeName = "";
      let bonding = "";
      const styles = {};
      for (let i = headerIndex + 1; i < matrix.length; i++) {
        const row = matrix[i] || [];
        const date = get(row, ["EMAIL RECEIVED DATE"]);
        const customerValue = get(row, ["Customer"]);
        const styleValue = get(row, ["STYLE"]);
        const groupValue = get(row, ["Group"]);
        const typeValue = get(row, ["TYPE"]);
        const bondingValue = get(row, ["BONDING STATUS"]);
        if (date) receivedDate = date;
        if (customerValue) customer = customerValue;
        if (styleValue) style = styleValue;
        if (groupValue) group = groupValue;
        if (typeValue) typeName = typeValue;
        if (bondingValue) bonding = bondingValue;
        if (!style) continue;
        const key = style.toLowerCase();
        const delivery = get(row, ["DEL DATE"]);
        const smv = get(row, ["SMV"]);
        if (!styles[key]) styles[key] = { "EMAIL RECEIVED DATE": receivedDate, "Customer": customer, "STYLE": style, "Group": group, "TYPE": typeName, "BONDING STATUS": bonding, "DEL DATE": delivery, "SMV": smv };
        if (delivery && deliverySortValue(delivery) >= deliverySortValue(styles[key]["DEL DATE"])) styles[key]["DEL DATE"] = delivery;
        if (smv) styles[key]["SMV"] = smv;
      }
      const rows = Object.keys(styles).map(function (key) { return styles[key]; });
      let explicitStyleCells = 0;
      for (let i = headerIndex + 1; i < matrix.length; i++) {
        if (String(get(matrix[i], ["STYLE"])).trim()) explicitStyleCells++;
      }
      return { workbook: workbook, sheetName: sheetName, sheetNames: [sheetName], headers: Object.keys(rows[0] || {}), rows: rows, detailRowCount: matrix.length - headerIndex - 1, explicitStyleCells: explicitStyleCells, uniqueStyleCount: rows.length };
    });
  }

  function formatDate(value) {
    if (!value) return "";
    if (value instanceof Date && !isNaN(value.valueOf())) {
      return value.getFullYear() + "-" + String(value.getMonth() + 1).padStart(2, "0") + "-" + String(value.getDate()).padStart(2, "0");
    }
    const text = String(value).trim();
    const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) return match[1] + "-" + match[2].padStart(2, "0") + "-" + match[3].padStart(2, "0");
    const monthDayYear = text.match(/^([0-1]?\d)[-/]([0-3]?\d)[-/](\d{4}|\d{2})$/);
    if (monthDayYear && Number(monthDayYear[1]) <= 12 && Number(monthDayYear[2]) <= 31) {
      const year = monthDayYear[3].length === 2 ? "20" + monthDayYear[3] : monthDayYear[3];
      return year + "-" + monthDayYear[1].padStart(2, "0") + "-" + monthDayYear[2].padStart(2, "0");
    }
    const dayMonthYear = text.match(/^([0-3]?\d)[-/]([0-1]?\d)[-/](\d{4}|\d{2})$/);
    if (dayMonthYear) {
      const year = dayMonthYear[3].length === 2 ? "20" + dayMonthYear[3] : dayMonthYear[3];
      return year + "-" + dayMonthYear[2].padStart(2, "0") + "-" + dayMonthYear[1].padStart(2, "0");
    }
    return text;
  }

  window.BRAImportEngine = {
    normalizeHeader: normalizeHeader,
    readTableFile: readTableFile,
    readPivotSheet: readPivotSheet,
    getValue: getValue,
    buildMapping: buildMapping,
    formatDate: formatDate
  };
})();
