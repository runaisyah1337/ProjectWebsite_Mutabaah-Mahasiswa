// e2e/role-access.spec.js
// E2E Test: Role-Based Access Control (RBAC)
// Memastikan halaman protected dan endpoint API hanya dapat diakses oleh role yang tepat

const { test, expect } = require('@playwright/test');
const { loginViaAPI, clearSession } = require('./helpers/auth.helper');

const SERVER_URL = 'http://localhost:3001';

test.afterEach(async ({ page }) => {
    await clearSession(page);
});

// ─────────────────────────────────────────────
// PROTECTED ROUTES — Tanpa Login
// ─────────────────────────────────────────────
test.describe('RBAC – Akses Tanpa Login (Redirect ke /)', () => {
    // Daftar halaman yang harus dilindungi
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

    for (const { path, name } of protectedPages) {
        test(`halaman ${name} (${path}) redirect ke / tanpa session`, async ({ page }) => {
            // Pastikan localStorage kosong
            await page.goto('/login.html');
            await page.evaluate(() => localStorage.clear());

            // Akses halaman protected
            await page.goto(path);

            // Setiap halaman memiliki main.js (checkAuth) atau script sendiri yang redirect
            // Tunggu navigasi selesai
            await page.waitForURL('/', { timeout: 5000 });
            await expect(page).toHaveURL('/');
        });
    }
});

// ─────────────────────────────────────────────
// PROTECTED API ENDPOINTS — Tanpa Token
// ─────────────────────────────────────────────
test.describe('RBAC – API Endpoints Tanpa Token', () => {
    test('POST /api/evaluasi/webhook tanpa token → 401', async ({ request }) => {
        const res = await request.post(`${SERVER_URL}/api/evaluasi/webhook`, {
            data: { jawaban: { tilawah: 3 } }
        });
        expect(res.status()).toBe(401);
    });

    test('GET /api/evaluasi/stats tanpa token → 401', async ({ request }) => {
        const res = await request.get(`${SERVER_URL}/api/evaluasi/stats`);
        expect(res.status()).toBe(401);
    });

    test('GET /api/evaluasi/all-stats tanpa token → 401', async ({ request }) => {
        const res = await request.get(`${SERVER_URL}/api/evaluasi/all-stats`);
        expect(res.status()).toBe(401);
    });
});

// ─────────────────────────────────────────────
// RBAC API — Mahasiswa Tidak Bisa Akses all-stats
// ─────────────────────────────────────────────
test.describe('RBAC – Mahasiswa Tidak Dapat Akses Data Admin', () => {
    test('mahasiswa mendapat 403 saat akses /api/evaluasi/all-stats', async ({ page, request }) => {
        // Login sebagai mahasiswa dan ambil token
        const loginRes = await request.post(`${SERVER_URL}/api/auth/login`, {
            data: { identifier: '20210001', password: 'TestPass123!' }
        });
        expect(loginRes.ok()).toBeTruthy();
        const loginData = await loginRes.json();
        const token = loginData.token;

        // Coba akses endpoint admin
        const res = await request.get(`${SERVER_URL}/api/evaluasi/all-stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(res.status()).toBe(403);

        const body = await res.json();
        expect(body.message).toMatch(/ditolak/i);
    });

    test('mahasiswa mendapat 403 saat akses /api/evaluasi/all-stats via localStorage token', async ({ page }) => {
        // Login mahasiswa via API dan inject ke localStorage
        await loginViaAPI(page, 'mahasiswa');

        // Ambil token dari localStorage
        const token = await page.evaluate(() => localStorage.getItem('token'));

        // Kirim request dengan token mahasiswa ke endpoint admin
        const res = await page.request.get(`${SERVER_URL}/api/evaluasi/all-stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        expect(res.status()).toBe(403);
    });
});

// ─────────────────────────────────────────────
// RBAC API — Admin & Pembina Dapat Akses all-stats
// ─────────────────────────────────────────────
test.describe('RBAC – Admin dan Pembina Dapat Akses Data Statistik', () => {
    test('admin berhasil akses /api/evaluasi/all-stats → 200', async ({ page }) => {
        await loginViaAPI(page, 'admin');
        const token = await page.evaluate(() => localStorage.getItem('token'));

        const res = await page.request.get(`${SERVER_URL}/api/evaluasi/all-stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        expect(res.status()).toBe(200);
        const data = await res.json();
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('students');
    });

    test('pembina berhasil akses /api/evaluasi/all-stats → 200', async ({ page }) => {
        await loginViaAPI(page, 'pembina');
        const token = await page.evaluate(() => localStorage.getItem('token'));

        const res = await page.request.get(`${SERVER_URL}/api/evaluasi/all-stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        expect(res.status()).toBe(200);
        const data = await res.json();
        expect(data).toHaveProperty('success', true);
    });
});

// ─────────────────────────────────────────────
// TOKEN TIDAK VALID
// ─────────────────────────────────────────────
test.describe('RBAC – Token Tidak Valid', () => {
    test('token palsu ditolak dengan 401', async ({ request }) => {
        const res = await request.get(`${SERVER_URL}/api/evaluasi/stats`, {
            headers: { Authorization: 'Bearer ini_bukan_token_jwt_valid' }
        });
        expect(res.status()).toBe(401);
    });

    test('token expired ditolak dengan 401', async ({ request }) => {
        // JWT yang sudah expire (dibuat manual dengan exp di masa lalu)
        // Ini adalah token JWT valid secara format tapi sudah kadaluarsa
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2IiwibmltIjoiMjAyMTAwMDEiLCJyb2xlIjoibWFoYXNpc3dhIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalid_signature';
        const res = await request.get(`${SERVER_URL}/api/evaluasi/stats`, {
            headers: { Authorization: `Bearer ${expiredToken}` }
        });
        expect(res.status()).toBe(401);
    });
});
