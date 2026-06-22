# E2E & Integration Testing – Mutabaah Mahasiswa STMIK Tazkia

## Ringkasan Proyek

Sistem Self-Monitoring Assessment berbasis **Node.js + Express + MongoDB** dengan frontend **Multi-Page HTML/JS** (tanpa framework). Backend di-serve sebagai static files dari Express, dan autentikasi menggunakan **JWT** yang disimpan di `localStorage`.

### Stack Saat Ini
| Layer | Teknologi |
|---|---|
| Backend | Node.js, Express 5, Mongoose 9 |
| Database | MongoDB Atlas (production) |
| Auth | JWT + bcryptjs |
| Frontend | HTML, Vanilla JS, localStorage |
| Test DB | `mongodb-memory-server` (sudah ada) |
| Test Runner | Jest + Supertest (sudah ada) |
| Rate Limiter | express-rate-limit |
| Role | `mahasiswa`, `pembina`, `admin` |

---

## Analisis Kondisi Testing Saat Ini

### ✅ Yang Sudah Ada
- `tests/setup.js` — MongoDB Memory Server helper (connect/close/clear)
- `tests/integration/auth.integration.test.js` — 4 test cases (register valid, register gagal, login berhasil, login salah password)
- `tests/integration/evaluasi.integration.test.js` — 5 test cases (webhook tanpa token, webhook dengan token, stats mahasiswa, all-stats admin, all-stats forbidden untuk mahasiswa)
- `src/config/db.js` — sudah guard `NODE_ENV === 'test'` (tidak konek DB production)
- `src/app.js` — sudah guard `NODE_ENV !== 'test'` untuk `app.listen()`

### ❌ Yang Belum Ada
- **Playwright E2E tests** (sama sekali belum ada)
- **Test environment file** (`.env.test`)
- Rate limiter bypass untuk testing
- Coverage reporting yang terstruktur
- Test untuk route tambahan: `forgot-password`, `reset-password`
- Test untuk role `pembina`
- Dokumentasi cara menjalankan test

---

## ⚠️ Keamanan Database (KRITIS)

> [!IMPORTANT]
> **TIDAK ADA RISIKO TERHAPUS DATA PRODUCTION.**
> - `db.js` sudah memiliki guard: jika `NODE_ENV === 'test'`, fungsi `connectDB()` langsung `return` tanpa konek ke Atlas.
> - `tests/setup.js` menggunakan `MongoMemoryServer` — database in-memory ephemeral yang terisolasi total dari Atlas.
> - E2E Playwright akan menjalankan backend dengan `NODE_ENV=test`, sehingga juga aman.

> [!WARNING]
> **Rate Limiter Problem:** `authLimiter` dibatasi 10 request/15 menit. Jika E2E test menjalankan banyak login test berulang dari IP yang sama, test ke-11 akan gagal dengan 429. **Solusi:** bypass rate limiter saat `NODE_ENV === 'test'`.

---

## Open Questions

> [!NOTE]
> Tidak ada ambiguitas kritis. Semua keputusan desain dapat ditentukan dari analisis kode:
> - Login menggunakan `identifier` (NIM/No HP/Email) + `password`
> - Redirect berbasis role: `mahasiswa` → `dashboardmahasiswa.html`, `pembina` → `dashboardpembina.html`, `admin` → `dashboardadmin.html`
> - Logout dengan `localStorage.clear()` + redirect ke `/`
> - Assessment (isimutabaah.html): 9 field `<select required>` — submit ke `POST /api/evaluasi/webhook`

---

## Strategi Testing

### Pendekatan Hybrid: Integration Test (Jest) + E2E (Playwright)

```
Backend Integration Tests (Jest + Supertest)  ← Sudah ada, akan diperluas
       ↓ test API layer secara langsung
E2E Tests (Playwright)                        ← Akan dibuat baru
       ↓ test full user journey lewat browser
```

**Mengapa tidak hanya Playwright?**
Playwright E2E butuh server berjalan. Dengan hybrid approach:
- Integration test: cepat, isolated, tidak butuh browser
- E2E Playwright: simulasi nyata, test UI interaction + protected route

