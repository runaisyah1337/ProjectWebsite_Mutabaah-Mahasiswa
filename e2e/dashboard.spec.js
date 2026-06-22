// e2e/dashboard.spec.js
// E2E Test: Dashboard (Mahasiswa, Admin, Pembina)
// Memastikan data tampil, statistik muncul, dan navigasi berfungsi

const { test, expect } = require('@playwright/test');
const { loginViaAPI, clearSession } = require('./helpers/auth.helper');

test.afterEach(async ({ page }) => {
    await clearSession(page);
});

// ─────────────────────────────────────────────
// DASHBOARD MAHASISWA
// ─────────────────────────────────────────────
test.describe('Dashboard – Mahasiswa', () => {
    test.beforeEach(async ({ page }) => {
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/dashboardmahasiswa.html');
        await page.waitForLoadState('networkidle');
    });

    test('halaman dashboard mahasiswa berhasil dimuat', async ({ page }) => {
        await expect(page).toHaveURL(/dashboardmahasiswa/);
        await expect(page).toHaveTitle(/Dashboard Mahasiswa/i);
    });

    test('menampilkan nama user yang login di header welcome', async ({ page }) => {
        // Script dashboardmahasiswa.js mengisi #welcomeName dari localStorage
        // Beri waktu script berjalan
        await page.waitForTimeout(500);

        const welcomeName = page.locator('#welcomeName');
        await expect(welcomeName).toBeVisible();
        // Nama harus berisi sesuatu (bukan kosong)
        const text = await welcomeName.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
    });

    test('menampilkan indikator minggu berjalan', async ({ page }) => {
        const weekIndicator = page.locator('#weekIndicator');
        await expect(weekIndicator).toBeVisible();
        // Harus tidak lagi menampilkan "MEMUAT PERIODE..." setelah load
        await expect(weekIndicator).not.toContainText('MEMUAT', { timeout: 5000 });
    });

    test('menampilkan 2 menu card (Isi Mutabaah dan Monitoring)', async ({ page }) => {
        const menuCards = page.locator('.menu-card');
        await expect(menuCards).toHaveCount(2);
    });

    test('navigasi: klik "Isi Sekarang" menuju halaman assessment', async ({ page }) => {
        await page.click('#btnIsiMutabaah');
        await expect(page).toHaveURL(/isimutabaah/);
    });

    test('navigasi: klik "Rekapan" menuju halaman rekapan', async ({ page }) => {
        await page.click('#rekapLink');
        await expect(page).toHaveURL(/rekapan/);
    });

    test('navigasi: klik "Grafik" menuju halaman grafik', async ({ page }) => {
        await page.click('#grafikLink');
        await expect(page).toHaveURL(/grafik/);
    });

    test('tombol logout tampil dan dapat diklik', async ({ page }) => {
        const logoutBtn = page.locator('button.logout-btn');
        await expect(logoutBtn).toBeVisible();
    });

    test('modal FAQ muncul saat klik tombol bantuan (?)', async ({ page }) => {
        // Klik tombol help/FAQ
        await page.click('.help-btn-small');
        const modal = page.locator('#faqModal');
        // Modal harus muncul (display berubah dari none ke flex)
        await expect(modal).toHaveCSS('display', 'flex');
    });
});

// ─────────────────────────────────────────────
// DASHBOARD ADMIN
// ─────────────────────────────────────────────
test.describe('Dashboard – Admin', () => {
    test.beforeEach(async ({ page }) => {
        await loginViaAPI(page, 'admin');
        await page.goto('/dashboardadmin.html');
        await page.waitForLoadState('networkidle');
    });

    test('halaman dashboard admin berhasil dimuat', async ({ page }) => {
        await expect(page).toHaveURL(/dashboardadmin/);
        await expect(page).toHaveTitle(/Dashboard Admin/i);
    });

    test('menampilkan label "Admin Area" di header', async ({ page }) => {
        await expect(page.locator('.dashboard-header')).toContainText('Admin Area');
    });

    test('menampilkan 2 menu card admin (Monitoring dan Statistik)', async ({ page }) => {
        const adminCards = page.locator('.admin-card');
        await expect(adminCards).toHaveCount(2);
    });

    test('navigasi: klik "Buka Data Pantau" menuju adminpantau.html', async ({ page }) => {
        await page.click('a[href="adminpantau.html"]');
        await expect(page).toHaveURL(/adminpantau/);
    });

    test('navigasi: klik "Lihat Tren Kampus" menuju admintren.html', async ({ page }) => {
        await page.click('a[href="admintren.html"]');
        await expect(page).toHaveURL(/admintren/);
    });

    test('tombol logout tampil dan dapat diklik', async ({ page }) => {
        await expect(page.locator('button.logout-btn')).toBeVisible();
    });
});

// ─────────────────────────────────────────────
// DASHBOARD PEMBINA
// ─────────────────────────────────────────────
test.describe('Dashboard – Pembina', () => {
    test.beforeEach(async ({ page }) => {
        await loginViaAPI(page, 'pembina');
        await page.goto('/dashboardpembina.html');
        await page.waitForLoadState('networkidle');
    });

    test('halaman dashboard pembina berhasil dimuat', async ({ page }) => {
        await expect(page).toHaveURL(/dashboardpembina/);
    });

    test('menampilkan label "Pembina Area" di header', async ({ page }) => {
        await expect(page.locator('.dashboard-header')).toContainText('Pembina Area');
    });

    test('tombol logout tampil (onclick=logout)', async ({ page }) => {
        // Pembina menggunakan onclick="logout()" langsung, bukan class logout-btn
        const logoutBtn = page.locator('button[onclick="logout()"]');
        await expect(logoutBtn).toBeVisible();
    });
});

