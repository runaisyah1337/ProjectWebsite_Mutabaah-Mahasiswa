# 🧪 PANDUAN TESTING — Sistem Mutabaah Mahasiswa STMIK Tazkia

Panduan lengkap untuk setup dan menjalankan semua test dari awal (fresh install).

---

## 📋 DAFTAR ISI

1. [Prasyarat & Dependencies](#1-prasyarat--dependencies)
2. [Setup Awal (Wajib Sebelum Test)](#2-setup-awal-wajib-sebelum-test)
3. [Integration Tests (Jest)](#3-integration-tests-jest)
4. [E2E Tests (Playwright)](#4-e2e-tests-playwright)
5. [Menjalankan Semua Test Sekaligus](#5-menjalankan-semua-test-sekaligus)
6. [Struktur File Testing](#6-struktur-file-testing)
7. [Daftar Test Cases](#7-daftar-test-cases)
8. [Keamanan Database saat Testing](#8-keamanan-database-saat-testing)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. PRASYARAT & DEPENDENCIES

### Software yang Harus Terinstall

| Software | Versi Minimum | Link Download | Cek Instalasi |
|----------|--------------|---------------|---------------|
| **Node.js** | v18 LTS | https://nodejs.org | `node -v` |
| **npm** | Termasuk Node.js | (termasuk Node.js) | `npm -v` |
| **Git** | Terbaru | https://git-scm.com | `git --version` |

> ⚠️ **Penting**: `mongodb-memory-server` akan mengunduh binary MongoDB (~100MB) saat pertama kali dijalankan. Pastikan koneksi internet stabil.

### Dependencies Testing (Sudah Terdefinisi di `package.json`)

**Root Level** (`package.json` — untuk E2E):

| Package | Versi | Fungsi |
|---------|-------|--------|
| `@playwright/test` | ^1.61.0 | Framework E2E testing |
| `cross-env` | ^10.1.0 | Set env variable lintas OS (Windows/Mac/Linux) |

**Backend Level** (`backend/package.json` — untuk Integration):

| Package | Versi | Fungsi |
|---------|-------|--------|
| `jest` | ^30.4.2 | Test runner untuk integration test |
| `supertest` | ^7.2.2 | HTTP client untuk test API endpoint |
| `mongodb-memory-server` | ^11.2.0 | MongoDB in-memory (tidak menyentuh database production) |

---

## 2. SETUP AWAL (WAJIB SEBELUM TEST)

Lakukan langkah berikut **satu kali** setelah clone repo atau setelah menghapus `node_modules`.

### Langkah 1 — Install dependencies backend

```powershell
cd backend
npm install
```

### Langkah 2 — Install dependencies E2E (dari root proyek)

```powershell
# Kembali ke folder root
cd ..

npm install
```

### Langkah 3 — Install browser Playwright

```powershell
# Install browser Chromium yang digunakan Playwright
npx playwright install chromium
```

> Langkah ini hanya perlu dilakukan sekali. Browser Playwright berbeda dari browser biasa dan perlu diunduh secara terpisah (~150MB).

### Langkah 4 — Pastikan file `.env.test` ada di folder `backend/`

File ini **sudah ada di repository** dan tidak perlu dibuat ulang. Isinya:

```env
NODE_ENV=test
PORT=3001
JWT_SECRET=test_secret_mutabaah_e2e_2026
EMAIL_USER=test@test.com
EMAIL_PASS=testpass
# MONGO_URI tidak diisi — MongoMemoryServer yang digunakan saat test
```

> ✅ File `.env.test` sudah aman untuk di-commit karena tidak mengandung kredensial production.

---

## 3. INTEGRATION TESTS (JEST)

Test langsung ke layer API menggunakan database in-memory (MongoMemoryServer).
**Server tidak perlu dijalankan manual.** Jest mengurus semuanya.

### Cara Menjalankan

```powershell
# Masuk ke folder backend
cd backend

# Jalankan semua integration tests dengan laporan coverage
npm test
```

### Output yang Diharapkan

```
 PASS  tests/integration/auth.integration.test.js
 PASS  tests/integration/evaluasi.integration.test.js
 PASS  tests/integration/evaluasi.extended.integration.test.js

Tests:       31 passed, 31 total
Snapshots:   0 total
Time:        ~15s
Coverage:    > 70% statements
```

### Melihat Laporan Coverage

Setelah `npm test` selesai, laporan HTML tersedia di:

```powershell
# Buka di browser (Windows)
start backend\coverage\lcov-report\index.html
```

---

## 4. E2E TESTS (PLAYWRIGHT)

Test melalui browser nyata (Chromium) yang mensimulasikan interaksi pengguna secara penuh.
**Server test dijalankan dan dihentikan otomatis** oleh `global-setup.js` dan `global-teardown.js`.

### Cara Menjalankan

```powershell
# Dari folder ROOT proyek (bukan dari backend/)
cd e:\ProjectWebsite_Mutabaah-Mahasiswa

# Headless (tanpa tampilan browser, lebih cepat) — DIREKOMENDASIKAN
npm run test:e2e
# atau
npx playwright test
```

### Mode Lainnya

```powershell
# Dengan tampilan browser — cocok untuk demo/observasi
npm run test:e2e:headed

# Dengan tampilan browser tapi lebih cepat (tanpa slowMo)
npm run test:e2e:headed:fast

# Buka Playwright UI — pilih dan jalankan test secara interaktif
npm run test:e2e:ui

# Mode debug step-by-step dengan Playwright Inspector
npm run test:e2e:debug
```

### Menjalankan File atau Test Tertentu

```powershell
# Jalankan satu file spec saja
npx playwright test e2e/auth.spec.js
npx playwright test e2e/assessment.spec.js
npx playwright test e2e/dashboard.spec.js
npx playwright test e2e/role-access.spec.js

# Jalankan test berdasarkan nama (grep)
npx playwright test --grep "mahasiswa berhasil login"
npx playwright test --grep "admin"
```

### Melihat HTML Report

```powershell
# Buka laporan E2E di browser
npm run test:report
# atau
npx playwright show-report
```

---

## 5. MENJALANKAN SEMUA TEST SEKALIGUS

```powershell
# Dari folder root — jalankan integration tests lalu E2E tests secara berurutan
npm run test:all
```

Urutan eksekusi:
1. Integration tests (`cd backend && npm test`)
2. E2E tests (`playwright test`)

---

## 6. STRUKTUR FILE TESTING

```
ProjectWebsite_Mutabaah-Mahasiswa/
│
├── package.json                    ← Scripts root + dependencies E2E
├── playwright.config.js            ← Konfigurasi Playwright (timeout, browser, dll.)
│
├── e2e/                            ← E2E Tests (Playwright)
│   ├── global-setup.js             ← Start server test + seed data awal
│   ├── global-teardown.js          ← Cleanup database + stop server
│   ├── helpers/
│   │   ├── auth.helper.js          ← Helper: login via UI atau via API
│   │   └── db.helper.js            ← Helper: seed & cleanup database
│   ├── auth.spec.js                ← Test: Login & Logout (10 test)
│   ├── assessment.spec.js          ← Test: Isi Mutabaah (8 test)
│   ├── dashboard.spec.js           ← Test: Dashboard semua role (15 test)
│   └── role-access.spec.js         ← Test: RBAC & Protected Routes (16 test)
│
└── backend/
    ├── .env.test                   ← Konfigurasi environment khusus test
    ├── package.json                ← Dependencies backend + scripts test
    └── tests/
        ├── setup.js                ← Helper MongoMemoryServer
        └── integration/
            ├── auth.integration.test.js              ← 14 test
            ├── evaluasi.integration.test.js          ← 5 test
            └── evaluasi.extended.integration.test.js ← 12 test
```

---

## 7. DAFTAR TEST CASES

### Integration Tests — `backend/tests/integration/`

| File | Deskripsi | Jumlah |
|------|-----------|--------|
| `auth.integration.test.js` | Register, Login (NIM/Email/case-insensitive), Lupa Sandi | 14 |
| `evaluasi.integration.test.js` | Webhook, Stats, All-stats (original) | 5 |
| `evaluasi.extended.integration.test.js` | RBAC (admin/pembina/mahasiswa), Upsert, Security (studentId spoofing) | 12 |
| **Total** | | **31** |

### E2E Tests — `e2e/`

| File | Deskripsi | Jumlah |
|------|-----------|--------|
| `auth.spec.js` | Login 3 role, session localStorage, gagal login, logout confirm/dismiss | 10 |
| `assessment.spec.js` | Akses halaman, isi 9 dropdown, submit, validasi required, auto-fill | 8 |
| `dashboard.spec.js` | Mahasiswa (7 test), Admin (5 test), Pembina (3 test) | 15 |
| `role-access.spec.js` | 8 halaman protected redirect, API 401/403/200, token invalid | 16 |
| **Total** | | **~49** |

---

## 8. KEAMANAN DATABASE SAAT TESTING

> ⚠️ **Test TIDAK PERNAH menyentuh database MongoDB Atlas (production).**

| Jenis Test | Database yang Digunakan |
|------------|------------------------|
| **Integration Tests** | `MongoMemoryServer` — MongoDB in-memory di RAM, mati saat proses selesai |
| **E2E Tests** | `MongoMemoryServer` — Server test jalan dengan `NODE_ENV=test`, `connectDB()` otomatis skip koneksi Atlas |

Setiap test membersihkan data dengan `afterEach()` / `afterAll()` sehingga tidak ada data sisa.

---

## 9. TROUBLESHOOTING

### ❌ "Cannot find module '@playwright/test'"
```powershell
# Install ulang dependencies root
npm install

# Install ulang browser Playwright
npx playwright install chromium
```

### ❌ "Cannot find module 'jest'" atau "jest: command not found"
```powershell
# Install ulang dependencies backend
cd backend
npm install
```

### ❌ "Server tidak siap setelah 30000ms"
Port 3001 mungkin sudah dipakai proses lain:
```powershell
# Cek proses yang menggunakan port 3001
netstat -ano | findstr :3001

# Kill proses berdasarkan PID (ganti 12345 dengan PID yang ditemukan)
taskkill /PID 12345 /F
```

### ❌ "MongoMemoryServer download failed" atau "MongoMemoryServer timeout"
Binary MongoDB untuk `mongodb-memory-server` perlu diunduh ~100MB saat pertama kali.
- Pastikan koneksi internet stabil
- Coba jalankan ulang setelah koneksi stabil

### ❌ "Rate limiter memblokir test"
Pastikan `NODE_ENV=test` aktif. File `backend/.env.test` sudah dikonfigurasi untuk ini.
```powershell
# Cek apakah .env.test ada
ls backend/.env.test
```

### ❌ Test E2E gagal karena timeout
```powershell
# Jalankan ulang dengan retry
npx playwright test --retries 2

# Atau jalankan dalam mode headed untuk melihat apa yang terjadi
npm run test:e2e:headed:fast
```

### ❌ "Browser not found" saat Playwright
```powershell
# Install ulang browser Playwright
npx playwright install chromium

# Jika masih gagal, install semua browser
npx playwright install
```
