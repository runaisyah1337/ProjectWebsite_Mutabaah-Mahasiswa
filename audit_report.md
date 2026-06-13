# Laporan Audit Kode: Mutabaah Mahasiswa

Berikut adalah hasil audit kode komprehensif terhadap proyek Sistem Monitoring Mutaba'ah Mahasiswa STMIK Tazkia. Temuan ini diklasifikasikan berdasarkan **Security**, **Bugs**, **Performance**, dan **Technical Debt**, serta diurutkan berdasarkan tingkat keparahan (prioritas tertinggi hingga terendah).

---

## 1. Masalah Keamanan (Security Issues)

> [!TIP]
> **~~Endpoint Webhook Tidak Terlindungi (KRITIS)~~** ✅ SELESAI DIPERBAIKI
> - **Lokasi:** [`evaluasi.routes.js`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/src/routes/evaluasi.routes.js#L7)
> - **Solusi:** Menambahkan middleware `auth` ke route webhook. Menambahkan validasi otorisasi di controller agar mahasiswa hanya bisa submit data NIM miliknya sendiri (diambil dari JWT token), mencegah pemalsuan data.

> [!TIP]
> **~~Vulnerabilitas Dependensi NPM (TINGGI)~~** ✅ SELESAI DIPERBAIKI
> - **Lokasi:** [`package.json`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/package.json)
> - **Solusi:** Menjalankan `npm audit fix` dan `npm audit fix --force`. Semua 4 kerentanan (mongoose, path-to-regexp, qs, nodemailer) telah ditutup. Hasil audit sekarang: **0 vulnerabilities**.

> [!TIP]
> **~~Variabel Lingkungan `.env` Kurang Lengkap (TINGGI)~~** ✅ SELESAI DIPERBAIKI
> - **Lokasi:** [`README.md`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/README.md)
> - **Solusi:** Memperbarui dokumentasi README dengan menambahkan variabel `EMAIL_USER` dan `EMAIL_PASS` ke contoh konfigurasi `.env`, disertai panduan cara mendapatkan App Password Gmail.

> [!TIP]
> **~~Penyimpanan Token Reset Password (SEDANG)~~** ✅ SELESAI DIPERBAIKI
> - **Lokasi:** [`auth.controller.js`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/src/controllers/auth.controller.js)
> - **Solusi:** Token reset password sekarang di-hash dengan SHA-256 sebelum disimpan ke database. Token plaintext dikirim ke email, tapi yang tersimpan di DB adalah hash-nya. Saat verifikasi, token dari user di-hash ulang lalu dicocokkan.

> [!TIP]
> **~~Tidak Ada Batasan Laju / Rate Limiting (RENDAH)~~** ✅ SELESAI DIPERBAIKI
> - **Lokasi:** [`auth.routes.js`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/src/routes/auth.routes.js) & [`rateLimiter.js`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/src/middleware/rateLimiter.js) *(file baru)*
> - **Solusi:** Menginstal `express-rate-limit` dan membuat middleware rate limiter. Login/register dibatasi 10 request per 15 menit per IP. Forgot-password lebih ketat di 3 request per 15 menit.


---

## 2. Bug Fungsional & Cacat Logika (Bugs)

> [!WARNING]
> **Konflik Event `window.onload` di Dashboard Mahasiswa (TINGGI)**
> - **Lokasi:** [`dashboardmahasiswa.js`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/public/js/dashboardmahasiswa.js)
> - **Masalah:** Terdapat tiga penugasan terpisah untuk `window.onload` pada file yang sama. Penugasan terakhir (`window.onload = updatePeriodeDashboard`) menimpa deklarasi sebelumnya.
> - **Dampak:** Logika penting untuk mengunci tombol pengisian form (`isLocked`) pada akhir pekan dan penyisipan parameter url ke tombol grafik (`rekapLink.href` dan `grafikLink.href`) **tidak pernah tereksekusi**. Hal ini membuat sistem penguncian tidak berfungsi dan link grafik rusak.

> [!WARNING]
> **Fitur Rekap Kelompok Pembina Tidak Berfungsi (TINGGI)**
> - **Lokasi:** [`rekappembina.js`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/public/js/rekappembina.js#L27) & [`User.js`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/src/models/User.js)
> - **Masalah:** File `rekappembina.js` mencoba mengelompokkan mahasiswa menggunakan variabel `s.pembinaName`. Namun, skema Mongoose `User` tidak menyimpan relasi nama pembina, dan endpoint `getAllStats` tidak menyediakannya. 
> - **Dampak:** Seluruh mahasiswa akan selalu dikelompokkan ke dalam kategori *default* `"Tanpa Pembina"`. Selain itu, halaman `rekapanpembina.html` bersifat yatim (*orphan*) dan tidak ditautkan di dashboard manapun.

> [!NOTE]
> **Penyimpanan Field Identifier Gagal (SEDANG)**
> - **Lokasi:** [`auth.controller.js`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/src/controllers/auth.controller.js#L57)
> - **Masalah:** Saat registrasi, terdapat kode `identifier: identifier` yang dimasukkan ke objek `new User`.
> - **Dampak:** Karena `identifier` tidak didefinisikan di `UserSchema`, Mongoose secara otomatis membuang properti ini dan tidak menyimpannya di database Mongoose Atlas. Ini adalah buang-buang pemrosesan walaupun tidak menyebabkan server mati.

---

## 3. Masalah Performa (Performance)

> [!TIP]
> **Proses Agregasi Data Kurang Efisien (SEDANG)**
> - **Lokasi:** [`evaluasi.controller.js` (getAllStats)](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/src/controllers/evaluasi.controller.js#L81-L87)
> - **Masalah:** Aplikasi menarik *seluruh* dokumen `User` mahasiswa dan *seluruh* evaluasi bulanan ke dalam memori aplikasi (RAM) melalui array, kemudian melakukan iterasi, penyaringan (`filter`), dan pemetaan (`map`) secara manual.
> - **Saran:** Hal ini akan membuat beban CPU dan RAM sangat tinggi saat jumlah mahasiswa meningkat drastis. Gunakan fasilitas **MongoDB Aggregation Pipeline** (`$match`, `$group`, `$lookup`) di level database agar query jauh lebih cepat.

---

## 4. Technical Debt & Beban Utang Teknis

> [!NOTE]
> **Duplikasi Logika Kode yang Sangat Banyak (SEDANG)**
> - **Lokasi:** Seluruh folder `public/js/`
> - **Masalah:** Fungsi `getWeekOfMonth()` disalin secara manual ke setidaknya **7 file JavaScript yang berbeda** (`mutabaah.js`, `charts.js`, `admintren.js`, `adminpantau.js`, `rekap.js`, `dashboardpembina.js`, `dashboardmahasiswa.js`).
> - **Saran:** Ini melanggar prinsip *DRY (Don't Repeat Yourself)*. Fungsi ini seharusnya hanya ditulis satu kali dan diakses secara global, misalnya dimasukkan ke dalam [`main.js`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/public/js/main.js).

> [!NOTE]
> ***Hardcode* Nilai Variabel di Frontend (RENDAH)**
> - **Lokasi:** [`admintren.js`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/public/js/admintren.js#L4)
> - **Masalah:** Angka pembagi partisipasi dibuat statis dengan nilai konstanta `const TOTAL_MAHASISWA_KAMPUS = 112;`.
> - **Dampak:** Grafik partisipasi akan menampilkan angka yang keliru di masa depan jika ada mahasiswa yang mendaftar atau keluar, karena persentase dihitung dengan patokan jumlah statis. Angka ini harus ditarik secara dinamis dari database (misal: jumlah `User.countDocuments({ role: 'mahasiswa' })`).
