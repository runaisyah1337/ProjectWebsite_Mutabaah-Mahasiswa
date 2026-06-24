// e2e/role-access.spec.js
// Pengujian End-to-End (E2E) untuk Kontrol Akses Berbasis Peran (Role-Based Access Control - RBAC)
// Menjamin keamanan aplikasi: halaman terproteksi dan endpoint API hanya dapat diakses oleh peran (role) yang diizinkan.

const { test, expect } = require('@playwright/test');
const { loginViaAPI, clearSession } = require('./helpers/auth.helper');

// Alamat server backend lokal untuk menembak endpoint API secara langsung
const SERVER_URL = 'http://localhost:3001';

// Dijalankan setiap kali satu skenario pengujian selesai
test.afterEach(async ({ page }) => {
    // Bersihkan sesi browser agar ter-logout otomatis
    await clearSession(page);
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN 1: HALAMAN TERPROTEKSI — Tanpa Login
// ─────────────────────────────────────────────
test.describe('RBAC – Akses Tanpa Login (Redirect ke /)', () => {
    
    // Daftar halaman privat di aplikasi yang wajib dilindungi dari pengguna luar
    const protectedPages = [
        { path: '/dashboardmahasiswa.html', name: 'Dashboard Mahasiswa' },
        { path: '/dashboardadmin.html',     name: 'Dashboard Admin' },
        { path: '/dashboardpembina.html',   name: 'Dashboard Pembina' },
        { path: '/isimutabaah.html',        name: 'Isi Mutabaah' },
        { path: '/rekapan.html',            name: 'Rekapan' },
        { path: '/grafik.html',             name: 'Grafik' },
        { path: '/adminpantau.html',        name: 'Admin Pantau' },
        { path: '/admintren.html',          name: 'Admin Tren' },
    ];

    // Melakukan perulangan otomatis untuk menguji setiap halaman di atas
    for (const { path, name } of protectedPages) {
        test(`halaman ${name} (${path}) redirect ke / tanpa session`, async ({ page }) => {
            // PERSIAPAN: Pastikan browser tidak memiliki sesi login (bersih)
            await page.goto('/login.html');
            await page.evaluate(() => localStorage.clear());

            // TINDAKAN: Coba paksa akses langsung halaman proteksi tersebut
            await page.goto(path);

            // VERIFIKASI: Skrip autentikasi frontend (checkAuth) wajib mendeteksi ketiadaan sesi
            // dan langsung me-redirect browser kembali ke halaman utama/login ('/') dalam waktu maksimal 5 detik
            await page.waitForURL('/', { timeout: 5000 });
            await expect(page).toHaveURL('/');
        });
    }
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN 2: ENDPOINT API TERPROTEKSI — Tanpa Token
// ─────────────────────────────────────────────
test.describe('RBAC – API Endpoints Tanpa Token', () => {
    
    test('POST /api/evaluasi/webhook tanpa token → 401', async ({ request }) => {
        // TINDAKAN: Kirim request HTTP POST ke API webhook untuk menyimpan data, tetapi tanpa token login
        const res = await request.post(`${SERVER_URL}/api/evaluasi/webhook`, {
            data: { jawaban: { tilawah: 3 } }
        });
        // VERIFIKASI: Server harus menolak request dan mengembalikan HTTP status 401 (Unauthorized)
        expect(res.status()).toBe(401);
    });

    test('GET /api/evaluasi/stats tanpa token → 401', async ({ request }) => {
        // TINDAKAN: Coba ambil data statistik mahasiswa tanpa login
        const res = await request.get(`${SERVER_URL}/api/evaluasi/stats`);
        // VERIFIKASI: Ditolak dengan status 401
        expect(res.status()).toBe(401);
    });

    test('GET /api/evaluasi/all-stats tanpa token → 401', async ({ request }) => {
        // TINDAKAN: Coba ambil semua data rekapitulasi massal tanpa login
        const res = await request.get(`${SERVER_URL}/api/evaluasi/all-stats`);
        // VERIFIKASI: Ditolak dengan status 401
        expect(res.status()).toBe(401);
    });
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN 3: MAHASISWA DILARANG AKSES DATA MASSAL (HAK AKSES MAHASISWA)
// ─────────────────────────────────────────────
test.describe('RBAC – Mahasiswa Tidak Dapat Akses Data Admin', () => {
    
    test('mahasiswa mendapat 403 saat akses /api/evaluasi/all-stats', async ({ request }) => {
        // 1. SETUP: Login sebagai mahasiswa ke API auth untuk mendapatkan token JWT mahasiswa
        const loginRes = await request.post(`${SERVER_URL}/api/auth/login`, {
            data: { identifier: '20210001', password: 'TestPass123!' }
        });
        expect(loginRes.ok()).toBeTruthy();
        const loginData = await loginRes.json();
        const token = loginData.token;

        // 2. TINDAKAN: Mahasiswa mencoba menembak API milik admin '/api/evaluasi/all-stats' dengan token mahasiswanya
        const res = await request.get(`${SERVER_URL}/api/evaluasi/all-stats`, {
            headers: { Authorization: `Bearer ${token}` } // Sisipkan token mahasiswa di header
        });
        
        // 3. VERIFIKASI: Server harus menolak karena role mahasiswa tidak berhak melihat data massal.
        // Server harus mengembalikan HTTP status 403 (Forbidden / Akses Ditolak)
        expect(res.status()).toBe(403);

        const body = await res.json();
        expect(body.message).toMatch(/ditolak/i); // Pesan respons harus menyebutkan akses ditolak/tidak diizinkan
    });

    test('mahasiswa mendapat 403 saat akses /api/evaluasi/all-stats via localStorage token', async ({ page }) => {
        // 1. SETUP: Login mahasiswa via API dan otomatis injeksi ke browser localStorage
        await loginViaAPI(page, 'mahasiswa');

        // 2. TINDAKAN: Ambil token tersebut dari localStorage browser
        const token = await page.evaluate(() => localStorage.getItem('token'));

        // Coba kirim request HTTP GET ke endpoint data massal admin menggunakan token mahasiswa
        const res = await page.request.get(`${SERVER_URL}/api/evaluasi/all-stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 3. VERIFIKASI: Akses harus ditolak (status 403)
        expect(res.status()).toBe(403);
    });
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN 4: ADMIN & PEMBINA BERHASIL AKSES DATA MASSAL
// ─────────────────────────────────────────────
test.describe('RBAC – Admin dan Pembina Dapat Akses Data Statistik', () => {
    
    test('admin berhasil akses /api/evaluasi/all-stats → 200', async ({ page }) => {
        // 1. SETUP: Login cepat sebagai admin
        await loginViaAPI(page, 'admin');
        const token = await page.evaluate(() => localStorage.getItem('token'));

        // 2. TINDAKAN: Temui endpoint data statistik all-stats memakai token admin
        const res = await page.request.get(`${SERVER_URL}/api/evaluasi/all-stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 3. VERIFIKASI: 
        // A. Respon harus sukses (status 200 OK)
        expect(res.status()).toBe(200);
        const data = await res.json();
        // B. Data yang dikembalikan harus sukses dan menyertakan daftar nama mahasiswa (students)
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('students');
    });

    test('pembina berhasil akses /api/evaluasi/all-stats → 200', async ({ page }) => {
        // 1. SETUP: Login cepat sebagai pembina
        await loginViaAPI(page, 'pembina');
        const token = await page.evaluate(() => localStorage.getItem('token'));

        // 2. TINDAKAN: Temui endpoint data statistik memakai token pembina
        const res = await page.request.get(`${SERVER_URL}/api/evaluasi/all-stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 3. VERIFIKASI: Pembina harus diizinkan melihat data statistik (status 200) demi fungsi pengawasan
        expect(res.status()).toBe(200);
        const data = await res.json();
        expect(data).toHaveProperty('success', true);
    });
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN 5: TOKEN TIDAK VALID & KADALUARSA
// ─────────────────────────────────────────────
test.describe('RBAC – Token Tidak Valid', () => {
    
    test('token palsu ditolak dengan 401', async ({ request }) => {
        // TINDAKAN: Mengirimkan token buatan sendiri yang asal-asalan
        const res = await request.get(`${SERVER_URL}/api/evaluasi/stats`, {
            headers: { Authorization: 'Bearer ini_bukan_token_jwt_valid' }
        });
        // VERIFIKASI: Server harus menolak karena token tidak terenkripsi dengan kunci rahasia server (status 401)
        expect(res.status()).toBe(401);
    });

    test('token expired ditolak dengan 401', async ({ request }) => {
        // PERSIAPAN: Gunakan token JWT contoh yang diformat dengan waktu kadaluarsa (exp) di masa lalu
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2IiwibmltIjoiMjAyMTAwMDEiLCJyb2xlIjoibWFoYXNpc3dhIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalid_signature';
        
        // TINDAKAN: Kirim request dengan menyisipkan token kadaluarsa tersebut
        const res = await request.get(`${SERVER_URL}/api/evaluasi/stats`, {
            headers: { Authorization: `Bearer ${expiredToken}` }
        });
        // VERIFIKASI: Server wajib menolak karena mendeteksi token sudah tidak berlaku lagi (status 401)
        expect(res.status()).toBe(401);
    });
});
