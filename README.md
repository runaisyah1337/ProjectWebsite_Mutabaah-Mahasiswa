# 📚 SISTEM MONITORING MUTABA'AH MAHASISWA — STMIK TAZKIA

Aplikasi pemantauan amalan ibadah harian mahasiswa berbasis web. Dirancang untuk memudahkan evaluasi spiritual secara mandiri dan transparan antara mahasiswa, pembina, dan admin.

---

## 🚀 FITUR UTAMA

| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard Dinamis** | Menampilkan periode minggu berjalan secara otomatis |
| **Visualisasi Data** | Grafik persentase capaian amalan menggunakan Chart.js |
| **Rekapan & Riwayat** | Mahasiswa dapat melihat catatan amalan yang telah diisi |
| **Multi-User** | Login terpisah untuk Mahasiswa, Pembina, dan Admin |
| **Lupa Sandi** | Reset password via email (nodemailer + Gmail App Password) |

---

## 🛠️ PANDUAN INSTALASI (FRESH SETUP)

Ikuti langkah-langkah ini secara berurutan untuk menjalankan aplikasi dari nol.

### 1. PRASYARAT — Software yang Harus Terinstall

Pastikan semua software berikut sudah terpasang sebelum melanjutkan:

| Software | Versi | Link Download | Cek Instalasi |
|----------|-------|---------------|---------------|
| **Node.js** | v18 LTS atau lebih baru | https://nodejs.org | `node -v` |
| **npm** | Sudah termasuk dalam Node.js | (termasuk Node.js) | `npm -v` |
| **Git** | Versi terbaru | https://git-scm.com | `git --version` |

> **Koneksi Internet** juga diperlukan karena database menggunakan MongoDB Atlas.

---

### 2. CLONE REPOSITORY

```bash
git clone https://github.com/runaisyah1337/ProjectWebsite_Mutabaah-Mahasiswa
cd ProjectWebsite_Mutabaah-Mahasiswa
```

---

### 3. INSTALL DEPENDENCIES BACKEND

```bash
cd backend
npm install
```

Perintah ini akan menginstall semua package yang tercantum di `backend/package.json`:

**Dependencies (Production):**
| Package | Versi | Fungsi |
|---------|-------|--------|
| `express` | ^5.2.1 | Framework web / HTTP server |
| `mongoose` | ^9.1.1 | ODM untuk MongoDB |
| `jsonwebtoken` | ^9.0.3 | Autentikasi JWT |
| `bcrypt` | ^6.0.0 | Hash password |
| `bcryptjs` | ^3.0.3 | Hash password (fallback) |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing |
| `dotenv` | ^17.2.3 | Membaca file `.env` |
| `express-rate-limit` | ^8.5.2 | Pembatasan request per IP |
| `nodemailer` | ^8.0.11 | Kirim email (fitur lupa sandi) |

**DevDependencies (Hanya untuk testing):**
| Package | Versi | Fungsi |
|---------|-------|--------|
| `jest` | ^30.4.2 | Test runner integration test |
| `supertest` | ^7.2.2 | HTTP assertions untuk test API |
| `mongodb-memory-server` | ^11.2.0 | MongoDB in-memory (aman, tidak menyentuh Atlas) |

---

### 4. KONFIGURASI FILE `.env`

Buat file bernama `.env` di dalam folder `backend/` (sejajar dengan `package.json`):

```
backend/
├── .env          ← Buat file ini
├── package.json
└── src/
```

Isi file `.env` dengan konfigurasi berikut:

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mutabaah_db?retryWrites=true&w=majority
JWT_SECRET=rahasia_tazkia_2026

