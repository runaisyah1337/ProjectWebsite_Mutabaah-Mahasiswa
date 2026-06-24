// e2e/assessment.spec.js
// Pengujian End-to-End (E2E) untuk Alur Pengisian Mutabaah (Assessment Workflow)
// Menjamin mahasiswa dapat mengisi amalan harian/mingguan mereka dan menyimpannya ke database.

const { test, expect } = require('@playwright/test');
const { loginViaAPI, clearSession } = require('./helpers/auth.helper');
const { seedEvaluationData, resetDatabase } = require('./helpers/db.helper');

// Dijalankan setiap kali satu skenario test selesai
test.afterEach(async ({ page }) => {
    // Bersihkan sesi browser agar ter-logout otomatis
    await clearSession(page);
    // Reset database kembali ke data awal yang bersih agar tidak memengaruhi test selanjutnya
    await resetDatabase();
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN: AKSES DAN PROTEKSI HALAMAN
// ─────────────────────────────────────────────
test.describe('Assessment – Akses Halaman', () => {
    
    test('redirect ke login jika mengakses isimutabaah.html tanpa sesi', async ({ page }) => {
        // PERSIAPAN: Pastikan tidak ada data sesi di localStorage browser
        await page.goto('/login.html');
        await page.evaluate(() => localStorage.clear());

        // TINDAKAN: Coba paksa akses langsung halaman pengisian mutabaah (isimutabaah.html)
        await page.goto('/isimutabaah.html');

        // VERIFIKASI: Keamanan frontend (mutabaah.js) harus mendeteksi ketiadaan token 
        // dan langsung mengalihkan (redirect) pengguna ke halaman utama/login ('/')
        await expect(page).toHaveURL('/');
    });

    test('mahasiswa yang sudah login dapat mengakses halaman assessment', async ({ page }) => {
        // PERSIAPAN: Login cepat lewat API sebagai mahasiswa
        await loginViaAPI(page, 'mahasiswa');
        
        // TINDAKAN: Buka halaman pengisian mutabaah
        await page.goto('/isimutabaah.html');

        // VERIFIKASI:
        // A. Pastikan URL browser berada di halaman isimutabaah
        await expect(page).toHaveURL(/isimutabaah/);
        // B. Pastikan formulir mutabaah (#mutabaahForm) terlihat di layar
        await expect(page.locator('#mutabaahForm')).toBeVisible();
        // C. Judul halaman harus mengandung kata 'Evaluasi Mingguan'
        await expect(page.locator('h2')).toContainText('Evaluasi Mingguan');
    });

    test('form menampilkan 9 dropdown amalan ibadah', async ({ page }) => {
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/isimutabaah.html');
        // Tunggu sampai aktivitas jaringan di browser tenang (network idle)
        await page.waitForLoadState('networkidle');

        // Mengambil elemen-elemen berkelas '.form-select' (elemen dropdown HTML)
        const selects = page.locator('select.form-select');
        // Memastikan jumlah dropdown amalan ada tepat 9 buah (tilawah, sholat masjid, puasa, dll.)
        await expect(selects).toHaveCount(9);
    });
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN: ISI FORMULIR & SUBMIT DATA
// ─────────────────────────────────────────────
test.describe('Assessment – Isi Form dan Submit', () => {
    
    test('mahasiswa berhasil mengisi semua field dan submit', async ({ page }) => {
        // 1. SETUP: Login dan buka form mutabaah
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/isimutabaah.html');
        await page.waitForLoadState('networkidle');

        // 2. TINDAKAN: Pilih opsi jawaban untuk setiap amalan ibadah pada dropdown HTML
        await page.selectOption('select[name="tilawah"]', '3'); // Tilawah Al-Quran (misal: 3 = Sering)
        await page.selectOption('select[name="matsurot"]', '2'); // Dzikir Al-Matsurot (2 = Kadang-kadang)
        await page.selectOption('select[name="sholatMasjid"]', '3'); // Sholat Berjamaah di Masjid
        await page.selectOption('select[name="sholatMalam"]', '2'); // Sholat Tahajjud/Malam
        await page.selectOption('select[name="puasa"]', '1'); // Puasa Sunnah (1 = Jarang/Tidak pernah)
        await page.selectOption('select[name="olahraga"]', '2'); // Olahraga
        await page.selectOption('select[name="keluarga"]', '3'); // Komunikasi dengan keluarga/orang tua
        await page.selectOption('select[name="infaq"]', '3'); // Infaq mingguan
        await page.selectOption('select[name="donasiPalestina"]', '1'); // Donasi Palestina

        // 3. MONITORING NETWORK: Siapkan listener untuk menangkap request API ke webhook backend
        const webhookPromise = page.waitForResponse(
            res => res.url().includes('/api/evaluasi/webhook') && res.request().method() === 'POST'
        );

        // 4. SETUP ALERT: Tangkap pop-up konfirmasi sukses submit dan klik OK otomatis
        page.once('dialog', dialog => {
            expect(dialog.message()).toMatch(/berhasil/i); // Isi pesan sukses harus ada kata 'berhasil'
            dialog.accept();
        });

        // 5. TINDAKAN: Klik tombol submit formulir
        await page.click('button[type="submit"]');

        // 6. VERIFIKASI NETWORK: Tunggu hingga request ke webhook selesai terkirim dan pastikan status responnya 200 (OK)
        const webhookRes = await webhookPromise;
        expect(webhookRes.status()).toBe(200);

        // 7. VERIFIKASI REDIRECT: Pastikan setelah sukses submit, mahasiswa diarahkan kembali ke dashboard
        await expect(page).toHaveURL(/dashboardmahasiswa/);
    });

    test('tombol submit menampilkan teks "Mengirim..." saat proses berlangsung', async ({ page }) => {
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/isimutabaah.html');
        await page.waitForLoadState('networkidle');

        // Isi form dengan data valid
        await page.selectOption('select[name="tilawah"]', '3');
        await page.selectOption('select[name="matsurot"]', '2');
        await page.selectOption('select[name="sholatMasjid"]', '3');
        await page.selectOption('select[name="sholatMalam"]', '2');
        await page.selectOption('select[name="puasa"]', '1');
        await page.selectOption('select[name="olahraga"]', '2');
        await page.selectOption('select[name="keluarga"]', '3');
        await page.selectOption('select[name="infaq"]', '3');
        await page.selectOption('select[name="donasiPalestina"]', '1');

        // INTERCEPT NETWORK: Sengaja tunda respon API backend selama 200ms
        // Agar kita bisa memeriksa status visual tombol saat proses pengiriman data sedang menggantung.
        await page.route('**/api/evaluasi/webhook', async route => {
            await new Promise(r => setTimeout(r, 200)); // Delay 200 milidetik
            await route.continue();
        });

        const submitBtn = page.locator('button[type="submit"]');

        // Klik tombol dan secara simultan (Promise) verifikasi teks tombol berubah menjadi "Mengirim..."
        const clickPromise = page.click('button[type="submit"]');
        await expect(submitBtn).toHaveText('Mengirim...');
        
        // Terima alert sukses setelah delay selesai
        page.once('dialog', d => d.accept());
        await clickPromise;

        // Tunggu hingga redirect selesai agar proses database benar-benar tuntas sebelum test selesai
        await expect(page).toHaveURL(/dashboardmahasiswa/);
    });
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN: VALIDASI INPUT WAJIB (REQUIRED)
// ─────────────────────────────────────────────
test.describe('Assessment – Validasi Field Wajib', () => {
    
    test('form tidak bisa disubmit jika ada field yang belum dipilih', async ({ page }) => {
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/isimutabaah.html');
        await page.waitForLoadState('networkidle');

        // HANYA ISI SATU FIELD (Tilawah saja), sedangkan 8 field lainnya dibiarkan kosong
        await page.selectOption('select[name="tilawah"]', '3');

        // Siapkan pendengar request: Tidak boleh ada pengiriman data ke webhook sama sekali
        let webhookCalled = false;
        page.on('request', req => {
            if (req.url().includes('/api/evaluasi/webhook')) webhookCalled = true;
        });

        // Klik submit: Fitur validasi HTML5 bawaan browser (required attribute) akan mencegah form dikirim
        await page.click('button[type="submit"]');

        // Tunggu sejenak untuk memastikan tidak ada aktivitas network siluman
        await page.waitForTimeout(500);

        // VERIFIKASI: 
        // A. Panggilan ke webhook backend harus tetap false (tidak dikirim)
        expect(webhookCalled).toBeFalsy();
        // B. Browser harus tetap bertahan di halaman isimutabaah (tidak redirect)
        await expect(page).toHaveURL(/isimutabaah/);
    });

    test('setiap dropdown memiliki atribut required', async ({ page }) => {
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/isimutabaah.html');

        // Daftar nama-nama dropdown di HTML
        const selectNames = [
            'tilawah', 'matsurot', 'sholatMasjid', 'sholatMalam',
            'puasa', 'olahraga', 'keluarga', 'infaq', 'donasiPalestina'
        ];

        // Looping untuk mengecek apakah setiap dropdown memiliki atribut HTML 'required'
        for (const name of selectNames) {
            const isRequired = await page.locator(`select[name="${name}"]`).getAttribute('required');
            expect(isRequired).not.toBeNull(); // Nilai atribut required tidak boleh null (harus ada)
        }
    });
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN: PENGISIAN OTOMATIS DATA LAMA (AUTO-FILL)
// ─────────────────────────────────────────────
test.describe('Assessment – Auto-fill Data Existing', () => {
    
    test('form auto-fill dengan data minggu berjalan yang sudah diisi sebelumnya', async ({ page }) => {
        // 1. SETUP DATABASE: Masukkan data evaluasi (tilawah = 3) untuk mahasiswa ke database secara manual
        await seedEvaluationData();

        // 2. NAVIGASI: Login dan buka halaman mutabaah
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/isimutabaah.html');

        // Tunggu proses asinkron fetch data dari backend selesai berjalan
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // Berikan jeda tambahan 1 detik untuk render UI

        // 3. VERIFIKASI AUTO-FILL: Pastikan dropdown tilawah sudah otomatis terpilih opsi '3'
        const tilawahValue = await page.locator('select[name="tilawah"]').inputValue();
        expect(tilawahValue).toBe('3');

        // 4. VERIFIKASI TEKS STATUS: Label deskripsi di bawah judul harus berubah menginformasikan bahwa data sudah terisi
        await expect(page.locator('#subHeaderStatus')).toContainText('sudah terisi');

        // 5. VERIFIKASI TOMBOL: Teks tombol kirim harus berubah dari "SUBMIT" menjadi "UPDATE"
        await expect(page.locator('button[type="submit"]')).toContainText('UPDATE');

        // Bersihkan database kembali
        await resetDatabase();
    });
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN: NAVIGASI KEMBALI
// ─────────────────────────────────────────────
test.describe('Assessment – Navigasi', () => {
    
    test('link batal kembali ke dashboard mahasiswa', async ({ page }) => {
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/isimutabaah.html');
        await page.waitForLoadState('networkidle');

        // Klik link/tombol kembali (batal)
        await page.click('a.link-back');
        
        // Pastikan dialihkan kembali ke dashboard mahasiswa
        await expect(page).toHaveURL(/dashboardmahasiswa/);
    });
});
