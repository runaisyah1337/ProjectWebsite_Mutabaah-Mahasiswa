// e2e/assessment.spec.js
// E2E Test: Assessment Workflow (Isi Mutabaah)
// Mensimulasikan mahasiswa mengisi dan mengirim form amalan ibadah mingguan

const { test, expect } = require('@playwright/test');
const { loginViaAPI, clearSession } = require('./helpers/auth.helper');
const { seedEvaluationData, resetDatabase } = require('./helpers/db.helper');

test.afterEach(async ({ page }) => {
    await clearSession(page);
    await resetDatabase();
});

// ─────────────────────────────────────────────
// AKSES & PROTEKSI HALAMAN
// ─────────────────────────────────────────────
test.describe('Assessment – Akses Halaman', () => {
    test('redirect ke login jika mengakses isimutabaah.html tanpa sesi', async ({ page }) => {
        // Pastikan localStorage kosong
        await page.goto('/login.html');
        await page.evaluate(() => localStorage.clear());

        // Akses halaman assessment langsung
        await page.goto('/isimutabaah.html');

        // mutabaah.js baris 7-8: jika tidak ada token, redirect ke "/"
        await expect(page).toHaveURL('/');
    });

    test('mahasiswa yang sudah login dapat mengakses halaman assessment', async ({ page }) => {
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/isimutabaah.html');

        // Verifikasi halaman tampil dengan benar
        await expect(page).toHaveURL(/isimutabaah/);
        await expect(page.locator('#mutabaahForm')).toBeVisible();
        await expect(page.locator('h2')).toContainText('Evaluasi Mingguan');
    });

    test('form menampilkan 9 dropdown amalan ibadah', async ({ page }) => {
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/isimutabaah.html');
        await page.waitForLoadState('networkidle');

        // 9 select: tilawah, matsurot, sholatMasjid, sholatMalam, puasa, olahraga, keluarga, infaq, donasiPalestina
        const selects = page.locator('select.form-select');
        await expect(selects).toHaveCount(9);
    });
});

// ─────────────────────────────────────────────
// ISI FORM & SUBMIT
// ─────────────────────────────────────────────
test.describe('Assessment – Isi Form dan Submit', () => {
    test('mahasiswa berhasil mengisi semua field dan submit', async ({ page }) => {
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/isimutabaah.html');
        await page.waitForLoadState('networkidle');

        // Isi semua 9 dropdown dengan nilai valid
        await page.selectOption('select[name="tilawah"]', '3');
        await page.selectOption('select[name="matsurot"]', '2');
        await page.selectOption('select[name="sholatMasjid"]', '3');
        await page.selectOption('select[name="sholatMalam"]', '2');
        await page.selectOption('select[name="puasa"]', '1');
        await page.selectOption('select[name="olahraga"]', '2');
        await page.selectOption('select[name="keluarga"]', '3');
        await page.selectOption('select[name="infaq"]', '3');
        await page.selectOption('select[name="donasiPalestina"]', '1');

        // Monitor request API webhook
        const webhookPromise = page.waitForResponse(
            res => res.url().includes('/api/evaluasi/webhook') && res.request().method() === 'POST'
        );

        // Tangkap alert sukses lalu accept
        page.once('dialog', dialog => {
            expect(dialog.message()).toMatch(/berhasil/i);
            dialog.accept();
        });

        await page.click('button[type="submit"]');

        // Verifikasi request terkirim
        const webhookRes = await webhookPromise;
        expect(webhookRes.status()).toBe(200);

        // Verifikasi redirect kembali ke dashboard setelah submit
        await expect(page).toHaveURL(/dashboardmahasiswa/);
    });

    test('tombol submit menampilkan teks "Mengirim..." saat proses berlangsung', async ({ page }) => {
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/isimutabaah.html');
        await page.waitForLoadState('networkidle');

        // Isi semua field
        await page.selectOption('select[name="tilawah"]', '3');
        await page.selectOption('select[name="matsurot"]', '2');
        await page.selectOption('select[name="sholatMasjid"]', '3');
        await page.selectOption('select[name="sholatMalam"]', '2');
        await page.selectOption('select[name="puasa"]', '1');
        await page.selectOption('select[name="olahraga"]', '2');
        await page.selectOption('select[name="keluarga"]', '3');
        await page.selectOption('select[name="infaq"]', '3');
        await page.selectOption('select[name="donasiPalestina"]', '1');

        // Intercept request agar bisa cek teks tombol saat proses
        await page.route('**/api/evaluasi/webhook', async route => {
            // Delay sebentar agar teks "Mengirim..." bisa ditangkap
            await new Promise(r => setTimeout(r, 200));
            await route.continue();
        });

        const submitBtn = page.locator('button[type="submit"]');

        // Klik dan langsung cek teks tombol
        const clickPromise = page.click('button[type="submit"]');
        await expect(submitBtn).toHaveText('Mengirim...');
        page.once('dialog', d => d.accept());
        await clickPromise;
    });
});

