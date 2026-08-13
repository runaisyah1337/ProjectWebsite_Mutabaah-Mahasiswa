// e2e/auth.spec.js
// Pengujian End-to-End (E2E) untuk Sistem Autentikasi (Login & Logout)
// Menguji perilaku pengguna secara nyata menggunakan browser otomatis (Playwright)

const { test, expect } = require('@playwright/test');
// Mengimport helper login dan logout yang sudah dibuat sebelumnya agar kode pengujian lebih rapi
const { loginViaUI, loginViaAPI, logoutViaUI, clearSession } = require('./helpers/auth.helper');
const { resetDatabase } = require('./helpers/db.helper');

// Hook: Dijalankan setiap kali satu skenario pengujian selesai (setiap blok 'test')
test.afterEach(async ({ page }) => {
    // Bersihkan sesi (session/localStorage) di browser agar test berikutnya bersih dari sisa login sebelumnya
    await clearSession(page);
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN: PROSES LOGIN YANG BERHASIL
// ─────────────────────────────────────────────
test.describe('Login – Berhasil', () => {
    
    test('mahasiswa berhasil login dengan NIM dan diarahkan ke dashboard mahasiswa', async ({ page }) => {
        // 1. SETUP DIALOG: Aplikasi web menggunakan window.alert() saat berhasil login.
        // Kita harus menyuruh Playwright untuk otomatis menyetujui (klik OK) alert tersebut agar pengujian tidak macet.
        page.on('dialog', dialog => dialog.accept());

        // 2. NAVIGASI: Arahkan browser otomatis ke halaman login
        await page.goto('/login.html');

        // 3. PENGISIAN FORM: Isi kolom input username (id #userInput) dengan NIM mahasiswa
        await page.fill('#userInput', '20210001');
        // Isi kolom input password (id #passInput) dengan password yang benar
        await page.fill('#passInput', 'TestPass123!');

        // 4. TINDAKAN: Klik tombol login yang memiliki class '.btn-primary'
        await page.click('button.btn-primary');

        // 5. VERIFIKASI NAVIGASI: Pastikan alamat URL browser berpindah ke halaman dashboard mahasiswa
        await expect(page).toHaveURL(/dashboardmahasiswa/);

        // 6. VERIFIKASI TOKEN: Pastikan token akses JWT disimpan dengan benar di localStorage browser
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeTruthy(); // Token harus ada (tidak bernilai null/kosong)
        expect(token.split('.').length).toBe(3); // Format token JWT valid selalu memiliki 3 bagian yang dipisah tanda titik (.)
    });

    test('admin berhasil login dengan No HP dan diarahkan ke dashboard admin', async ({ page }) => {
        // Setup otomatis klik OK pada pop-up alert sukses login
        page.on('dialog', dialog => dialog.accept());

        // Arahkan ke halaman login
        await page.goto('/login.html');

        // Isi input dengan nomor handphone admin (sebagai username) dan password
        await page.fill('#userInput', '081111000099');
        await page.fill('#passInput', 'TestPass123!');
        await page.click('button.btn-primary');

        // Pastikan URL berpindah ke halaman dashboard admin
        await expect(page).toHaveURL(/dashboardadmin/);

        // Ambil data sesi (session) dari localStorage untuk memverifikasi role-nya
        const session = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('tazkia_session'))
        );
        // Pastikan role yang tersimpan di dalam sesi browser adalah 'admin'
        expect(session.role).toBe('admin');
    });

    test('pembina berhasil login dengan No HP dan diarahkan ke dashboard pembina', async ({ page }) => {
        // Setup otomatis klik OK pada pop-up alert sukses login
        page.on('dialog', dialog => dialog.accept());

        // Arahkan ke halaman login
        await page.goto('/login.html');

        // Isi input dengan nomor handphone pembina dan password
        await page.fill('#userInput', '081111000001');
        await page.fill('#passInput', 'TestPass123!');
        await page.click('button.btn-primary');

        // Pastikan URL berpindah ke halaman dashboard pembina
        await expect(page).toHaveURL(/dashboardpembina/);

        // Ambil data sesi pembina dari localStorage browser
        const session = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('tazkia_session'))
        );
        // Pastikan role yang tersimpan di dalam sesi browser adalah 'pembina'
        expect(session.role).toBe('pembina');
    });

    test('session tersimpan dengan benar di localStorage setelah login', async ({ page }) => {
        // Setup otomatis klik OK pada pop-up alert sukses login
        page.on('dialog', dialog => dialog.accept());

        await page.goto('/login.html');
        await page.fill('#userInput', '20210001');
        await page.fill('#passInput', 'TestPass123!');
        await page.click('button.btn-primary');

        // Tunggu hingga URL browser mengarah ke halaman dashboard
        await page.waitForURL(/dashboard/);

        // Mengambil data JSON 'tazkia_session' yang disimpan oleh web di localStorage
        const session = await page.evaluate(() =>
            JSON.parse(localStorage.getItem('tazkia_session'))
        );
        // Memverifikasi apakah struktur objek session memiliki properti 'nama', 'nim', dan 'role' yang valid
        expect(session).toHaveProperty('nama');
        expect(session).toHaveProperty('nim', '20210001');
        expect(session).toHaveProperty('role', 'mahasiswa');
    });
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN: PROSES LOGIN YANG GAGAL
// ─────────────────────────────────────────────
test.describe('Login – Gagal', () => {
    
    test('menampilkan pesan error saat password salah', async ({ page }) => {
        await page.goto('/login.html');
        // Masukkan NIM yang benar tetapi password salah
        await page.fill('#userInput', '20210001');
        await page.fill('#passInput', 'passwordsalah');

        // MENGAMBIL PESAN ALERT: Kita ingin memverifikasi isi pesan pop-up error dari browser.
        // Kita membuat Promise yang akan menangkap pesan dialog alert ketika tombol login diklik.
        const alertMessage = await new Promise(resolve => {
            page.once('dialog', async dialog => {
                resolve(dialog.message()); // Ambil teks pesan di dalam alert
                await dialog.accept(); // Klik OK untuk menutup dialog
            });
            page.click('button.btn-primary'); // Klik tombol login untuk memicu alert
        });

        // Verifikasi apakah isi pesan alert mengandung kata "Password salah"
        expect(alertMessage).toMatch(/Password salah/i);
        // Pastikan browser tidak dialihkan dan tetap berada di halaman login atau beranda awal
        await expect(page).toHaveURL(/login|index/);
    });

    test('menampilkan pesan error saat NIM tidak terdaftar', async ({ page }) => {
        await page.goto('/login.html');
        // Masukkan NIM palsu yang tidak ada di database
        await page.fill('#userInput', '99999999');
        await page.fill('#passInput', 'TestPass123!');

        // Tangkap pesan dialog alert yang muncul
        const alertMessage = await new Promise(resolve => {
            page.once('dialog', async dialog => {
                resolve(dialog.message());
                await dialog.accept();
            });
            page.click('button.btn-primary');
        });

        // Verifikasi bahwa pesan alert menyebutkan bahwa user tidak ditemukan
        expect(alertMessage).toMatch(/tidak ditemukan/i);
    });

    test('menampilkan peringatan frontend saat field kosong', async ({ page }) => {
        await page.goto('/login.html');
        // Langsung klik login tanpa mengisi NIM/No HP maupun Password

        // Tangkap pesan dialog alert validasi frontend
        const alertMessage = await new Promise(resolve => {
            page.once('dialog', async dialog => {
                resolve(dialog.message());
                await dialog.accept();
            });
            page.click('button.btn-primary');
        });

        // Verifikasi pesan peringatan bahwa input Username/Password wajib diisi
        expect(alertMessage).toMatch(/Username|Password|harus diisi/i);
    });
});

