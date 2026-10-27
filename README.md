# BRA Running Style

Demo pengelolaan update Planner, index Data Master, serta file per Buyer dan Style. Aplikasi menggunakan HTML, CSS, dan JavaScript biasa tanpa proses build.

## Menjalankan di localhost

Dengan PHP dari XAMPP:

```powershell
C:\xampp\php\php.exe -S localhost:8123 -t .
```

Buka `http://localhost:8123/`.

## Menu utama

| Menu | Fungsi |
| --- | --- |
| **Planner** | Unggah dan simpan file New Style Updated dengan label minggu, misalnya `WK 11-14`; lihat dan unduh file yang tersimpan. |
| **Data Master** | Gunakan ikon filter pada header tiap kolom untuk mencari nilai pada kolom tersebut. Perbarui Brand, OPD, Delivery Date, PIC, NB/B, SMV, serta Remark. Status Template FRONT-BACK dan Foto Fitting mengikuti file pada folder style. |
| **Daftar Style** | Pilih Buyer dan article/style, telusuri folder fungsi, unggah file, lihat riwayat versi, unduh file, dan tautkan satu file ke beberapa folder. Folder tambahan dapat dibuat per Buyer. |

Product Group tersedia sebagai pilihan/filter: B-Bra, C-Baby Doll, C-Camisole, C-Tankini Top, C-Top, D-Bodysuit, D-Romper, L-Bustier, P-Bikini, P-Brief, P-Hipster, P-Panty, P-Shorty, T-Thong, dan X-Boxer.

## Penyimpanan dan batas demo

- Nilai Planner/Data Master serta metadata folder dan versi disimpan pada `localStorage`; isi file disimpan pada IndexedDB di browser.
- File dapat ditautkan ke beberapa folder dalam satu style tanpa membuat salinan file.
- Penyimpanan ini hanya tersedia pada browser dan perangkat yang sama. Demo ini **belum** tersambung ke server kantor, belum membagikan data antar pengguna, dan belum menerapkan autentikasi atau izin akses server.
- Perubahan data lama dipertahankan saat inisialisasi; field Data Master yang belum ada sebelumnya ditambahkan tanpa menghapus nilai lama. Buyer lama seperti VS, SPANX, dan WACOAL dipetakan ke nama buyer yang digunakan di menu baru.
- Struktur folder awal tersedia per Buyer dan dapat ditambah. Template folder saat ini merupakan daftar awal umum, bukan konfigurasi final dari server kantor.
- Status template/foto hijau saat file tersedia; kuning bila belum ada. Tanggal menampilkan upload terakhir pada folder terkait.

Integrasi produksi tetap memerlukan kontrak API, skema database, lokasi storage, autentikasi, dan aturan akses dari tim IT.

## Struktur berkas aktif

```text
index.html
assets/data.js                Data contoh dan kompatibilitas data lokal
assets/workspace-data.js      Data Master, Planner, metadata folder dan versi
assets/workspace-app.js       Shell aplikasi, navigasi, dan aksi
assets/view-planner.js        Halaman Planner
assets/view-data-master.js    Index dan filter Data Master
assets/view-style-list.js     Folder style dan pengelolaan file
assets/app.css                Sistem visual responsif
assets/vendor/                Font dan ikon lokal
```

Komponen demo lama tidak lagi dimuat di navigasi aplikasi aktif.
