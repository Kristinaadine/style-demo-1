# BRA Running Style

Demo pengelolaan update Planner, index Data Master, serta file per Buyer dan Style. Aplikasi menggunakan HTML, CSS, dan JavaScript biasa tanpa proses build.

## Menjalankan di localhost

Aplikasi ini terdiri dari tiga bagian yang harus berjalan bersamaan:

| Bagian | Alamat | Peran |
| --- | --- | --- |
| Frontend (PHP) | `http://localhost:8123` | Menyajikan `index.html` dan aset |
| API (Node.js) | `http://localhost:3001` | Endpoint `/api/*`, dipakai frontend |
| Database (MariaDB) | `127.0.0.1:3306` | Menyimpan `bra_running_style` |

### Cara cepat (satu perintah)

Dari root repo:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
```

Skrip ini menyalakan MariaDB, API Node, dan server PHP; bagian yang sudah
berjalan akan dilewati. Log tersimpan di `.dev-logs/`.

Untuk menghentikan semuanya:

```powershell
powershell -ExecutionPolicy Bypass -File .\stop-dev.ps1
```

MariaDB dihentikan dengan `mysqladmin shutdown`, jadi tidak ada risiko
korupsi data.

### Cara manual

```powershell
# 1. Database (datadir khusus proyek ini)
C:\xampp\mysql\bin\mysqld.exe --defaults-file=C:/xampp/mysql/data_bra_running_style/my.ini --standalone --port=3306 --console

# 2. API
cd server
npm install          # cukup sekali
npm start            # http://localhost:3001

# 3. Frontend (terminal terpisah, dari root repo)
C:\xampp\php\php.exe -S localhost:8123 -t .
```

Buka `http://localhost:8123/`.

### Catatan database

- Konfigurasi API ada di `server/.env` (`DATABASE_TYPE=mysql`,
  `MYSQL_HOST=127.0.0.1`, user `bra_app`). Gunakan `127.0.0.1`, bukan
  `localhost`: user `bra_app` hanya terdaftar untuk host tersebut.
- Datadir MariaDB proyek ini **bukan** `C:\xampp\mysql\data`, melainkan
  `C:\xampp\mysql\data_bra_running_style`. Datadir default XAMPP memakai
  `innodb_log_file_size=5M` sedangkan datadir proyek memakai 48M; menjalankan
  datadir proyek dengan `my.ini` default XAMPP akan gagal dengan
  `Missing MLOG_CHECKPOINT`.
- `api/index.php` adalah jalur API lama berbasis PHP. Frontend sekarang
  memakai API Node (`assets/database-adapter.js`), sehingga `api/index.php`
  hanya perlu jika ingin akses lewat Apache.

## Menu utama

| Menu | Fungsi |
| --- | --- |
| **Planner** | Unggah dan simpan file New Style Updated dengan label minggu, misalnya `WK 11-14`; lihat dan unduh file yang tersimpan. |
| **Data Master** | Gunakan ikon filter pada header tiap kolom untuk mencari nilai pada kolom tersebut. Perbarui Brand, OPD, Delivery Date, PIC, NB/B, SMV, serta Remark. Status Template Photo Running Style dan Foto Fitting mengikuti file pada folder style. |
| **Daftar Style** | Pilih Buyer dan article/style, telusuri folder fungsi, gunakan filter Pilih Jenis Garment (Bra atau Underwear) beserta tipe style, unggah file dengan checkpoint standarisasi, lihat riwayat versi, unduh file, dan tautkan satu file ke beberapa folder. Folder tambahan dapat dibuat per Buyer. |

Product Group tersedia sebagai pilihan/filter: B-Bra, C-Baby Doll, C-Camisole, C-Tankini Top, C-Top, D-Bodysuit, D-Romper, L-Bustier, P-Bikini, P-Brief, P-Hipster, P-Panty, P-Shorty, T-Thong, dan X-Boxer.

## Penyimpanan dan batas demo

- Nilai Planner/Data Master serta metadata folder dan versi disimpan pada `localStorage`; isi file disimpan pada IndexedDB sebagai cache browser.
- Saat Node.js API dan database (MySQL/MariaDB atau PostgreSQL, sesuai `DATABASE_TYPE`) aktif, isi file IndexedDB dimigrasikan otomatis ke tabel `file_blobs` pada setiap sinkronisasi bootstrap/penyimpanan.
- File dapat ditautkan ke beberapa folder dalam satu style tanpa membuat salinan file.
- Penyimpanan ini hanya tersedia pada browser dan perangkat yang sama. Demo ini **belum** tersambung ke server kantor, belum membagikan data antar pengguna, dan belum menerapkan autentikasi atau izin akses server.
- Perubahan data lama dipertahankan saat inisialisasi; field Data Master yang belum ada sebelumnya ditambahkan tanpa menghapus nilai lama. Buyer lama seperti VS, SPANX, dan WACOAL dipetakan ke nama buyer yang digunakan di menu baru.
- Struktur folder awal tersedia per Buyer dan dapat ditambah. Template folder saat ini merupakan daftar awal umum, bukan konfigurasi final dari server kantor.
- Status template/foto hijau saat file tersedia; kuning bila belum ada. Tanggal menampilkan upload terakhir pada folder terkait.

XAMPP/MariaDB menyediakan sinkronisasi state melalui `api/index.php`. Skema relasional ada di `database/schema.sql` dan mencakup buyer, style, folder, file, relasi folder-file, serta riwayat impor. State lengkap tetap disimpan sebagai cadangan sinkronisasi, sedangkan data utama juga dinormalisasi ke tabel relasional agar dapat dipantau di phpMyAdmin. `localStorage` tetap dipakai sebagai fallback browser jika database tidak dapat dihubungi.

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
