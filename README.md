# BRA Running Style — sistem penyimpanan & pengeditan database

Aplikasi web untuk menyimpan, mengedit, dan mengalokasikan data **running style** lintas departemen: dokumen teknis (Blue Files), sample request, alokasi dokumen per departemen, dan publikasi FRONT/BACK.

Aplikasi berjalan sepenuhnya di browser (HTML + CSS + JavaScript, tanpa build step dan tanpa CDN). Data disimpan di `localStorage` sehingga setiap perubahan benar-benar mengubah data, bukan sekadar tampilan.

## Menjalankan

**Paling cepat (XAMPP)**
1. Letakkan folder ini di dalam `C:\xampp\htdocs\` (mis. `C:\xampp\htdocs\running-style`).
2. Nyalakan Apache di XAMPP.
3. Buka `http://localhost/running-style/`.

**Tanpa Apache** (folder ini sudah di dalam instalasi XAMPP, jadi PHP tersedia):

```powershell
C:\xampp\php\php.exe -S localhost:8123 -t .
```

lalu buka `http://localhost:8123/`.

**Buka langsung**: `index.html` juga bisa dibuka dengan klik dua kali. Semua skrip dimuat sebagai skrip biasa (bukan ES module) sehingga tidak terblokir `file://`.

## Deploy

Karena hanya berkas statis, seluruh folder bisa diunggah apa adanya:

| Target | Cara |
| --- | --- |
| Netlify | Drag & drop folder ini ke app.netlify.com/drop |
| Vercel | `vercel deploy --prod` pada folder ini (tanpa framework) |
| GitHub Pages | Push ke repo, aktifkan Pages pada branch utama |
| Shared hosting / cPanel | Unggah isi folder ke `public_html` |

Yang perlu diunggah: `index.html`, `assets/` (termasuk `assets/vendor/` untuk font dan ikon). Folder `legacy/` hanya arsip prototipe lama dan boleh tidak diunggah.

## Halaman

| Rute | Isi |
| --- | --- |
| `#/tindak-lanjut` | Antrean kerja: dokumen belum ada, verifikasi tertunda, publikasi draft, PIC kosong, alokasi kosong. Panel kanan menyelesaikan item yang dipilih. |
| `#/database` | Daftar style + editor langsung di panel kanan (perubahan tertahan sampai disimpan). |
| `#/edit-sel` | Pengeditan banyak style sekaligus dengan panel “perubahan tertunda” dan validasi. |
| `#/blue-files/:id` | Matriks dokumen × departemen (MD, Pattern Maker, IE-Technical, Production, QA) + publikasi FRONT/BACK. |
| `#/style/:id` | Workspace style: identitas, register dokumen + pemeriksa versi, sample request, riwayat publikasi. |
| `#/pemantauan` | Kelengkapan dokumen, cakupan alokasi, komposisi antrean. |
| `#/impor` | Impor CSV: sumber → pemetaan kolom → rekonsiliasi konflik → konfirmasi. |
| `#/log` | Log aktivitas per jenis tindakan. |

## Aturan domain yang dijaga aplikasi

- Nomor style disimpan sebagai **teks** (nol di depan dipertahankan). Kunci pencocokan impor: style number + buyer.
- Status development dan status produksi **terpisah**.
- Enam kategori dokumen: BOM, Material Estimation, HO, MC (measurement ratio), RA, Foto style.
- Revisi baru masuk sebagai versi berikutnya dengan status *menunggu verifikasi* dan **tidak** menimpa versi yang sudah terverifikasi.
- **Alokasi ≠ persetujuan.** Alokasi menentukan departemen yang boleh memakai suatu versi; status verifikasi tetap terpisah.
- Owner MD-MKT adalah field per style, **bukan** kolom keenam pada matriks alokasi.
- Publikasi FRONT dan BACK diterbitkan terpisah. Draft tidak mengganti versi yang berlaku.
- Impor identitas tidak membuat Sample Request dan tidak memverifikasi dokumen.

## Peran & izin (simulasi)

Gunakan pemilih **Peran** di kanan atas untuk mencoba batas wewenang:

| Peran | Edit data | Edit massal | Impor | Unggah | Verifikasi | Alokasi | Terbitkan |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Administrator | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| MD — pemelihara data | ✓ | ✓ | ✓ | — | — | ✓ | ✓ |
| IE-Technical | ✓ | — | — | ✓ | ✓ | ✓ | ✓ |
| Pattern Maker | ✓ | — | — | ✓ | — | ✓ | — |
| Production / QA | — | — | — | — | — | — | — |

## Format berkas impor

- Format: `.csv`, `.tsv`, atau `.txt`. Pemisah (`;`, `,`, atau tab) dideteksi otomatis; desimal boleh memakai koma (`1,8`).
- Berkas `.xlsx` belum dibaca langsung — ekspor lembar kerja ke CSV lebih dulu.
- Kolom dikenali otomatis dari nama header (`STYLE NO`, `BUYER`, `DEV STATUS`, `MC RATIO`, `PIC PATTERN`, dan seterusnya) dan masih bisa diubah manual.
- Baris tanpa style number, status di luar daftar sah, atau MC di luar 0,5–4,0 akan dikecualikan dan dilaporkan.
- Tombol **Muat contoh CSV** menyediakan berkas contoh lengkap dengan konflik, baris tidak valid, dan duplikat.

## Batasan saat ini

- Penyimpanan hanya di browser (`localStorage`); data tidak dibagi antar pengguna atau perangkat. “Kembalikan data contoh” pada sidebar memuat ulang data awal.
- Unggahan berkas hanya mencatat metadata (nama, ukuran, pengunggah, versi) — isi berkas tidak disimpan dan tidak dikirim ke server.
- Tidak ada autentikasi; peran hanyalah simulasi untuk memperlihatkan batas wewenang.

## Langkah berikutnya menuju produksi

1. Ganti `assets/data.js` dengan API (PHP/MySQL pada XAMPP ini, atau REST terpisah) — fungsi yang perlu dipetakan: `styles`, `docs`, `pubs`, `activity`, `allocate`, `publish`, `commitImport`.
2. Tambah tabel: `styles`, `style_pic`, `documents`, `document_versions`, `allocations`, `publications`, `import_batches`, `activity`.
3. Simpan berkas di disk/objek storage; simpan hash + versi di database agar alokasi menunjuk versi yang tepat.
4. Tambah autentikasi dan pemetaan peran nyata (MD, Pattern Maker, IE-Technical, Production, QA, MD-MKT).

## Struktur berkas

```
index.html              kerangka aplikasi
assets/app.css          sistem visual (navy + lime, Archivo, IBM Plex Mono)
assets/data.js          data contoh, penyimpanan, aturan, mesin impor
assets/ui-core.js       shell, helper, antrean tindak lanjut, pemantauan
assets/view-database.js database style + editor panel
assets/view-cells.js    edit sel massal
assets/view-style.js    workspace style + matriks alokasi
assets/view-ops.js      impor, pemantauan, log aktivitas
assets/router.js        router berbasis hash
assets/actions.js       delegasi klik/form + modal + toast
assets/actions-db.js    aksi database & edit sel
assets/actions-style.js aksi workspace & alokasi
assets/actions-ops.js   aksi impor & log
assets/vendor/          font Archivo & IBM Plex Mono, ikon Tabler (lokal)
legacy/                 prototipe v0.1 (arsip)
```