// ─────────────────────────────────────────────
// VALIDASI FIELD WAJIB
// ─────────────────────────────────────────────
test.describe('Assessment – Validasi Field Wajib', () => {
    test('form tidak bisa disubmit jika ada field yang belum dipilih', async ({ page }) => {
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/isimutabaah.html');
        await page.waitForLoadState('networkidle');

        // Isi hanya sebagian field (tilawah saja)
        await page.selectOption('select[name="tilawah"]', '3');
        // Field lain dibiarkan kosong (value="", disabled selected)

        // Monitor: tidak boleh ada request ke webhook
        let webhookCalled = false;
        page.on('request', req => {
            if (req.url().includes('/api/evaluasi/webhook')) webhookCalled = true;
        });

        // Klik submit — HTML5 required akan mencegah submit
        await page.click('button[type="submit"]');

        // Beri waktu sebentar
        await page.waitForTimeout(500);

        // Verifikasi: tidak ada request yang dikirim
        expect(webhookCalled).toBeFalsy();
        // Masih di halaman yang sama
        await expect(page).toHaveURL(/isimutabaah/);
    });

    test('setiap dropdown memiliki atribut required', async ({ page }) => {
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/isimutabaah.html');

        const selectNames = [
            'tilawah', 'matsurot', 'sholatMasjid', 'sholatMalam',
            'puasa', 'olahraga', 'keluarga', 'infaq', 'donasiPalestina'
        ];

        for (const name of selectNames) {
            const isRequired = await page.locator(`select[name="${name}"]`).getAttribute('required');
            expect(isRequired).not.toBeNull();
        }
    });
});

// ─────────────────────────────────────────────
// AUTO-FILL DATA EXISTING
// ─────────────────────────────────────────────
test.describe('Assessment – Auto-fill Data Existing', () => {
    test('form auto-fill dengan data minggu berjalan yang sudah diisi sebelumnya', async ({ page }) => {
        // Seed evaluasi untuk mahasiswa NIM 20210001
        await seedEvaluationData();

        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/isimutabaah.html');

        // Tunggu script mutabaah.js selesai fetch dan auto-fill
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // beri waktu async fetch selesai

        // Verifikasi: tilawah sudah terisi dengan nilai 3 (dari seed data)
        const tilawahValue = await page.locator('select[name="tilawah"]').inputValue();
        expect(tilawahValue).toBe('3');

        // Verifikasi: teks header berubah menjadi mode update
        await expect(page.locator('#subHeaderStatus')).toContainText('sudah terisi');

        // Verifikasi: tombol berubah menjadi "UPDATE"
        await expect(page.locator('button[type="submit"]')).toContainText('UPDATE');

        // Reset setelah test ini
        await resetDatabase();
    });
});

// ─────────────────────────────────────────────
// NAVIGASI
// ─────────────────────────────────────────────
test.describe('Assessment – Navigasi', () => {
    test('link batal kembali ke dashboard mahasiswa', async ({ page }) => {
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/isimutabaah.html');
        await page.waitForLoadState('networkidle');

        await page.click('a.link-back');
        await expect(page).toHaveURL(/dashboardmahasiswa/);
    });
});
