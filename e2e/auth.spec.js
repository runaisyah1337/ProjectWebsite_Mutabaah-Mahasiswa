// e2e/auth.spec.js
// E2E Test: Authentication (Login, Logout)
// Mensimulasikan perilaku user nyata di browser

const { test, expect } = require('@playwright/test');
const { loginViaUI, loginViaAPI, logoutViaUI, clearSession } = require('./helpers/auth.helper');
const { resetDatabase } = require('./helpers/db.helper');

// Reset database setelah setiap test yang mungkin mengubah data
test.afterEach(async ({ page }) => {
    await clearSession(page);
});

// ─────────────────────────────────────────────
// LOGIN BERHASIL
// ─────────────────────────────────────────────
test.describe('Login – Berhasil', () => {
    test('mahasiswa berhasil login dengan NIM dan diarahkan ke dashboard mahasiswa', async ({ page }) => {
        // Setup: tangkap dialog alert sebelum klik login
        page.on('dialog', dialog => dialog.accept());

        await page.goto('/login.html');
        await page.fill('#userInput', '20210001');
        await page.fill('#passInput', 'TestPass123!');
        await page.click('button.btn-primary');

        // Verifikasi redirect ke dashboard mahasiswa
        await expect(page).toHaveURL(/dashboardmahasiswa/);

        // Verifikasi token tersimpan di localStorage
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeTruthy();
        expect(token.split('.').length).toBe(3); // format JWT: header.payload.signature
    });

    test('admin berhasil login dengan No HP dan diarahkan ke dashboard admin', async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());

        await page.goto('/login.html');
        await page.fill('#userInput', '081111000099');
        await page.fill('#passInput', 'TestPass123!');
        await page.click('button.btn-primary');

        await expect(page).toHaveURL(/dashboardadmin/);

        const session = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('tazkia_session'))
        );
        expect(session.role).toBe('admin');
    });

    test('pembina berhasil login dengan No HP dan diarahkan ke dashboard pembina', async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());

        await page.goto('/login.html');
        await page.fill('#userInput', '081111000001');
        await page.fill('#passInput', 'TestPass123!');
        await page.click('button.btn-primary');

        await expect(page).toHaveURL(/dashboardpembina/);

        const session = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('tazkia_session'))
        );
        expect(session.role).toBe('pembina');
    });

    test('session tersimpan dengan benar di localStorage setelah login', async ({ page }) => {
        page.on('dialog', dialog => dialog.accept());

        await page.goto('/login.html');
        await page.fill('#userInput', '20210001');
        await page.fill('#passInput', 'TestPass123!');
        await page.click('button.btn-primary');

        await page.waitForURL(/dashboard/);

        // Verifikasi struktur session
        const session = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('tazkia_session'))
        );
        expect(session).toHaveProperty('nama');
        expect(session).toHaveProperty('nim', '20210001');
        expect(session).toHaveProperty('role', 'mahasiswa');
    });
});

// ─────────────────────────────────────────────
// LOGIN GAGAL
// ─────────────────────────────────────────────
test.describe('Login – Gagal', () => {
    test('menampilkan pesan error saat password salah', async ({ page }) => {
        await page.goto('/login.html');
        await page.fill('#userInput', '20210001');
        await page.fill('#passInput', 'passwordsalah');

        // Tangkap alert yang berisi pesan error
        const alertMessage = await new Promise(resolve => {
            page.once('dialog', async dialog => {
                resolve(dialog.message());
                await dialog.accept();
            });
            page.click('button.btn-primary');
        });

        expect(alertMessage).toMatch(/Password salah/i);
        // Harus tetap di halaman login
        await expect(page).toHaveURL(/login|index/);
    });

    test('menampilkan pesan error saat NIM tidak terdaftar', async ({ page }) => {
        await page.goto('/login.html');
        await page.fill('#userInput', '99999999');
        await page.fill('#passInput', 'TestPass123!');

        const alertMessage = await new Promise(resolve => {
            page.once('dialog', async dialog => {
                resolve(dialog.message());
                await dialog.accept();
            });
            page.click('button.btn-primary');
        });

        expect(alertMessage).toMatch(/tidak ditemukan/i);
    });

    test('menampilkan peringatan frontend saat field kosong', async ({ page }) => {
        await page.goto('/login.html');
        // Tidak mengisi field apapun

        const alertMessage = await new Promise(resolve => {
            page.once('dialog', async dialog => {
                resolve(dialog.message());
                await dialog.accept();
            });
            page.click('button.btn-primary');
        });

        // Validasi frontend: pesan dari auth.js baris 10
        expect(alertMessage).toMatch(/Username|Password|harus diisi/i);
    });
});

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
test.describe('Logout', () => {
    test('mahasiswa berhasil logout dan localStorage terhapus', async ({ page }) => {
        // Setup: login dulu via API (lebih cepat)
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/dashboardmahasiswa.html');

        // Tangkap dialog konfirmasi logout (confirm box)
        page.on('dialog', dialog => dialog.accept());

        await page.click('button.logout-btn');

        // Verifikasi redirect ke halaman login
        await expect(page).toHaveURL('/');

        // Verifikasi localStorage sudah kosong
        const token = await page.evaluate(() => localStorage.getItem('token'));
        const session = await page.evaluate(() => localStorage.getItem('tazkia_session'));
        expect(token).toBeNull();
        expect(session).toBeNull();
    });

    test('admin berhasil logout dari dashboard admin', async ({ page }) => {
        await loginViaAPI(page, 'admin');
        await page.goto('/dashboardadmin.html');

        page.on('dialog', dialog => dialog.accept());
        await page.click('button.logout-btn');

        await expect(page).toHaveURL('/');
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeNull();
    });

    test('membatalkan logout tidak menghapus session', async ({ page }) => {
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/dashboardmahasiswa.html');

        // Batalkan dialog konfirmasi (klik Cancel)
        page.once('dialog', dialog => dialog.dismiss());
        await page.click('button.logout-btn');

        // Harus tetap di dashboard
        await expect(page).toHaveURL(/dashboardmahasiswa/);

        // Token harus masih ada
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeTruthy();
    });
});
