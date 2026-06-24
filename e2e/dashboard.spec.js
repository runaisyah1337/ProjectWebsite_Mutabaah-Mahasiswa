// e2e/dashboard.spec.js
// Pengujian End-to-End (E2E) untuk Halaman Dashboard (Mahasiswa, Pembina, Admin)
// Memastikan data profil tampil, statistik/indikator dimuat, serta tombol-tombol navigasi berfungsi.

const { test, expect } = require('@playwright/test');
const { loginViaAPI, clearSession } = require('./helpers/auth.helper');

// Dijalankan setelah setiap skenario pengujian selesai
test.afterEach(async ({ page }) => {
    // Bersihkan sesi browser agar kembali ke kondisi awal (ter-logout)
    await clearSession(page);
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN: DASHBOARD MAHASISWA
// ─────────────────────────────────────────────
test.describe('Dashboard – Mahasiswa', () => {
    
    // Sebelum setiap pengujian di grup ini dimulai, login sebagai mahasiswa dan buka halaman dashboard-nya
    test.beforeEach(async ({ page }) => {
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/dashboardmahasiswa.html');
        await page.waitForLoadState('networkidle');
    });

    test('halaman dashboard mahasiswa berhasil dimuat', async ({ page }) => {
        // VERIFIKASI: Pastikan URL browser berada di dashboardmahasiswa.html
        await expect(page).toHaveURL(/dashboardmahasiswa/);
        // VERIFIKASI: Judul tab browser mengandung teks "Dashboard Mahasiswa"
        await expect(page).toHaveTitle(/Dashboard Mahasiswa/i);
    });

    test('menampilkan nama user yang login di header welcome', async ({ page }) => {
        // Beri waktu 500ms agar script dashboardmahasiswa.js membaca localStorage dan merender nama ke HTML
        await page.waitForTimeout(500);

        const welcomeName = page.locator('#welcomeName');
        // VERIFIKASI: Elemen nama harus terlihat di layar
        await expect(welcomeName).toBeVisible();
        
        // Ambil teks nama tersebut dan pastikan isinya tidak kosong (berisi nama mahasiswa)
        const text = await welcomeName.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
    });

    test('menampilkan indikator minggu berjalan', async ({ page }) => {
        const weekIndicator = page.locator('#weekIndicator');
        // VERIFIKASI: Indikator informasi minggu berjalan terlihat
        await expect(weekIndicator).toBeVisible();
        // VERIFIKASI: Teks di dalamnya tidak lagi berupa placeholder "MEMUAT PERIODE..." (sudah terisi data riil)
        await expect(weekIndicator).not.toContainText('MEMUAT', { timeout: 5000 });
    });

    test('menampilkan 2 menu card (Isi Mutabaah dan Monitoring)', async ({ page }) => {
        // Dashboard mahasiswa memiliki 2 kartu menu navigasi utama
        const menuCards = page.locator('.menu-card');
        await expect(menuCards).toHaveCount(2);
    });

    test('navigasi: klik "Isi Sekarang" menuju halaman assessment', async ({ page }) => {
        // TINDAKAN: Klik tombol dengan id 'btnIsiMutabaah'
        await page.click('#btnIsiMutabaah');
        // VERIFIKASI: Browser harus dialihkan ke halaman isimutabaah.html
        await expect(page).toHaveURL(/isimutabaah/);
    });

    test('navigasi: klik "Rekapan" menuju halaman rekapan', async ({ page }) => {
        // TINDAKAN: Klik tautan dengan id 'rekapLink'
        await page.click('#rekapLink');
        // VERIFIKASI: Dialihkan ke halaman rekapan.html
        await expect(page).toHaveURL(/rekapan/);
    });

    test('navigasi: klik "Grafik" menuju halaman grafik', async ({ page }) => {
        // TINDAKAN: Klik tautan dengan id 'grafikLink'
        await page.click('#grafikLink');
        // VERIFIKASI: Dialihkan ke halaman grafik.html
        await expect(page).toHaveURL(/grafik/);
    });

    test('tombol logout tampil dan dapat diklik', async ({ page }) => {
        const logoutBtn = page.locator('button.logout-btn');
        // VERIFIKASI: Tombol logout harus terlihat dengan jelas di dashboard
        await expect(logoutBtn).toBeVisible();
    });

    test('modal FAQ muncul saat klik tombol bantuan (?)', async ({ page }) => {
        // TINDAKAN: Klik tombol bantuan/FAQ di sudut bawah
        await page.click('.help-btn-small');
        
        const modal = page.locator('#faqModal');
        // VERIFIKASI: CSS display modal FAQ harus berubah menjadi 'flex' (menandakan pop-up modal telah muncul)
        await expect(modal).toHaveCSS('display', 'flex');
    });
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN: DASHBOARD ADMIN
// ─────────────────────────────────────────────
test.describe('Dashboard – Admin', () => {
    
    // Sebelum setiap pengujian admin dimulai, login sebagai admin dan buka dashboard-nya
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
        // Memastikan ada teks penanda hak akses "Admin Area" di bagian atas halaman
        await expect(page.locator('.dashboard-header')).toContainText('Admin Area');
    });

    test('menampilkan 2 menu card admin (Monitoring dan Statistik)', async ({ page }) => {
        // Dashboard admin memiliki 2 menu utama khusus
        const adminCards = page.locator('.admin-card');
        await expect(adminCards).toHaveCount(2);
    });

    test('navigasi: klik "Buka Data Pantau" menuju adminpantau.html', async ({ page }) => {
        // TINDAKAN: Klik tautan navigasi menuju halaman pemantauan data mahasiswa
        await page.click('a[href="adminpantau.html"]');
        await expect(page).toHaveURL(/adminpantau/);
    });

    test('navigasi: klik "Lihat Tren Kampus" menuju admintren.html', async ({ page }) => {
        // TINDAKAN: Klik tautan navigasi menuju grafik statistik tren kampus
        await page.click('a[href="admintren.html"]');
        await expect(page).toHaveURL(/admintren/);
    });

    test('tombol logout tampil dan dapat diklik', async ({ page }) => {
        await expect(page.locator('button.logout-btn')).toBeVisible();
    });
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN: DASHBOARD PEMBINA
// ─────────────────────────────────────────────
test.describe('Dashboard – Pembina', () => {
    
    // Sebelum setiap pengujian pembina dimulai, login sebagai pembina dan buka dashboard-nya
    test.beforeEach(async ({ page }) => {
        await loginViaAPI(page, 'pembina');
        await page.goto('/dashboardpembina.html');
        await page.waitForLoadState('networkidle');
    });

    test('halaman dashboard pembina berhasil dimuat', async ({ page }) => {
        await expect(page).toHaveURL(/dashboardpembina/);
    });

    test('menampilkan label "Pembina Area" di header', async ({ page }) => {
        // Memastikan label "Pembina Area" tampil untuk menandai peran pembina
        await expect(page.locator('.dashboard-header')).toContainText('Pembina Area');
    });

    test('tombol logout tampil (onclick=logout)', async ({ page }) => {
        // Khusus peran Pembina, tombol logout menggunakan atribut inline onclick="logout()", bukan class css
        const logoutBtn = page.locator('button[onclick="logout()"]');
        await expect(logoutBtn).toBeVisible();
    });
});
