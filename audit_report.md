# Laporan Audit Kode: Mutabaah Mahasiswa

Berikut adalah hasil audit kode komprehensif terhadap proyek Sistem Monitoring Mutaba'ah Mahasiswa STMIK Tazkia. Temuan ini diklasifikasikan berdasarkan **Security**, **Bugs**, **Performance**, dan **Technical Debt**, serta diurutkan berdasarkan tingkat keparahan (prioritas tertinggi hingga terendah).

---

## 1. Masalah Keamanan (Security Issues)

> [!CAUTION]
> **Endpoint Webhook Tidak Terlindungi (KRITIS)**
> - **Lokasi:** [`evaluasi.routes.js`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/src/routes/evaluasi.routes.js#L7)
> - **Masalah:** Route `POST /api/evaluasi/webhook` tidak menggunakan middleware `auth`.
> - **Dampak:** Siapa saja dapat mengirimkan HTTP POST request ke endpoint ini untuk memodifikasi atau memalsukan data evaluasi/amalan mahasiswa lain hanya dengan menebak `studentId`.

> [!IMPORTANT]
> **Vulnerabilitas Dependensi NPM (TINGGI)**
> - **Lokasi:** [`package.json`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/package.json)
> - **Masalah:** Hasil `npm audit` menunjukkan 4 kerentanan (2 High, 2 Moderate), termasuk potensi NoSQL Injection di `mongoose` (versi 9.1.1) dan ReDoS (Regular Expression Denial of Service) di `path-to-regexp` (dependensi Express).
> - **Saran:** Segera jalankan `npm audit fix` untuk memperbarui dependensi ke versi aman.

> [!WARNING]
> **Variabel Lingkungan `.env` Kurang Lengkap (TINGGI)**
> - **Lokasi:** [`auth.controller.js`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/src/controllers/auth.controller.js#L134) & [`README.md`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/README.md)
> - **Masalah:** Fitur lupa kata sandi menggunakan `process.env.EMAIL_USER` dan `process.env.EMAIL_PASS` untuk Nodemailer, namun variabel ini tidak diinstruksikan dalam konfigurasi `.env` di file README.
> - **Dampak:** Jika pengguna baru mengikut panduan README, fitur lupa sandi akan gagal dan menyebabkan server error saat mengirim email.

> [!NOTE]
> **Penyimpanan Token Reset Password (SEDANG)**
> - **Lokasi:** [`auth.controller.js`](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/src/controllers/auth.controller.js#L127)
> - **Masalah:** `resetPasswordToken` disimpan dalam bentuk *plaintext* (teks asli) di database Mongoose.
> - **Dampak:** Jika database bocor, penyerang dapat menggunakan token reset yang masih aktif untuk mengambil alih akun. Sebaiknya token ini di-*hash* sebelum disimpan.

> [!NOTE]
> **Tidak Ada Batasan Laju (Rate Limiting) (RENDAH)**
> - **Lokasi:** Semua route autentikasi
> - **Masalah:** Route `/login`, `/register`, dan `/forgot-password` tidak dilindungi oleh *rate limiter*.
> - **Dampak:** Rentan terhadap serangan *brute force* dan pengiriman email massal (Spamming) pada fitur lupa sandi.

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
