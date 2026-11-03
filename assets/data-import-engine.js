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
    const aliasKeys = aliases.map(normalizeHeader);
    const keys = Object.keys(row);
    for (let i = 0; i < keys.length; i++) {
      const normalized = normalizeHeader(keys[i]);
      if (aliasKeys.some(function (alias) {
        return normalized === alias || normalized.indexOf(alias) !== -1 || alias.indexOf(normalized) !== -1;
      })) return row[keys[i]];
    }
    return "";
  }

  function buildMapping(headers, schema) {
    const mapping = {};
    schema.forEach(function (field) {
      const matches = headers.filter(function (header) {
        const normalizedHeader = normalizeHeader(header);
        return field.aliases.some(function (alias) {
          const normalizedAlias = normalizeHeader(alias);
          return normalizedHeader === normalizedAlias || normalizedHeader.indexOf(normalizedAlias) !== -1;
        });
      });
      if (matches.length) mapping[field.name] = matches[0];
    });
    return mapping;
  }

  function formatDate(value) {
    if (!value) return "";
    if (value instanceof Date && !isNaN(value.valueOf())) {
      return value.getFullYear() + "-" + String(value.getMonth() + 1).padStart(2, "0") + "-" + String(value.getDate()).padStart(2, "0");
    }
    const text = String(value).trim();
    const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) return match[1] + "-" + match[2].padStart(2, "0") + "-" + match[3].padStart(2, "0");
    return text;
  }

  window.BRAImportEngine = {
    normalizeHeader: normalizeHeader,
    readTableFile: readTableFile,
    getValue: getValue,
    buildMapping: buildMapping,
    formatDate: formatDate
  };
})();
