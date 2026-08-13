# Rencana Implementasi Automated Testing

Mengikuti permintaan Anda untuk mengimplementasikan Functional & Integration Test dengan _tool_ yang paling baik, saya merekomendasikan **kombinasi Jest, Supertest, dan mongodb-memory-server**.

> [!TIP]
> **Alasan Pemilihan Tool (Kenapa tidak murni Playwright?):**
> Untuk mendapatkan **metrik code coverage backend** yang akurat dan stabil (mencapai target 50%), menggunakan Supertest jauh lebih baik daripada Playwright. Supertest berinteraksi langsung dengan memori aplikasi Express Anda, sehingga `jest --coverage` bisa langsung menghitung baris kode backend yang tereksekusi secara akurat tanpa perlu pengaturan kompleks seperti *NYC/Istanbul instrumenting* yang sangat rentan error jika dilakukan via Playwright.

Kita akan fokus pada pengujian *Integration* API (Functional API Testing) dari _request_ awal hingga perubahan data di MongoDB.

## User Review Required

> [!IMPORTANT]
> **Modifikasi pada `app.js` dan `db.js`**
> Agar aplikasi bisa dites oleh Supertest tanpa membuka _port_ sungguhan (menghindari error `EADDRINUSE`) dan tanpa merusak database MongoDB Atlas Anda, saya perlu sedikit mengubah `src/app.js` dan `src/config/db.js`.
> 1. Di `app.js`, eksekusi `app.listen()` hanya akan berjalan jika `NODE_ENV !== 'test'`. Selain itu, saya akan menambahkan `module.exports = app;`.
> 2. Di `db.js`, koneksi ke Mongo Atlas akan ditunda jika `NODE_ENV === 'test'`, karena database tes akan menggunakan `mongodb-memory-server` yang dijalankan otomatis oleh Jest.
> 
> **Apakah Anda setuju dengan perubahan struktur inisialisasi server ini?**

## Proposed Changes

---

### Konfigurasi & Dependensi

Saya akan menginstal modul testing yang diperlukan (hanya untuk `devDependencies`):
- `jest`
- `supertest`
- `mongodb-memory-server`

#### [MODIFY] [package.json](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/package.json)
Menambahkan script `"test": "jest --runInBand --detectOpenHandles --coverage"` untuk menjalankan test beserta laporan _coverage_. Menambahkan konfigurasi Jest environment.

### Modifikasi Backend Core (Testability)

#### [MODIFY] [app.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/src/app.js)
Menambahkan pengecekan `process.env.NODE_ENV !== 'test'` untuk blok `app.listen` dan menambahkan `module.exports = app`.

#### [MODIFY] [db.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/src/config/db.js)
Memastikan `mongoose.connect` tidak dijalankan langsung ke URI produksi saat `NODE_ENV === 'test'`.

### Skrip Pengujian (Integration Tests)

#### [NEW] [testSetup.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/tests/testSetup.js)
Skrip konfigurasi awal (*Global Setup*) Jest untuk menjalankan instance `mongodb-memory-server` di memori sebelum tes berjalan.

#### [NEW] [auth.integration.test.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/tests/integration/auth.integration.test.js)
Membuat skenario pengujian API untuk:
1. Registrasi pengguna sukses (dengan mocking DataMaster).
2. Login pengguna sukses.
3. Login pengguna gagal (sandi salah).
**(Skenario ini akan memberikan cakupan tinggi pada `auth.controller.js`).**

#### [NEW] [evaluasi.integration.test.js](file:///e:/ProjectWebsite_Mutabaah-Mahasiswa/backend/tests/integration/evaluasi.integration.test.js)
Membuat skenario pengujian API untuk:
1. Penolakan submit webhook jika tidak memiliki token JWT.
2. Submit evaluasi mingguan dengan JWT yang valid.
**(Skenario ini memberikan cakupan tinggi pada `evaluasi.controller.js` dan `middleware/auth.js`).**

## Verification Plan

### Automated Tests
- Menjalankan `npm run test` di folder `backend`.
- Memastikan laporan _Code Coverage_ dicetak ke terminal dengan indikator persentase baris kode `> 50%` untuk file `auth.controller.js` dan `evaluasi.controller.js`.
- Semua _test case_ berstatus `PASS`.