### Database Strategy untuk E2E
- Playwright akan menjalankan backend server dengan `NODE_ENV=test`
- Server test akan pakai `MongoMemoryServer` (reuse `setup.js`)
- Tambahkan **special test endpoint** `POST /api/test/seed` dan `POST /api/test/cleanup` yang hanya aktif saat `NODE_ENV=test` untuk setup/teardown data
- `globalSetup` Playwright akan start server + seed initial test data
- `globalTeardown` Playwright akan cleanup + stop server

---

## Proposed Changes

### 1. Backend – Rate Limiter Bypass

#### [MODIFY] [rateLimiter.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/src/middleware/rateLimiter.js)
- Tambahkan kondisi: jika `NODE_ENV === 'test'`, gunakan dummy middleware yang langsung `next()` tanpa pembatasan

---

### 2. Backend – Test Helper Endpoints

#### [NEW] [testHelper.routes.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/src/routes/testHelper.routes.js)
- Route `POST /api/test/seed` — seed user mahasiswa, pembina, admin + data DataMaster
- Route `POST /api/test/cleanup` — hapus semua data test
- Route `GET /api/test/status` — cek apakah server test aktif
- **HANYA aktif jika `NODE_ENV === 'test'`**, dilindungi kondisi di `app.js`

#### [MODIFY] [app.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/src/app.js)
- Register `testHelper.routes.js` dengan guard `process.env.NODE_ENV === 'test'`

---

### 3. Environment Files

#### [NEW] [.env.test](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/.env.test)
```env
NODE_ENV=test
PORT=3001
JWT_SECRET=test_secret_mutabaah_e2e_2026
EMAIL_USER=test@test.com
EMAIL_PASS=testpass
# MONGO_URI tidak diperlukan — MongoMemoryServer yang digunakan
```

---

### 4. Playwright Setup

#### [NEW] [playwright.config.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/playwright.config.js)
- Target: `http://localhost:3001`
- Browser: Chromium (default), Firefox (opsional)
- Global setup/teardown
- Screenshot on failure
- Video on retry
- Reporter: HTML + JSON

#### [NEW] [e2e/global-setup.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/e2e/global-setup.js)
- Start backend dengan `NODE_ENV=test PORT=3001`
- Tunggu server ready
- Seed initial users ke test DB via `POST /api/test/seed`

#### [NEW] [e2e/global-teardown.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/e2e/global-teardown.js)
- Cleanup database via `POST /api/test/cleanup`
- Kill server process

---

### 5. E2E Test Files

#### [NEW] [e2e/auth.spec.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/e2e/auth.spec.js)
**Authentication Tests:**
- `login.berhasil.mahasiswa` — login dengan NIM valid, redirect ke dashboardmahasiswa
- `login.berhasil.admin` — login dengan No HP admin, redirect ke dashboardadmin
- `login.berhasil.pembina` — login dengan No HP pembina, redirect ke dashboardpembina
- `login.gagal.salah_password` — error message tampil
- `login.gagal.user_tidak_ada` — error message tampil
- `login.gagal.field_kosong` — validasi frontend tampil
- `logout.mahasiswa` — klik logout, redirect ke `/`, localStorage bersih
- `logout.admin` — klik logout dari admin dashboard

#### [NEW] [e2e/assessment.spec.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/e2e/assessment.spec.js)
**Assessment Workflow Tests:**
- `assessment.buka_halaman` — akses isimutabaah.html setelah login
- `assessment.isi_semua_field` — pilih semua 9 dropdown `<select>`
- `assessment.submit_berhasil` — submit form, redirect ke dashboard
- `assessment.validasi_field_wajib` — submit dengan field kosong, form tidak submit (HTML5 required)
- `assessment.auto_fill_data_existing` — buka halaman saat data minggu ini sudah ada, cek auto-fill
- `assessment.protected_route` — akses langsung tanpa login, redirect ke `/`

#### [NEW] [e2e/dashboard.spec.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/e2e/dashboard.spec.js)
**Dashboard Tests:**
- `dashboard.mahasiswa.tampil_nama` — `#welcomeName` berisi nama user
- `dashboard.mahasiswa.navigasi_isi_mutabaah` — klik "Isi Sekarang", pindah ke isimutabaah.html
- `dashboard.mahasiswa.navigasi_rekapan` — klik Rekapan, pindah ke rekapan.html
- `dashboard.admin.tampil_menu` — admin dashboard menampilkan 2 menu card
- `dashboard.admin.navigasi_pantau` — klik "Buka Data Pantau", pindah ke adminpantau.html
- `dashboard.pembina.tampil` — pembina dashboard tampil dengan benar