// ─────────────────────────────────────────────
// GRUP PENGUJIAN: PROSES KELUAR SISTEM (LOGOUT)
// ─────────────────────────────────────────────
test.describe('Logout', () => {
    
    test('mahasiswa berhasil logout dan localStorage terhapus', async ({ page }) => {
        // Setup: Login secara instan lewat API backend agar menghemat waktu pengujian
        await loginViaAPI(page, 'mahasiswa');
        // Langsung arahkan browser ke halaman dashboard mahasiswa
        await page.goto('/dashboardmahasiswa.html');

        // Dengarkan dialog konfirmasi logout (pop-up "Apakah Anda yakin ingin logout?") lalu klik 'OK'
        page.on('dialog', dialog => dialog.accept());

        // Klik tombol logout yang berkelas '.logout-btn'
        await page.click('button.logout-btn');

        // Pastikan browser diarahkan kembali ke halaman beranda/login utama ('/')
        await expect(page).toHaveURL('/');

        // Verifikasi kebersihan localStorage: Token dan data session harus sudah terhapus (bernilai null)
        const token = await page.evaluate(() => localStorage.getItem('token'));
        const session = await page.evaluate(() => localStorage.getItem('tazkia_session'));
        expect(token).toBeNull();
        expect(session).toBeNull();
    });

    test('admin berhasil logout dari dashboard admin', async ({ page }) => {
        // Login cepat sebagai admin melalui API
        await loginViaAPI(page, 'admin');
        await page.goto('/dashboardadmin.html');

        // Setuju ketika muncul konfirmasi logout
        page.on('dialog', dialog => dialog.accept());
        await page.click('button.logout-btn');

        // Pastikan dialihkan ke halaman utama
        await expect(page).toHaveURL('/');
        // Pastikan token login admin sudah dihapus
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeNull();
    });

    test('membatalkan logout tidak menghapus session', async ({ page }) => {
        // Login cepat sebagai mahasiswa
        await loginViaAPI(page, 'mahasiswa');
        await page.goto('/dashboardmahasiswa.html');

        // BATALKAN DIALOG: Saat muncul dialog konfirmasi logout, kita klik 'Cancel' (dismiss)
        page.once('dialog', dialog => dialog.dismiss());
        await page.click('button.logout-btn');

        // Verifikasi browser harus tetap bertahan di halaman dashboard mahasiswa
        await expect(page).toHaveURL(/dashboardmahasiswa/);

        // Pastikan token login masih utuh dan tidak terhapus
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeTruthy();
    });
});