# Konfigurasi Email untuk fitur Lupa Sandi (wajib diisi)
EMAIL_USER=email_pengirim@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```

**Cara mengisi setiap variabel:**

| Variabel | Cara Mendapatkan |
|----------|-----------------|
| `MONGO_URI` | Buka [MongoDB Atlas](https://cloud.mongodb.com) → Cluster → Connect → Drivers. Salin connection string-nya |
| `JWT_SECRET` | Isi bebas (string acak yang susah ditebak) |
| `EMAIL_USER` | Alamat Gmail yang akan digunakan sebagai pengirim |
| `EMAIL_PASS` | **App Password** Google (bukan password Gmail biasa) — buat di https://myaccount.google.com/apppasswords (butuh 2-Step Verification aktif) |

> ⚠️ Di MongoDB Atlas, atur **Network Access** ke `0.0.0.0/0` (Allow Access from Anywhere) agar koneksi dari laptop lokal tidak diblokir.

---

### 5. MENJALANKAN APLIKASI

```bash
# Dari folder backend/
npm start
```

Buka browser dan akses: **http://localhost:3000**

> Untuk mode development dengan auto-restart saat file berubah:
> ```bash
> npm run dev
> ```
> *(Memerlukan `nodemon` terinstall global: `npm install -g nodemon`)*

---

## 📂 STRUKTUR PROYEK

```
ProjectWebsite_Mutabaah-Mahasiswa/
│
├── backend/                     ← Backend Node.js/Express
│   ├── .env                     ← Konfigurasi lokal (JANGAN di-commit ke Git)
│   ├── .env.test                ← Konfigurasi khusus test (sudah ada di repo)
│   ├── package.json             ← Dependencies backend
│   ├── src/
│   │   ├── app.js               ← Entry point aplikasi
│   │   ├── server-test.js       ← Entry point server khusus testing
│   │   ├── config/              ← Konfigurasi database
│   │   ├── controllers/         ← Logic handler API
│   │   ├── middleware/          ← Middleware (auth, rate limiter)
│   │   ├── models/              ← Schema database (Mongoose)
│   │   └── routes/              ← Definisi endpoint API
│   └── tests/                   ← Integration tests (Jest)
│       ├── setup.js
│       └── integration/
│
├── e2e/                         ← E2E tests (Playwright)
│   ├── global-setup.js
│   ├── global-teardown.js
│   ├── helpers/
│   ├── auth.spec.js
│   ├── assessment.spec.js
│   ├── dashboard.spec.js
│   └── role-access.spec.js
│
├── public/                      ← Frontend (HTML, CSS, JS)
│   └── js/                      ← Logika JavaScript frontend
│
├── playwright.config.js         ← Konfigurasi Playwright E2E
├── package.json                 ← Scripts dan dependencies E2E (root)
├── README.md                    ← Panduan ini
└── TESTING.md                   ← Panduan khusus testing
```

---

## 📖 PANDUAN PENGGUNAAN (USER MANUAL)

### A. MAHASISWA AREA
- **LOGIN**: Masuk menggunakan email/NIM dan password yang terdaftar.
- **ISI MUTABA'AH**: Klik tombol "Isi Sekarang". Isi sesuai capaian amalan.
- **MONITORING**: Cek menu "Grafik" untuk melihat persentase keberhasilan ibadah minggu ini.
- **LOG OUT**: Tekan tombol keluar dan konfirmasi pada jendela pesan.

### B. PEMBINA AREA
- Memantau perkembangan anak binaan.
- Melihat rekap mutaba'ah per minggu.

### C. ADMIN AREA
- **Pantau Statistik**: Lihat grafik global mahasiswa untuk mengetahui tren ibadah.
- **Indikator Warna**:
  - 🟢 **HIJAU**: Capaian ≥ 85% (Sangat Baik)
  - 🟡 **KUNING**: Capaian 50%–84% (Perlu Ditingkatkan)
  - 🔴 **MERAH**: Capaian < 50% (Perlu Perhatian/Pembinaan)

---

## 👥 Tim Pengembang

| Nama | Peran |
|------|-------|
| Aisyah | Backend & Database |
| Abdurrahman Fathi Mubarok | Backend & Testing |
| Destri Komalasari | Frontend |
| Mutiara Adinda | Frontend |

---

## 📞 Kontak & Kontribusi

Jika menemukan bug atau ingin mengembangkan fitur, silakan hubungi tim pengembang atau buat *Issue* / *Pull Request* melalui repository ini.