#### [NEW] [e2e/role-access.spec.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/e2e/role-access.spec.js)
**Role-Based Access Tests:**
- `rbac.tanpa_login.dashboard_mahasiswa_redirect` — akses langsung, redirect ke `/`
- `rbac.tanpa_login.isimutabaah_redirect` — akses langsung, redirect ke `/`
- `rbac.tanpa_login.rekapan_redirect` — akses langsung, redirect ke `/`
- `rbac.mahasiswa.tidak_bisa_akses_adminpantau` — localStorage dengan token mahasiswa, test API `/api/evaluasi/all-stats` → 403
- `rbac.admin.bisa_akses_all_stats` — token admin → 200 pada `/api/evaluasi/all-stats`

---

### 6. Integration Tests – Perluasan

#### [MODIFY] [auth.integration.test.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/tests/integration/auth.integration.test.js)
- Tambahkan test: login dengan email (bukan NIM)
- Tambahkan test: user tidak ditemukan → 404
- Tambahkan test: forgot-password (dengan nodemailer mock)

#### [NEW] [evaluasi.extended.integration.test.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/tests/integration/evaluasi.extended.integration.test.js)
- Test role `pembina` dapat akses `all-stats`
- Test upsert (submit ulang minggu yang sama hanya update, tidak duplicate)
- Test `getStats` tanpa NIM query → return `[]`

---

### 7. Struktur Folder Final

```
ProjectWebsite_Mutabaah-Mahasiswa/
├── e2e/                              ← [NEW] E2E Tests (Playwright)
│   ├── global-setup.js
│   ├── global-teardown.js
│   ├── helpers/
│   │   ├── auth.helper.js            ← login/logout helper reusable
│   │   └── db.helper.js              ← seed/cleanup via API
│   ├── auth.spec.js
│   ├── assessment.spec.js
│   ├── dashboard.spec.js
│   └── role-access.spec.js
├── playwright.config.js              ← [NEW]
├── package.json                      ← [MODIFY] tambah Playwright
│
└── backend/
    ├── .env.test                     ← [NEW]
    ├── src/
    │   ├── middleware/
    │   │   └── rateLimiter.js        ← [MODIFY] bypass for test
    │   ├── routes/
    │   │   ├── testHelper.routes.js  ← [NEW] only in test env
    │   │   └── ... (existing)
    │   └── app.js                    ← [MODIFY] register testHelper
    └── tests/
        ├── setup.js                  ← (existing, tidak diubah)
        └── integration/
            ├── auth.integration.test.js           ← [MODIFY]
            ├── evaluasi.integration.test.js       ← (existing)
            └── evaluasi.extended.integration.test.js ← [NEW]
```

---

### 8. NPM Scripts Baru

```json
{
  "scripts": {
    "test": "jest --runInBand --detectOpenHandles --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:all": "npm test && npm run test:e2e",
    "test:report": "playwright show-report"
  }
}
```

---

## Coverage Target

| Area | Integration (Jest) | E2E (Playwright) |
|---|---|---|
| Auth – Login berhasil | ✅ | ✅ (3 role) |
| Auth – Login gagal | ✅ | ✅ |
| Auth – Logout | – | ✅ |
| Auth – Register | ✅ | – |
| Assessment – Buka halaman | – | ✅ |
| Assessment – Isi & Submit | – | ✅ |
| Assessment – Validasi | – | ✅ |
| Assessment – Protected | – | ✅ |
| Dashboard – Tampil data | – | ✅ |
| Dashboard – Navigasi | – | ✅ |
| RBAC – API level | ✅ | ✅ |
| RBAC – UI redirect | – | ✅ |

**Estimasi Coverage:** ~75%+ (melebihi target 70%)

---

## Verification Plan

### Automated Tests
```powershell
# Backend Integration Tests
cd backend
npm test

# E2E Playwright Tests
cd ..
npx playwright test

# Lihat HTML Report
npx playwright show-report
```

### Manual Verification
- Pastikan tidak ada file `.env` yang menggunakan MONGO_URI production saat test
- Verifikasi bahwa `NODE_ENV=test` men-bypass rate limiter
- Verifikasi bahwa setelah `afterEach`, database benar-benar kosong
