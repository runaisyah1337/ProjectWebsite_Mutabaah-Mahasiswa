# Panduan Testing – Sistem Mutabaah Mahasiswa STMIK Tazkia

## Struktur Testing

```
ProjectWebsite_Mutabaah-Mahasiswa/
├── e2e/                             ← E2E Tests (Playwright)
│   ├── global-setup.js              ← Start server test + seed data
│   ├── global-teardown.js           ← Cleanup + stop server
│   ├── helpers/
│   │   ├── auth.helper.js           ← Login via UI / via API
│   │   └── db.helper.js             ← Seed & cleanup database
│   ├── auth.spec.js                 ← Test: Login & Logout (10 tests)
│   ├── assessment.spec.js           ← Test: Isi Mutabaah (8 tests)
│   ├── dashboard.spec.js            ← Test: Dashboard semua role (12 tests)
│   └── role-access.spec.js          ← Test: RBAC & Protected Routes (14 tests)
├── playwright.config.js
├── package.json                     ← Root-level scripts
│
└── backend/
    ├── .env.test                    ← Environment khusus test (aman)
    ├── tests/
    │   ├── setup.js                 ← MongoMemoryServer helper
    │   └── integration/
    │       ├── auth.integration.test.js            ← 14 tests
    │       ├── evaluasi.integration.test.js        ← 5 tests
    │       └── evaluasi.extended.integration.test.js ← 12 tests
    └── src/
        ├── middleware/rateLimiter.js   ← Bypass saat NODE_ENV=test
        ├── routes/testHelper.routes.js ← Endpoint seed/cleanup (test-only)
        └── ...
```

---

## Prasyarat

Pastikan sudah terinstall:
- Node.js v18+
- npm

---

## 1. Integration Tests (Jest + Supertest)

Test langsung ke API layer menggunakan database in-memory (MongoMemoryServer).
**Tidak perlu server berjalan.** Jest mengurus semuanya.

```powershell
# Masuk ke folder backend
cd backend

# Jalankan semua integration tests dengan coverage
npm test

# Output yang diharapkan:
# Tests:       31 passed, 31 total
# Coverage:    > 70% statements
```

### Melihat Coverage Report

Setelah `npm test` selesai, buka file HTML coverage:

```powershell
# Buka laporan coverage di browser
start backend/coverage/lcov-report/index.html
```

---

## 2. E2E Tests (Playwright)

Test melalui browser nyata yang mensimulasikan interaksi pengguna.
**Server test dijalankan otomatis** oleh `global-setup.js`.

```powershell
# Dari folder root proyek
cd e:\ProjectWebsite_Mutabaah-Mahasiswa

# Jalankan semua E2E test (headless / tanpa tampilan browser)
npx playwright test

# Atau menggunakan npm script
npm run test:e2e
```

### Mode Lainnya

```powershell
# Jalankan dengan tampilan browser (bisa melihat interaksi secara langsung)
npm run test:e2e:headed

# Buka Playwright UI (pilih test mana yang mau dijalankan)
npm run test:e2e:ui

# Mode debug (step by step, ada inspector)
npm run test:e2e:debug

# Jalankan file spec tertentu saja
npx playwright test e2e/auth.spec.js
npx playwright test e2e/assessment.spec.js

# Jalankan test dengan nama tertentu
npx playwright test --grep "mahasiswa berhasil login"
```

### Melihat HTML Report

```powershell
# Buka laporan E2E test di browser
npm run test:report
# atau
npx playwright show-report
```

---

## 3. Menjalankan Semua Test Sekaligus

```powershell
# Dari root folder — jalankan integration + E2E test berurutan
npm run test:all
```

---

## Daftar Test Cases

### Integration Tests — `backend/tests/integration/`

| File | Deskripsi | Jumlah |
|------|-----------|--------|
| `auth.integration.test.js` | Register, Login (NIM/Email/Case-insensitive), Forgot Password | 14 |
| `evaluasi.integration.test.js` | Webhook, Stats, All-stats (original) | 5 |
| `evaluasi.extended.integration.test.js` | RBAC (admin/pembina/mahasiswa), Upsert, Security (studentId spoofing) | 12 |
| **Total** | | **31** |

### E2E Tests — `e2e/`

| File | Deskripsi | Jumlah |
|------|-----------|--------|
| `auth.spec.js` | Login 3 role, session localStorage, gagal login, logout confirm/dismiss | 10 |
| `assessment.spec.js` | Akses halaman, isi 9 dropdown, submit, validasi required, auto-fill | 8 |
| `dashboard.spec.js` | Mahasiswa (7 tests), Admin (5 tests), Pembina (3 tests) | 15 |
| `role-access.spec.js` | 8 halaman protected redirect, API 401/403/200, token invalid | 16 |
| **Total** | | **~49** |

---

## Database Safety

> ⚠️ **PENTING:** Test TIDAK PERNAH menyentuh database MongoDB Atlas (production).

- **Integration Tests**: Menggunakan `MongoMemoryServer` — database MongoDB in-memory yang berjalan di RAM
- **E2E Tests**: Server test dijalankan dengan `NODE_ENV=test` sehingga `connectDB()` melewati koneksi ke Atlas, dan MongoMemoryServer yang digunakan
- **Cleanup**: Setiap test membersihkan data dengan `afterEach()` agar tidak ada data sisa yang menumpuk

---

## Troubleshooting

### "Server tidak siap setelah 30000ms"
→ Cek apakah port 3001 sudah dipakai proses lain:
```powershell
netstat -ano | findstr :3001
```

### "MongoMemoryServer download failed"
→ MongoMemoryServer memerlukan download binary MongoDB saat pertama kali dijalankan. Pastikan koneksi internet stabil.

### "Rate limiter memblokir test"
→ Pastikan `NODE_ENV=test` aktif. File `rateLimiter.js` sudah dikonfigurasi bypass otomatis.

### Test E2E gagal karena timeout
→ Coba jalankan ulang dengan `--retries 2`:
```powershell
npx playwright test --retries 2
```
