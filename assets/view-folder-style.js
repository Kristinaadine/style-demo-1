/* Folder workspace khusus setiap style */
(function () {
  "use strict";

  const B = window.BRA;
  const K = window.K;

  function view(params) {
    const style = params.id ? B.styleById(params.id) : null;
    if (!style) {
      return '<div class="panel"><div class="empty">Style tidak ditemukan.</div></div>';
    }

    const folders = B.foldersForStyle(style.id);
    K.ui.folderStyleActive = K.ui.folderStyleActive || "";
    if (folders.indexOf(K.ui.folderStyleActive) === -1) K.ui.folderStyleActive = folders[0] || "";
    const activeFolder = K.ui.folderStyleActive;
    const files = B.styleFiles(style.id).filter(function (record) {
      return !activeFolder || (record.folders || []).indexOf(activeFolder) !== -1;
    });

    const folderRows = folders.map(function (folder) {
      const count = B.styleFiles(style.id).filter(function (record) {
        return (record.folders || []).indexOf(folder) !== -1;
      }).length;
      return '<div class="style-folder-item">' +
        '<button type="button" class="folder-tab' + (folder === activeFolder ? ' is-active' : '') + '" data-style-folder="' + K.esc(folder) + '">' +
        '<i class="ti ti-folder" aria-hidden="true"></i><span>' + K.esc(folder) + '</span>' +
        '<span class="folder-tab__count">' + count + '</span></button>' +
        '<div class="style-folder-actions"><button type="button" class="icon-btn" data-rename-style-folder="' + K.esc(folder) + '" title="Rename folder" aria-label="Rename folder ' + K.esc(folder) + '">' +
        '<i class="ti ti-pencil"></i></button><button type="button" class="icon-btn icon-btn--danger" data-delete-style-folder="' + K.esc(folder) + '" title="Delete folder" aria-label="Delete folder ' + K.esc(folder) + '">' +
        '<i class="ti ti-trash"></i></button></div></div>';
    }).join("");

    const fileRows = files.map(function (record) {
      return '<tr><td><div class="strong">' + K.esc(record.name) + '</div><div class="cell-sub">' + K.esc(record.type) + '</div></td>' +
        '<td class="mono">V' + K.esc(record.version) + '</td>' +
        '<td>' + K.esc(K.formatDate(record.uploadedAt)) + '</td>' +
        '<td>' + K.esc(record.uploadedBy) + '</td>' +
        '<td class="mono">' + K.esc(K.formatBytes(record.size)) + '</td>' +
        '<td><div class="file-actions"><button type="button" class="btn btn-primary" data-preview-kind="style" data-blob-id="' + K.esc(record.blobId) +
        '" data-file-name="' + K.esc(record.name) + '" data-file-type="' + K.esc(record.type) + '">' +
        '<i class="ti ti-eye" aria-hidden="true"></i>Preview</button>' +
        '<button type="button" class="btn" data-download-kind="style" data-blob-id="' + K.esc(record.blobId) +
        '" data-file-name="' + K.esc(record.name) + '" data-file-type="' + K.esc(record.type) + '">' +
        '<i class="ti ti-download" aria-hidden="true"></i>Unduh</button>' +
        '<button type="button" class="btn" data-rename-file="style" data-blob-id="' + K.esc(record.blobId) + '" data-file-name="' + K.esc(record.name) + '">' +
        '<i class="ti ti-pencil" aria-hidden="true"></i>Rename</button></div></td></tr>';
    }).join("");

    return '<div class="page-head"><div>' +
      '<p class="eyebrow"><a class="link" href="#/daftar-style">Daftar Style</a> / Folder Style</p>' +
      '<h1 class="page-title">' + K.esc(style.id) + '</h1>' +
      '<p class="page-sub">' + K.esc(style.desc || "") + '</p></div>' +
      '</div>' +
      '<section class="panel style-folder-page"><div class="style-folder-heading"><div><p class="eyebrow">' + K.esc(style.buyer) + '</p>' +
      '<h2>Folder kebutuhan style</h2></div><span class="chip">PIC: ' + K.esc(style.picMaster || "Belum diisi") + '</span></div>' +
      '<div class="style-folder-create"><form class="workspace-form" data-workspace-form="add-style-folder">' +
      '<input type="hidden" name="styleId" value="' + K.esc(style.id) + '">' +
      '<div class="field"><label for="style-folder-name">Nama folder baru</label>' +
      '<input id="style-folder-name" name="name" maxlength="60" required placeholder="Contoh: Pattern, Foto Fitting, BOM"></div>' +
      '<button type="submit" class="btn-primary"><i class="ti ti-folder-plus"></i>Buat folder</button></form></div>' +
      '<div class="folder-browser"><aside class="folder-list"><div class="folder-list__head"><strong>Folder</strong><span>' + folders.length + '</span></div>' +
      (folderRows || '<p class="empty">Belum ada folder. Buat folder terlebih dahulu.</p>') + '</aside>' +
      '<section class="folder-content"><div class="folder-content__head"><div><p class="eyebrow">Folder aktif</p><h3>' + K.esc(activeFolder || "Belum dipilih") + '</h3></div>' +
      '<span class="hint">' + files.length + ' file</span></div>' +
      (activeFolder ? '<form class="workspace-form workspace-upload-form" data-workspace-form="style-folder-file">' +
      '<input type="hidden" name="styleId" value="' + K.esc(style.id) + '">' +
      '<input type="hidden" name="folder" value="' + K.esc(activeFolder) + '">' +
      '<div class="field"><label for="folder-style-file">Pilih file</label><input id="folder-style-file" name="file" type="file" required><p class="field__note">Maksimal 1 GB per berkas.</p></div>' +
      '<button type="submit" class="btn-primary"><i class="ti ti-upload"></i>Unggah file</button></form>' : '') +
      '<div class="table-wrap"><table class="table"><thead><tr><th>Nama file</th><th>Versi</th><th>Diunggah</th><th>PIC</th><th>Ukuran</th><th>Aksi</th></tr></thead>' +
      '<tbody>' + (fileRows || '<tr><td colspan="6" class="empty">Belum ada file pada folder ini.</td></tr>') + '</tbody></table></div>' +
      '</section></div></section>';
  }

  K.views["folder-style"] = view;
})();
