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
    "Template FRONT-BACK", "Foto Fitting", "Marketing Sample", "Pending Sample",
    "Manual", "OMD", "Update Style", "Blue Print", "BOM-RMS", "IE",
    "Inhouse Costing", "Measurement", "Pattern"
  ];
  const DB_NAME = "bra-running-style-files";
  const DB_VERSION = 1;
  const FILE_STORE = "blobs";
  const LEGACY_BUYER = {
    VS: "VS/Victoria's Secret",
    SPANX: "SPX/Spanx",
    WACOAL: "WAC US/Wacoal"
  };

  function persist() {
    try {
      localStorage.setItem(B.STORE_KEY, JSON.stringify(B.get()));
    } catch (error) {
      throw new Error("Perubahan tidak dapat disimpan di browser: " + error.message);
    }
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

  function ensureWorkspace() {
    const state = B.get();
    state.plannerFiles = Array.isArray(state.plannerFiles) ? state.plannerFiles : [];
    state.workspaceFiles = Array.isArray(state.workspaceFiles) ? state.workspaceFiles : [];
    state.folderCategories = state.folderCategories && typeof state.folderCategories === "object"
      ? state.folderCategories
      : {};

    state.styles.forEach(function (style) {
      style.buyer = LEGACY_BUYER[style.buyer] || style.buyer;
      if (style.opd == null) style.opd = "";
      if (style.deliveryDate == null) style.deliveryDate = "";
      if (style.smv == null) style.smv = "";
      if (style.nb == null) style.nb = "";
      if (style.productGroupMaster == null) style.productGroupMaster = "";
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
    const allowed = ["week", "opd", "deliveryDate", "buyer", "brand", "desc", "productGroupMaster", "nb", "picMaster", "smv", "remark"];
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
    if (field === "smv" && value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
      throw new Error("SMV harus berupa angka nol atau lebih.");
    }
    if ((field === "opd" || field === "deliveryDate") && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error("Tanggal harus diisi dengan format yang valid.");
    }

    const previous = style[field];
    style[field] = field === "smv" && value !== "" ? Number(value) : value;
    try {
      persist();
    } catch (error) {
      style[field] = previous;
      throw error;
    }
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
      nb: input.nb || "",
      picMaster: String(input.picMaster || "").trim(),
      smv: input.smv ? Number(input.smv) : "",
      remark: String(input.remark || "").trim(),
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
      persist();
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

  async function addPlannerFile(weekValue, file) {
    if (!file) throw new Error("Pilih file Planner yang akan disimpan.");
    const week = normalizeWeek(weekValue);
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
    try {
      persist();
    } catch (error) {
      B.get().plannerFiles.shift();
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

  async function addStyleFile(styleId, categoryValues, file) {
    const style = B.styleById(styleId);
    if (!style) throw new Error("Style tidak ditemukan.");
    if (!file) throw new Error("Pilih file yang akan diunggah.");
    const categories = Array.from(new Set(Array.isArray(categoryValues) ? categoryValues : [categoryValues]));
    if (!categories.length || categories.some(function (category) {
      return !foldersForBuyer(style.buyer).includes(category);
    })) {
      throw new Error("Pilih folder yang tersedia untuk buyer ini.");
    }

    const priorVersions = B.get().workspaceFiles.filter(function (record) {
      return record.styleId === styleId && record.name === file.name;
    });
    const previous = priorVersions.reduce(function (current, record) {
      return !current || record.version > current.version ? record : current;
    }, null);
    const id = "style-file-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    const record = {
      id: id,
      blobId: id,
      styleId: style.id,
      buyer: style.buyer,
      brand: style.brand,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      version: previous ? previous.version + 1 : 1,
      uploadedAt: new Date().toISOString(),
      uploadedBy: style.picMaster || "Pengguna",
      folders: Array.from(new Set((previous ? previous.folders : []).concat(categories)))
    };

    await storeBlob(id, file);
    B.get().workspaceFiles.unshift(record);
    try {
      persist();
    } catch (error) {
      B.get().workspaceFiles.shift();
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

  B.WORKSPACE_BUYERS = BUYERS;
  B.WORKSPACE_PRODUCT_GROUPS = PRODUCT_GROUPS;
  B.WORKSPACE_DEFAULT_FOLDERS = DEFAULT_FOLDERS;
  B.initWorkspace = ensureWorkspace;
  B.updateMaster = updateMaster;
  B.addMasterStyle = addMasterStyle;
  B.addPlannerFile = addPlannerFile;
  B.normalizeWorkspaceWeek = normalizeWeek;
  B.addFolder = addFolder;
  B.foldersForBuyer = foldersForBuyer;
  B.addStyleFile = addStyleFile;
  B.styleFiles = styleFiles;
  B.latestFolderFile = latestFolderFile;
  B.downloadFile = downloadFile;
})();
