/* ==========================================================================
   BRA Running Style — planner, master index, and style file workspace
   ========================================================================== */

(function () {
  "use strict";

  const B = window.BRA;
  const BUYERS = [
    "AAI", "AME", "ART MARTIN", "BPX", "BR", "BRVS", "CHP/Champion",
    "DTG/Delta Galil", "EVDN", "FOTL", "H&M", "HBI", "JCP",
    "KMR/Komar", "OTTO", "PBI", "SDW", "SPX/Spanx", "TAG", "TIG",
    "VS/Victoria's Secret", "WAC US/Wacoal"
  ];
  const PRODUCT_GROUPS = [
    "B-Bra", "C-Baby Doll", "C-Camisole", "C-Tankini Top", "C-Top",
    "D-Bodysuit", "D-Romper", "L-Bustier", "P-Bikini", "P-Brief",
    "P-Hipster", "P-Panty", "P-Shorty", "T-Thong", "X-Boxer"
  ];
  const DEFAULT_FOLDERS = [
    "Foto Running Style", "Template Photo Running Style", "Foto Fitting", "Marketing Sample", "Pending Sample",
    "Manual", "OMD", "Update Style", "Blue Print", "BOM-RMS", "IE",
    "Inhouse Costing", "Measurement", "Pattern"
  ];
  const STANDARDIZATION_CATEGORIES = {
    "Bra": [
      "Underwire Bra", "Bandeau Bra", "Stick-on Bra", "Sports Bra", "Full-Cup Bra",
      "Longline Bra", "Molded-Cup Bra", "Built-in Bra", "Nursing Bra", "Racerback Bra",
      "Plunge Bra", "Convertible Bra", "Push-Up Bra", "Balconette Bra", "Triangle Bra",
      "Corset Bra", "Bralette", "Minimizer Bra", "T-Shirt Bra", "Strapless Bra",
      "Wireless Bra", "Demi-Cup Bra", "Front-Closure Bra", "Adhesive Bra", "Halter Bra",
      "Seamless Bra", "Padded Bra", "Sheer Bra", "Shelf Bra", "Maternity Bra"
    ],
    "Underwear": [
      "String", "G-String", "Bikini", "Cheeky", "Mini-String / Thong", "T-String",
      "Slip", "Tanga", "Brazilian", "Hipster", "Classic", "Boyshorts", "Maxi",
      "Control Briefs", "High Waist / Retro", "Pantaloons"
    ]
  };
  const DB_NAME = "bra-running-style-files";
  const DB_VERSION = 1;
  const FILE_STORE = "blobs";
  let suppressPersist = false;
  const LEGACY_BUYER = {
    VS: "VS/Victoria's Secret",
    SPANX: "SPX/Spanx",
    WACOAL: "WAC US/Wacoal"
  };

  function persist() {
    try {
      if (typeof B.save === "function") {
        B.save();
      } else {
        localStorage.setItem(B.STORE_KEY, JSON.stringify(B.get()));
      }
    } catch (error) {
      throw new Error("Perubahan tidak dapat disimpan di browser: " + error.message);
    }
  }

  async function clearAllStoredFiles() {
    const database = await openFileDatabase();
    await new Promise(function (resolve, reject) {
      const transaction = database.transaction(FILE_STORE, "readwrite");
      transaction.objectStore(FILE_STORE).clear();
      transaction.oncomplete = function () { resolve(); };
      transaction.onerror = function () { reject(new Error("Berkas tersimpan gagal dibersihkan.")); };
      transaction.onabort = function () { reject(new Error("Pembersihan berkas dibatalkan.")); };
    });
    database.close();
  }

  async function resetAllData() {
    const state = B.get();
    const role = state.role || "md";
    const emptyState = {
      version: 2,
      role: role,
      styles: [],
      plannerFiles: [],
      workspaceFiles: [],
      styleFolders: {},
      folderCategories: {},
      indexImports: [],
      masterImportBatches: [],
      activity: [],
      batches: []
    };

    B.get().version = emptyState.version;
    Object.keys(B.get()).forEach(function (key) { delete B.get()[key]; });
    Object.assign(B.get(), emptyState);
    await clearAllStoredFiles();
    persist();
  }

  function openFileDatabase() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error("Penyimpanan berkas browser (IndexedDB) tidak tersedia."));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        if (!request.result.objectStoreNames.contains(FILE_STORE)) {
          request.result.createObjectStore(FILE_STORE);
        }
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () {
        const message = request.error ? request.error.message : "permintaan gagal";
        reject(new Error("Penyimpanan berkas tidak dapat dibuka: " + message));
      };
      request.onblocked = function () {
        reject(new Error("Penyimpanan berkas sedang dibuka di tab lain. Tutup tab aplikasi lain lalu coba lagi."));
      };
    });
  }

  async function storeBlob(id, blob) {
    const database = await openFileDatabase();
    return new Promise(function (resolve, reject) {
      const transaction = database.transaction(FILE_STORE, "readwrite");
      transaction.objectStore(FILE_STORE).put(blob, id);
      transaction.oncomplete = function () {
        database.close();
        resolve();
      };
      transaction.onerror = function () {
        const message = transaction.error ? transaction.error.message : "transaksi gagal";
        database.close();
        reject(new Error("Berkas tidak dapat disimpan: " + message));
      };
      transaction.onabort = function () {
        const message = transaction.error ? transaction.error.message : "transaksi dibatalkan";
        database.close();
        reject(new Error("Penyimpanan berkas dibatalkan: " + message));
      };
    });
  }

  async function removeBlob(id) {
    const database = await openFileDatabase();
    return new Promise(function (resolve, reject) {
      const transaction = database.transaction(FILE_STORE, "readwrite");
      transaction.objectStore(FILE_STORE).delete(id);
      transaction.oncomplete = function () {
        database.close();
        resolve();
      };
      transaction.onerror = function () {
        const message = transaction.error ? transaction.error.message : "transaksi gagal";
        database.close();
        reject(new Error("Berkas sementara tidak dapat dibersihkan: " + message));
      };
    });
  }

  async function readBlob(id) {
    const database = await openFileDatabase();
    return new Promise(function (resolve, reject) {
      const transaction = database.transaction(FILE_STORE, "readonly");
      const request = transaction.objectStore(FILE_STORE).get(id);
      request.onsuccess = function () {
        const blob = request.result;
        database.close();
        if (!blob) {
          reject(new Error("Isi berkas tidak ditemukan di penyimpanan browser."));
          return;
        }
        resolve(blob);
      };
      request.onerror = function () {
        const message = request.error ? request.error.message : "pembacaan gagal";
        database.close();
        reject(new Error("Berkas tidak dapat dibaca: " + message));
      };
    });
  }

  async function requestPersistentStorage() {
    if (!navigator.storage) return null;
    try {
      if (navigator.storage.persist) await navigator.storage.persist();
      const estimate = navigator.storage.estimate ? await navigator.storage.estimate() : null;
      return estimate;
    } catch (error) {
      return null;
    }
  }

  function ensureWorkspace() {
    const state = B.get();
    state.plannerFiles = Array.isArray(state.plannerFiles) ? state.plannerFiles : [];
    state.indexImports = Array.isArray(state.indexImports) ? state.indexImports : [];
    state.masterImportBatches = Array.isArray(state.masterImportBatches) ? state.masterImportBatches : [];
    state.workspaceFiles = Array.isArray(state.workspaceFiles) ? state.workspaceFiles : [];
    state.styles = Array.isArray(state.styles) ? state.styles : [];
    state.styles.forEach(function (style) {
      if (style.templatePhotoStatus !== "ready" && style.templatePhotoStatus !== "missing") style.templatePhotoStatus = "";
      style.photoDate = typeof style.photoDate === "string" ? style.photoDate : "";
    });
    const uniqueStyles = [];
    const styleKeys = {};
    state.styles.forEach(function (style) {
      const key = String(style.id || "").trim().toLowerCase();
      if (!key) return;
      if (styleKeys[key]) {
        const existing = styleKeys[key];
        Object.keys(style).forEach(function (field) {
          if ((existing[field] === "" || existing[field] == null) && style[field] !== "" && style[field] != null) existing[field] = style[field];
        });
      } else {
        styleKeys[key] = style;
        uniqueStyles.push(style);
      }
    });
    state.styles = uniqueStyles;
    state.styleFolders = state.styleFolders && typeof state.styleFolders === "object" ? state.styleFolders : {};
    state.workspaceFiles.forEach(function (record) {
      if (!record.standardization) record.standardization = { category: "", type: "" };
      if (record.styleId) {
        const folders = Array.isArray(state.styleFolders[record.styleId]) ? state.styleFolders[record.styleId] : [];
        if (folders.indexOf(record.styleId) === -1) folders.push(record.styleId);
        state.styleFolders[record.styleId] = folders;
        if (!Array.isArray(record.folders)) record.folders = [];
        if (record.folders.indexOf(record.styleId) === -1) record.folders.push(record.styleId);
      }
    });
    state.folderCategories = state.folderCategories && typeof state.folderCategories === "object"
      ? state.folderCategories
      : {};
    Object.keys(state.folderCategories).forEach(function (buyer) {
      if (!Array.isArray(state.folderCategories[buyer])) return;
      state.folderCategories[buyer] = state.folderCategories[buyer].map(function (folder) {
        return folder === "Template FRONT-BACK" ? "Template Photo Running Style" : folder;
      });
    });
    state.workspaceFiles.forEach(function (record) {
      if (!Array.isArray(record.folders)) return;
      record.folders = record.folders.map(function (folder) {
        return folder === "Template FRONT-BACK" ? "Template Photo Running Style" : folder;
      });
    });

    state.styles.forEach(function (style) {
      style.buyer = LEGACY_BUYER[style.buyer] || style.buyer;
      if (style.id === "DOBR124") {
        style.picMaster = "Yulia";
        style.pic = style.pic && typeof style.pic === "object" ? style.pic : {};
        style.pic.pattern = "Yulia";
      }
      if (style.opd == null) style.opd = "";
      if (style.deliveryDate == null) style.deliveryDate = "";
      ["opd", "deliveryDate"].forEach(function (field) {
        const text = String(style[field] || "").trim();
        let isoAmbiguous = text.match(/^(\d{4})[-/]([0-3]?\d)[-/]([0-1]?\d)$/);
        if (isoAmbiguous && Number(isoAmbiguous[2]) > 12 && Number(isoAmbiguous[3]) <= 12) {
          style[field] = isoAmbiguous[1] + "-" + isoAmbiguous[3].padStart(2, "0") + "-" + isoAmbiguous[2].padStart(2, "0");
          return;
        }
        let match = text.match(/^([0-1]?\d)[-/]([0-3]?\d)[-/](\d{4}|\d{2})$/);
        if (match && Number(match[1]) <= 12 && Number(match[2]) <= 31) {
          const year = match[3].length === 2 ? "20" + match[3] : match[3];
          style[field] = year + "-" + match[1].padStart(2, "0") + "-" + match[2].padStart(2, "0");
          return;
        }
        match = text.match(/^([0-3]?\d)[-/]([0-1]?\d)[-/](\d{4}|\d{2})$/);
        if (match && !/^\d{4}-/.test(text)) {
          const year = match[3].length === 2 ? "20" + match[3] : match[3];
          style[field] = year + "-" + match[2].padStart(2, "0") + "-" + match[1].padStart(2, "0");
        }
      });
      if (style.smv == null) style.smv = "";
      if (style.nb == null) style.nb = "";
      if (style.productGroupMaster == null) style.productGroupMaster = "";
      if (!style.productGroupMaster && PRODUCT_GROUPS.indexOf(style.productGroup) !== -1) {
        style.productGroupMaster = style.productGroup;
      }
      if (PRODUCT_GROUPS.indexOf(style.productGroupMaster) === -1) style.productGroupMaster = "";
      if (typeof style.nb !== "string") style.nb = "";
      if (style.picMaster == null) {
        style.picMaster = style.pic && (style.pic.pattern || style.pic.mdmkt) || "";
      }
      if (style.remark == null) style.remark = style.notes || "";
      if (!Array.isArray(state.folderCategories[style.buyer])) {
        state.folderCategories[style.buyer] = DEFAULT_FOLDERS.slice();
      }
    });


    persist();
  }

  function updateMaster(id, field, value) {
    const allowed = ["week", "opd", "deliveryDate", "buyer", "brand", "desc", "productGroupMaster", "nb", "picMaster", "smv", "remark", "templatePhotoStatus", "photoDate", "photoUploaded"];
    if (allowed.indexOf(field) === -1) throw new Error("Kolom ini tidak dapat diperbarui.");
    const style = B.styleById(id);
    if (!style) throw new Error("Style tidak ditemukan.");
    if (field === "buyer" && BUYERS.indexOf(value) === -1) throw new Error("Pilih buyer dari daftar.");
    if (field === "brand" && String(value).length > 120) throw new Error("Nama brand maksimal 120 karakter.");
    if (field === "desc" && String(value).length > 160) throw new Error("Nama product maksimal 160 karakter.");
    if (field === "week" && value) value = normalizeWeek(value);
    if (field === "productGroupMaster" && value && PRODUCT_GROUPS.indexOf(value) === -1) {
      throw new Error("Pilih kategori produk dari daftar.");
    }
    if (field === "nb" && value && ["NB", "B"].indexOf(value) === -1) {
      throw new Error("Pilih NB atau B dari daftar.");
    }
    if (field === "smv" && value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
      throw new Error("SMV harus berupa angka nol atau lebih.");
    }
    if (["opd", "deliveryDate", "photoDate"].indexOf(field) !== -1 && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error("Tanggal harus diisi dengan format yang valid.");
    }
    if (field === "templatePhotoStatus" && value && ["ready", "missing"].indexOf(value) === -1) {
      throw new Error("Status template foto tidak valid.");
    }

    const normalizedValue = field === "smv" && value !== ""
      ? Number(value)
      : (field === "photoUploaded"
        ? (value === true || value === "true" || value === 1)
        : value);
    const previous = style[field];
    style[field] = normalizedValue;
    try {
      persist();
    } catch (error) {
      style[field] = previous;
      throw error;
    }
  }

  function upsertMasterStyle(input) {
    const id = String(input.product || "").trim();
    if (!id) throw new Error("Nomor article/product wajib diisi.");
    const existing = B.get().styles.find(function (style) {
      return String(style.id || "").toLowerCase() === id.toLowerCase();
    });
    if (existing) {
      if (BUYERS.indexOf(input.buyer) === -1) throw new Error("Pilih buyer dari daftar.");
      if (input.productGroupMaster && PRODUCT_GROUPS.indexOf(input.productGroupMaster) === -1) {
        throw new Error("Pilih kategori produk dari daftar.");
      }
      if (input.nb && ["NB", "B"].indexOf(input.nb) === -1) throw new Error("Pilih NB atau B dari daftar.");
      if (input.smv && (!Number.isFinite(Number(input.smv)) || Number(input.smv) < 0)) {
        throw new Error("SMV harus berupa angka nol atau lebih.");
      }
      const week = input.week ? normalizeWeek(input.week) : "";
      const preserveMissing = input.preserveMissing === true;
      const updates = {
        brand: String(input.brand || "").trim() || input.buyer,
        buyer: input.buyer,
        desc: preserveMissing && !String(input.description || "").trim() ? existing.desc : String(input.description || "").trim(),
        week: preserveMissing && !week ? existing.week : week,
        opd: preserveMissing && !input.opd ? existing.opd : input.opd || "",
        deliveryDate: preserveMissing && !input.deliveryDate ? existing.deliveryDate : input.deliveryDate || "",
        productGroupMaster: preserveMissing && !input.productGroupMaster ? existing.productGroupMaster : input.productGroupMaster || "",
        nb: preserveMissing && !String(input.nb || "").trim() ? existing.nb : String(input.nb || "").trim().toUpperCase(),
        picMaster: preserveMissing && !String(input.picMaster || "").trim() ? existing.picMaster : String(input.picMaster || "").trim(),
        smv: preserveMissing && (input.smv === "" || input.smv == null) ? existing.smv : (input.smv === "" || input.smv == null ? "" : Number(input.smv)),
        remark: preserveMissing && !String(input.remark || "").trim() ? existing.remark : String(input.remark || "").trim(),
        updatedAt: B.today(),
        updatedBy: "Pengguna"
      };
      Object.assign(existing, updates);
      if (!suppressPersist) persist();
      return { style: existing, replaced: true };
    }
    return { style: addMasterStyle(input), replaced: false };
  }

  function addMasterStyle(input) {
    const id = String(input.product || "").trim();
    if (!id) throw new Error("Nomor article/product wajib diisi.");
    const week = input.week ? normalizeWeek(input.week) : "";
    if (B.get().styles.some(function (style) {
      return style.id.toLowerCase() === id.toLowerCase();
    })) {
      throw new Error("Nomor article tersebut sudah digunakan. Nomor harus unik agar folder dan file tidak tertukar.");
    }
    if (BUYERS.indexOf(input.buyer) === -1) throw new Error("Pilih buyer dari daftar.");
    if (input.productGroupMaster && PRODUCT_GROUPS.indexOf(input.productGroupMaster) === -1) {
      throw new Error("Pilih kategori produk dari daftar.");
    }
    if (input.nb && ["NB", "B"].indexOf(input.nb) === -1) {
      throw new Error("Pilih NB atau B dari daftar.");
    }
    if (input.smv && (!Number.isFinite(Number(input.smv)) || Number(input.smv) < 0)) {
      throw new Error("SMV harus berupa angka nol atau lebih.");
    }

    const style = {
      id: id,
      brand: String(input.brand || "").trim() || input.buyer,
      buyer: input.buyer,
      desc: String(input.description || "").trim(),
      group: "",
      color: "",
      week: week,
      opd: input.opd || "",
      deliveryDate: input.deliveryDate || "",
      productGroupMaster: input.productGroupMaster || "",
      nb: String(input.nb || "").trim(),
      picMaster: String(input.picMaster || "").trim(),
      smv: input.smv ? Number(input.smv) : "",
      remark: String(input.remark || "").trim(),
      templatePhotoStatus: "",
      photoDate: "",
      photoUploaded: false,
      dev: "",
      prod: "",
      sample: "",
      sampleEvidence: false,
      mc: "",
      pic: { pattern: null, mdmkt: null, ie: null, prod: null, qa: null },
      notes: "",
      updatedAt: B.today(),
      updatedBy: "Pengguna",
      docs: [],
      pubs: { FRONT: [], BACK: [] }
    };

    B.get().styles.push(style);
    try {
      if (!Array.isArray(B.get().folderCategories[style.buyer])) {
        B.get().folderCategories[style.buyer] = DEFAULT_FOLDERS.slice();
      }
      if (!suppressPersist) persist();
    } catch (error) {
      B.get().styles.pop();
      throw error;
    }
    return style;
  }

  function normalizeWeek(value) {
    const match = String(value || "").trim().match(/^(?:WEEK|WK)\s*(\d{1,2})(?:\s*-\s*(?:WEEK|WK)?\s*(\d{1,2}))?$/i);
    if (!match) throw new Error("Isi minggu dengan format, misalnya WK 11 atau WK 11-14.");
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : null;
    if (start < 1 || start > 53 || (end != null && (end < start || end > 53))) {
      throw new Error("Nomor minggu harus berada pada rentang 1–53 dan urut.");
    }
    return "WK " + start + (end == null ? "" : "-" + end);
  }

  function renameMasterStyle(oldId, newId) {
    const state = B.get();
    const id = String(newId || "").trim();
    if (!id) throw new Error("Article/Style tidak boleh kosong.");
    if (id.length > 80) throw new Error("Article/Style maksimal 80 karakter.");
    if (id.toLowerCase() === String(oldId).toLowerCase()) return oldId;
    if (state.styles.some(function (style) { return String(style.id).toLowerCase() === id.toLowerCase(); })) {
      throw new Error("Article/Style tersebut sudah digunakan.");
    }
    const style = state.styles.find(function (item) { return item.id === oldId; });
    if (!style) throw new Error("Style tidak ditemukan.");

    const previousStyle = state.styles.slice();
    const previousFolders = state.styleFolders && state.styleFolders[oldId];
    const previousFiles = state.workspaceFiles.map(function (record) { return Object.assign({}, record); });
    style.id = id;
    state.workspaceFiles.forEach(function (record) {
      if (record.styleId === oldId) {
        record.styleId = id;
        if (Array.isArray(record.folders)) {
          record.folders = record.folders.map(function (folder) { return folder === oldId ? id : folder; });
        }
      }
    });
    state.styleFolders = state.styleFolders && typeof state.styleFolders === "object" ? state.styleFolders : {};
    if (Object.prototype.hasOwnProperty.call(state.styleFolders, oldId)) {
      const folders = state.styleFolders[oldId].slice();
      state.styleFolders[id] = folders.map(function (folder) { return folder === oldId ? id : folder; });
      delete state.styleFolders[oldId];
    }
    try {
      persist();
    } catch (error) {
      state.styles = previousStyle;
      state.workspaceFiles = previousFiles;
      if (previousFolders) state.styleFolders[id] = previousFolders;
      delete state.styleFolders[id];
      throw error;
    }
    return id;
  }

  async function deleteMasterStyle(id) {
    const state = B.get();
    const style = state.styles.find(function (item) { return item.id === id; });
    if (!style) throw new Error("Style tidak ditemukan.");
    const removedFiles = state.workspaceFiles.filter(function (record) { return record.styleId === id; });
    state.styles = state.styles.filter(function (item) { return item.id !== id; });
    state.workspaceFiles = state.workspaceFiles.filter(function (record) { return record.styleId !== id; });
    delete state.styleFolders[id];
    try {
      persist();
      for (const record of removedFiles) {
        if (record.blobId) await removeBlob(record.blobId);
        if (record.previewBlobId) await removeBlob(record.previewBlobId);
      }
    } catch (error) {
      throw error;
    }
    return true;
  }

  function recordIndexImport(record) {
    const state = B.get();
    state.indexImports = Array.isArray(state.indexImports) ? state.indexImports : [];
    state.masterImportBatches = Array.isArray(state.masterImportBatches) ? state.masterImportBatches : [];
    const batchId = "batch-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    record = Object.assign({}, record, {
      id: batchId,
      styles: JSON.parse(JSON.stringify(B.get().styles || []))
    });
    state.indexImports.unshift(record);
    state.indexImports = state.indexImports.slice(0, 100);
    state.masterImportBatches.unshift(record);
    state.masterImportBatches = state.masterImportBatches.slice(0, 100);
    persist();
  }

  function renameMasterImportBatch(batchId, newName) {
    const name = String(newName || "").trim();
    if (!name) throw new Error("Nama folder/snapshot tidak boleh kosong.");
    const state = B.get();
    const batch = (state.masterImportBatches || []).find(function (item) { return item.id === batchId; });
    if (!batch) throw new Error("Folder/snapshot import tidak ditemukan.");
    batch.fileName = name;
    const indexRecord = (state.indexImports || []).find(function (item) { return item.id === batchId; });
    if (indexRecord) indexRecord.fileName = name;
    persist();
    return name;
  }

  function deleteMasterImportBatch(batchId) {
    const state = B.get();
    const batches = state.masterImportBatches || [];
    const exists = batches.some(function (item) { return item.id === batchId; });
    if (!exists) throw new Error("Folder/snapshot import tidak ditemukan.");
    state.masterImportBatches = batches.filter(function (item) { return item.id !== batchId; });
    state.indexImports = (state.indexImports || []).filter(function (item) { return item.id !== batchId; });
    persist();
    return true;
  }

  function importedFileStillInMaster(fileName) {
    const normalizedName = String(fileName || "").trim().toLowerCase();
    const records = B.get().indexImports.filter(function (record) {
      return String(record.fileName || "").trim().toLowerCase() === normalizedName;
    });
    if (!records.length) return false;
    const tracked = records.filter(function (record) { return Array.isArray(record.styleIds) && record.styleIds.length; });
    if (!tracked.length) return B.get().styles.length > 0;
    return tracked.some(function (record) {
      return record.styleIds.some(function (styleId) {
        return B.get().styles.some(function (style) {
          return String(style.id || "").toLowerCase() === String(styleId || "").toLowerCase();
        });
      });
    });
  }

  async function addPlannerFile(weekValue, file) {
    if (!file) throw new Error("Pilih file Planner yang akan disimpan.");
    if (file.size > 1024 * 1024 * 1024) throw new Error("Ukuran file maksimal 1 GB per berkas pada versi browser ini.");
    const week = normalizeWeek(weekValue);
    const duplicates = B.get().plannerFiles.filter(function (record) {
      return record.week === week && record.name.toLowerCase() === file.name.toLowerCase();
    });
    const id = "planner-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    const record = {
      id: id,
      week: week,
      name: file.name,
      displayName: week + " - " + file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      receivedAt: new Date().toISOString(),
      blobId: id
    };

    await storeBlob(id, file);
    B.get().plannerFiles.unshift(record);
    B.get().plannerFiles = B.get().plannerFiles.filter(function (item) {
      return item.id === id || !(item.week === week && String(item.name).toLowerCase() === file.name.toLowerCase());
    });
    try {
      persist();
      for (const duplicate of duplicates) {
        if (duplicate.blobId) await removeBlob(duplicate.blobId);
      }
    } catch (error) {
      B.get().plannerFiles = duplicates.concat(B.get().plannerFiles.filter(function (item) { return item.id !== id; }));
      await removeBlob(id);
      throw error;
    }
    return record;
  }

  function foldersForBuyer(buyer) {
    const categories = B.get().folderCategories[buyer];
    return Array.isArray(categories) ? categories.slice() : DEFAULT_FOLDERS.slice();
  }

  function addFolder(buyer, name) {
    const folder = String(name || "").trim();
    if (!folder) throw new Error("Nama folder wajib diisi.");
    if (folder.length > 60) throw new Error("Nama folder maksimal 60 karakter.");
    const state = B.get();
    const previous = state.folderCategories[buyer];
    const categories = foldersForBuyer(buyer);
    if (categories.some(function (item) { return item.toLowerCase() === folder.toLowerCase(); })) {
      throw new Error("Folder tersebut sudah ada untuk buyer ini.");
    }
    categories.push(folder);
    state.folderCategories[buyer] = categories;
    try {
      persist();
    } catch (error) {
      if (previous) state.folderCategories[buyer] = previous;
      else delete state.folderCategories[buyer];
      throw error;
    }
  }

  async function createImageThumbnail(file) {
    if (!file || !String(file.type || "").toLowerCase().startsWith("image/") || /image\/svg/i.test(file.type)) return null;
    const maxSize = 420;
    let source = null;
    let sourceWidth = 0;
    let sourceHeight = 0;
    let objectUrl = "";
    try {
      if (typeof createImageBitmap === "function") {
        source = await createImageBitmap(file);
        sourceWidth = source.width;
        sourceHeight = source.height;
      }
    } catch (error) {
      source = null;
    }
    if (!source) {
      objectUrl = URL.createObjectURL(file);
      await new Promise(function (resolve, reject) {
        const image = new Image();
        image.onload = function () { source = image; sourceWidth = image.naturalWidth; sourceHeight = image.naturalHeight; resolve(); };
        image.onerror = function () { reject(new Error("Gambar tidak dapat dibaca.")); };
        image.src = objectUrl;
      });
    }
    const scale = Math.min(1, maxSize / Math.max(sourceWidth, sourceHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      if (source.close) source.close();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      return null;
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    if (source.close) source.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    return await new Promise(function (resolve) {
      canvas.toBlob(function (blob) { resolve(blob); }, "image/jpeg", 0.82);
    });
  }

  async function addStyleFile(styleId, categoryValues, file, standardization) {
    const style = B.styleById(styleId);
    if (!style) throw new Error("Style tidak ditemukan.");
    if (!file) throw new Error("Pilih file yang akan diunggah.");
    if (file.size > 1024 * 1024 * 1024) throw new Error("Ukuran file maksimal 1 GB per berkas pada versi browser ini.");
    const categories = Array.from(new Set((Array.isArray(categoryValues) ? categoryValues : [categoryValues])
      .filter(function (category) { return Boolean(category); })));
    if (!categories.length) {
      categories.push("File Style");
    }
    categories.forEach(function (category, index) {
      if (category === "File Style" || foldersForBuyer(style.buyer).includes(category) || foldersForStyle(style.id).includes(category)) return;
      categories[index] = "File Style";
    });
    const standard = standardization || { category: "", type: "" };
    if (standard.category && !STANDARDIZATION_CATEGORIES[standard.category]) {
      throw new Error("Jenis garment yang dipilih tidak valid.");
    }
    if (standard.category && (!standard.type || STANDARDIZATION_CATEGORIES[standard.category].indexOf(standard.type) === -1)) {
      throw new Error("Pilih kategori yang sesuai dengan jenis garment.");
    }

    const priorVersions = B.get().workspaceFiles.filter(function (record) {
      return record.styleId === styleId && String(record.name).toLowerCase() === file.name.toLowerCase();
    });
    const id = "style-file-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    let previewBlobId = "";
    try {
      const thumbnail = await createImageThumbnail(file);
      if (thumbnail) {
        previewBlobId = id + "-preview";
        await storeBlob(previewBlobId, thumbnail);
      }
    } catch (error) {
      previewBlobId = "";
    }
    const record = {
      id: id,
      blobId: id,
      styleId: style.id,
      buyer: style.buyer,
      brand: style.brand,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      previewBlobId: previewBlobId,
      version: 1,
      uploadedAt: new Date().toISOString(),
      uploadedBy: style.picMaster || "Pengguna",
      folders: categories,
      standardization: standard.category ? { category: standard.category, type: standard.type } : { category: "", type: "" }
    };

    await storeBlob(id, file);
    B.get().workspaceFiles.unshift(record);
    B.get().workspaceFiles = B.get().workspaceFiles.filter(function (item) {
      return item.id === id || !(item.styleId === styleId && String(item.name).toLowerCase() === file.name.toLowerCase());
    });
    try {
      persist();
      for (const duplicate of priorVersions) {
        if (duplicate.blobId) await removeBlob(duplicate.blobId);
        if (duplicate.previewBlobId) await removeBlob(duplicate.previewBlobId);
      }
    } catch (error) {
      B.get().workspaceFiles = priorVersions.concat(B.get().workspaceFiles.filter(function (item) { return item.id !== id; }));
      await removeBlob(id);
      throw error;
    }
    return record;
  }

  function styleFiles(styleId, category) {
    return B.get().workspaceFiles.filter(function (record) {
      return record.styleId === styleId && (!category || record.folders.indexOf(category) !== -1);
    });
  }

  function latestFolderFile(styleId, category) {
    return styleFiles(styleId, category).reduce(function (latest, record) {
      if (!latest || record.uploadedAt > latest.uploadedAt) return record;
      return latest;
    }, null);
  }

  function renamePlannerFile(blobId, newName) {
    const record = B.get().plannerFiles.find(function (item) { return item.blobId === blobId; });
    if (!record) throw new Error("File Planner tidak ditemukan.");
    let name = String(newName || "").trim();
    if (!name) throw new Error("Nama file tidak boleh kosong.");
    if (/[\\\/]/.test(name)) throw new Error("Nama file tidak boleh mengandung tanda garis miring.");
    const oldExtension = String(record.name || "").match(/\.[^.]+$/);
    if (oldExtension && name.lastIndexOf(".") === -1) name += oldExtension[0];
    if (name.length > 180) throw new Error("Nama file maksimal 180 karakter.");
    record.name = name;
    record.displayName = record.week + " - " + name;
    persist();
    return record;
  }

  function renameWorkspaceFile(blobId, newName) {
    const record = B.get().workspaceFiles.find(function (item) { return item.blobId === blobId; });
    if (!record) throw new Error("File style tidak ditemukan.");
    let name = String(newName || "").trim();
    if (!name) throw new Error("Nama file tidak boleh kosong.");
    if (/[\\\/]/.test(name)) throw new Error("Nama file tidak boleh mengandung tanda garis miring.");
    const oldExtension = String(record.name || "").match(/\.[^.]+$/);
    if (oldExtension && name.lastIndexOf(".") === -1) name += oldExtension[0];
    if (name.length > 180) throw new Error("Nama file maksimal 180 karakter.");
    record.name = name;
    persist();
    return record;
  }

  async function deletePlannerFile(blobId) {
    const state = B.get();
    const index = state.plannerFiles.findIndex(function (item) { return item.blobId === blobId; });
    if (index === -1) throw new Error("File Planner tidak ditemukan.");
    const record = state.plannerFiles[index];
    state.plannerFiles.splice(index, 1);
    try {
      persist();
      await removeBlob(blobId);
    } catch (error) {
      state.plannerFiles.splice(index, 0, record);
      persist();
      throw new Error("File Planner gagal dihapus.");
    }
    return record;
  }

  async function deleteWorkspaceFile(blobId) {
    const state = B.get();
    const index = state.workspaceFiles.findIndex(function (item) { return item.blobId === blobId; });
    if (index === -1) throw new Error("File style tidak ditemukan.");
    const record = state.workspaceFiles[index];
    state.workspaceFiles.splice(index, 1);
    try {
      persist();
      await removeBlob(blobId);
      if (record.previewBlobId) await removeBlob(record.previewBlobId);
    } catch (error) {
      state.workspaceFiles.splice(index, 0, record);
      persist();
      throw new Error("File gagal dihapus.");
    }
    return record;
  }

  async function downloadFile(blobId, fileName, fileType) {
    const blob = await readBlob(blobId);
    const url = URL.createObjectURL(new Blob([blob], { type: fileType || blob.type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  async function getPreviewBlob(blobId, fileType) {
    const blob = await readBlob(blobId);
    return new Blob([blob], { type: fileType || blob.type });
  }

  function foldersForStyle(styleId) {
    const state = B.get();
    state.styleFolders = state.styleFolders && typeof state.styleFolders === "object" ? state.styleFolders : {};
    return Array.isArray(state.styleFolders[styleId]) ? state.styleFolders[styleId].slice() : [];
  }

  function addStyleFolder(styleId, name) {
    const style = B.styleById(styleId);
    if (!style) throw new Error("Style tidak ditemukan.");
    const folder = String(name || "").trim();
    if (!folder) throw new Error("Nama folder wajib diisi.");
    if (folder.length > 60) throw new Error("Nama folder maksimal 60 karakter.");
    const state = B.get();
    state.styleFolders = state.styleFolders && typeof state.styleFolders === "object" ? state.styleFolders : {};
    const folders = foldersForStyle(styleId);
    if (folders.some(function (item) { return item.toLowerCase() === folder.toLowerCase(); })) {
      throw new Error("Folder tersebut sudah ada untuk style ini.");
    }
    folders.push(folder);
    state.styleFolders[styleId] = folders;
    persist();
    return folder;
  }

  function renameStyleFolder(styleId, oldName, newName) {
    const style = B.styleById(styleId);
    if (!style) throw new Error("Style tidak ditemukan.");
    const oldFolder = String(oldName || "").trim();
    const folder = String(newName || "").trim();
    if (!oldFolder || !folder) throw new Error("Nama folder tidak boleh kosong.");
    if (folder.length > 60) throw new Error("Nama folder maksimal 60 karakter.");
    const state = B.get();
    state.styleFolders = state.styleFolders && typeof state.styleFolders === "object" ? state.styleFolders : {};
    const folders = foldersForStyle(styleId);
    if (!folders.includes(oldFolder)) throw new Error("Folder tidak ditemukan.");
    if (folder !== oldFolder && folders.some(function (item) { return item.toLowerCase() === folder.toLowerCase(); })) {
      throw new Error("Folder dengan nama tersebut sudah ada.");
    }

    const previous = folders.slice();
    state.styleFolders[styleId] = folders.map(function (item) { return item === oldFolder ? folder : item; });
    state.workspaceFiles.forEach(function (record) {
      if (record.styleId !== styleId || !Array.isArray(record.folders)) return;
      record.folders = record.folders.map(function (item) { return item === oldFolder ? folder : item; });
    });
    try { persist(); } catch (error) { state.styleFolders[styleId] = previous; throw error; }
    return folder;
  }

  function deleteStyleFolder(styleId, folderName) {
    const style = B.styleById(styleId);
    if (!style) throw new Error("Style tidak ditemukan.");
    const state = B.get();
    state.styleFolders = state.styleFolders && typeof state.styleFolders === "object" ? state.styleFolders : {};
    const previousFolders = foldersForStyle(styleId);
    if (!previousFolders.includes(folderName)) throw new Error("Folder tidak ditemukan.");

    state.styleFolders[styleId] = previousFolders.filter(function (item) { return item !== folderName; });
    state.workspaceFiles.forEach(function (record) {
      if (record.styleId !== styleId || !Array.isArray(record.folders)) return;
      record.folders = record.folders.filter(function (item) { return item !== folderName; });
    });
    persist();
  }

  async function applyMasterImport(inputs, keepIds) {
    const state = B.get();
    let added = 0;
    let replaced = 0;
    let skipped = 0;
    suppressPersist = true;
    try {
      for (const input of inputs) {
        try {
          const result = upsertMasterStyle(input);
          if (result.replaced) replaced++; else added++;
        } catch (error) {
          skipped++;
        }
      }

      const keepKeys = {};
      keepIds.forEach(function (id) { keepKeys[String(id || "").trim().toLowerCase()] = true; });
      const preserveExisting = inputs.some(function (input) { return input.preserveMissing === true; });
      const staleStyles = preserveExisting ? [] : state.styles.filter(function (style) {
        return !keepKeys[String(style.id || "").trim().toLowerCase()];
      });
      const staleIds = {};
      staleStyles.forEach(function (style) { staleIds[String(style.id || "").toLowerCase()] = true; });
      const removedFiles = state.workspaceFiles.filter(function (record) {
        return staleIds[String(record.styleId || "").toLowerCase()];
      });
      state.styles = state.styles.filter(function (style) {
        return !staleIds[String(style.id || "").toLowerCase()];
      });
      state.workspaceFiles = state.workspaceFiles.filter(function (record) {
        return !staleIds[String(record.styleId || "").toLowerCase()];
      });
      state.styleFolders = state.styleFolders && typeof state.styleFolders === "object" ? state.styleFolders : {};
      staleStyles.forEach(function (style) { delete state.styleFolders[style.id]; });
      persist();
      await Promise.all(removedFiles.map(async function (record) {
        if (record.blobId) await removeBlob(record.blobId);
        if (record.previewBlobId) await removeBlob(record.previewBlobId);
      }));
      return { added: added, replaced: replaced, skipped: skipped, removed: staleStyles.length };
    } finally {
      suppressPersist = false;
    }
  }

  B.WORKSPACE_BUYERS = BUYERS;
  B.WORKSPACE_PRODUCT_GROUPS = PRODUCT_GROUPS;
  B.STANDARDIZATION_CATEGORIES = STANDARDIZATION_CATEGORIES;
  B.WORKSPACE_DEFAULT_FOLDERS = DEFAULT_FOLDERS;
  B.initWorkspace = ensureWorkspace;
  B.resetAllData = resetAllData;
  B.requestPersistentStorage = requestPersistentStorage;
  B.updateMaster = updateMaster;
  B.addMasterStyle = addMasterStyle;
  B.upsertMasterStyle = upsertMasterStyle;
  B.deleteMasterStyle = deleteMasterStyle;
  B.renameMasterStyle = renameMasterStyle;
  B.recordIndexImport = recordIndexImport;
  B.renameMasterImportBatch = renameMasterImportBatch;
  B.deleteMasterImportBatch = deleteMasterImportBatch;
  B.applyMasterImport = applyMasterImport;
  B.importedFileStillInMaster = importedFileStillInMaster;
  B.addPlannerFile = addPlannerFile;
  B.deletePlannerFile = deletePlannerFile;
  B.normalizeWorkspaceWeek = normalizeWeek;
  B.addFolder = addFolder;
  B.foldersForBuyer = foldersForBuyer;
  B.addStyleFile = addStyleFile;
  B.styleFiles = styleFiles;
  B.latestFolderFile = latestFolderFile;
  B.downloadFile = downloadFile;
  B.getPreviewBlob = getPreviewBlob;
  B.renamePlannerFile = renamePlannerFile;
  B.renameWorkspaceFile = renameWorkspaceFile;
  B.deleteWorkspaceFile = deleteWorkspaceFile;
  B.foldersForStyle = foldersForStyle;
  B.addStyleFolder = addStyleFolder;
  B.renameStyleFolder = renameStyleFolder;
  B.deleteStyleFolder = deleteStyleFolder;
})();
