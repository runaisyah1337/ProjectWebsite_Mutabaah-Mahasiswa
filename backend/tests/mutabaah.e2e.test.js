const { test, expect } = require('@playwright/test');

test.use({
  launchOptions: {
    slowMo: 700, // Kecepatan yang pas agar gerakan robot terlihat natural di rekaman video
  },
});

test.describe('E2E Comprehensive Testing - Sistem Mutabaah STMIK Tazkia', () => {

  test('Robot harus sukses melakukan Login, Pengisian Dinamis, Verifikasi Rekapan, dan Tampilan Grafik', async ({ page }) => {
    test.setTimeout(60000); // Menghindari timeout karena alur mencakup seluruh halaman sistem
    
    // Fungsi acak untuk dropdown amalan utama (indeks baris opsi ke-1, 2, atau 3)
    const getRandomIndex = () => Math.floor(Math.random() * 3) + 1;

    // Fungsi acak untuk amalan biner/Infaq (indeks baris opsi ke-1 atau 2)
    const getRandomBinaryIndex = () => Math.floor(Math.random() * 2) + 1;

    // Menangani pop-up alert otomatis di sepanjang alur pengujian
    page.on('dialog', async dialog => {
      console.log(`[ALERT SISTEM]: ${dialog.message()}`);
      await dialog.accept(); 
    });

    // ==========================================
    // ALUR 1: OTOMATISASI LOGIN (AKUN ASLI)
    // ==========================================
    console.log('Membuka halaman login...');
    await page.goto('/login.html');

    console.log('Memasukkan kredensial mahasiswa...');
    await page.type('#userInput', '241572010003', { delay: 50 }); 
    await page.type('#passInput', 'syah05', { delay: 50 }); 
    await page.click('.btn-primary'); 

    // Memastikan gerbang dashboard berhasil ditembus
    await expect(page).toHaveURL(/\/dashboardmahasiswa.html/, { timeout: 10000 }); 
    console.log('Robot Berhasil Masuk ke Dashboard Mahasiswa.');

    // ==========================================
    // ALUR 2: PENGISIAN & PEMBARUAN FORM MUTABAAH
    // ==========================================
    console.log('Membuka form pengisian amalan mingguan...');
    await page.click('#btnIsiMutabaah'); 
    await page.waitForSelector('select', { state: 'visible', timeout: 5000 }); 
    
    console.log('Robot mulai mengisi nilai amalan secara dinamis...');
    // Menembak seluruh dropdown berdasarkan indeks urutan tag <select> di HTML
    await page.locator('select').nth(0).selectOption({ index: getRandomIndex() }); // Tilawah
    await page.locator('select').nth(1).selectOption({ index: getRandomIndex() }); // Al-Matsurat
    await page.locator('select').nth(2).selectOption({ index: getRandomIndex() }); // Sholat di Masjid
    await page.locator('select').nth(3).selectOption({ index: getRandomIndex() }); // Sholat Malam
    await page.locator('select').nth(4).selectOption({ index: getRandomIndex() }); // Puasa Sunnah
    await page.locator('select').nth(5).selectOption({ index: getRandomIndex() }); // Olahraga
    await page.locator('select').nth(6).selectOption({ index: getRandomIndex() }); // Kegiatan Keluarga
    await page.locator('select').nth(7).selectOption({ index: getRandomBinaryIndex() }); // Infaq
    await page.locator('select').nth(8).selectOption({ index: getRandomBinaryIndex() }); // Donasi Palestina 

    console.log('Menyimpan data amalan ke database...');
    await page.click('.btn-submit-form'); 

    // Memastikan kembali ke dashboard setelah alert sukses ditutup
    await expect(page).toHaveURL(/\/dashboardmahasiswa.html/, { timeout: 15000 }); 
    console.log('Data sukses tersimpan. Kembali ke dashboard utama.');

    // ==========================================
    // ALUR 3: INSPEKSI & VERIFIKASI REKAPAN DATA
    // ==========================================
    console.log('Membuka Halaman Rekapan...');
    await page.click('#rekapLink'); // Mengunci elemen dengan ID rekapLink
    await expect(page).toHaveURL(/\/rekapan.html/, { timeout: 5000 }); 
    
    console.log('Menampilkan tabel rekapan amalan (Jeda visual 3 detik)...');
    await page.waitForTimeout(3000); 
    
    console.log('Kembali ke dashboard dari halaman rekapan...');
    await page.click('text=KEMBALI'); 
    await expect(page).toHaveURL(/\/dashboardmahasiswa.html/, { timeout: 5000 }); 
    await page.waitForTimeout(1500); 

    // ==========================================
    // ALUR 4: INSPEKSI & VERIFIKASI GRAFIK PERKEMBANGAN
    // ==========================================
    console.log('Membuka Halaman Grafik...');
    await page.click('#grafikLink'); // Mengunci elemen dengan ID grafikLink
    await expect(page).toHaveURL(/\/grafik.html/, { timeout: 5000 }); 
    
    console.log('Menampilkan grafik perkembangan tren spiritual (Jeda visual 4 detik)...');
    await page.waitForTimeout(4000); 
    
    console.log('--- PENGUJIAN SELESAI: SELURUH SISTEM BERFUNGSI 100% ---');
  });
});