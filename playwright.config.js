// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

// Deteksi apakah sedang dijalankan dalam mode lambat (headed/demo)
// PWSLOWMO diisi oleh script test:e2e:headed di package.json
const slowMoMs = Number(process.env.PWSLOWMO) || 0;

// Jika slowMo aktif (mode headed), timeout per test diperbesar agar
// tidak kehabisan waktu akibat jeda yang disengaja
const testTimeout = slowMoMs > 0
    ? 10 * 60 * 1000 // 10 menit — sangat longgar untuk demo dengan kecepatan sangat lambat
    : 60 * 1000;     // 1 menit — untuk mode headless normal

module.exports = defineConfig({
    // Folder tempat semua file spec E2E
    testDir: './e2e',

    // Timeout per test (otomatis menyesuaikan mode)
    timeout: testTimeout,

    // Timeout untuk tiap assertion/expect
    expect: { timeout: slowMoMs > 0 ? 60000 : 10000 },

    // Jalankan test secara berurutan (bukan paralel)
    // untuk menghindari konflik data pada MongoMemoryServer
    fullyParallel: false,
    workers: 1,

    // Ulangi test yang gagal sekali sebelum dianggap fail
    // Mode headed tidak perlu retry (bisa membingungkan saat demo)
    retries: slowMoMs > 0 ? 0 : 1,

    // Reporter: HTML (buka di browser) + terminal ringkas
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['list']
    ],

    // Konfigurasi global untuk semua test
    use: {
        // Base URL server test
        baseURL: 'http://localhost:3001',

        // Screenshot otomatis saat test gagal
        screenshot: 'only-on-failure',

        // Video rekaman saat retry
        video: 'on-first-retry',

        // Trace saat retry (untuk debug)
        trace: 'on-first-retry',

        // Sedikit delay agar UI sempat merender
        actionTimeout: slowMoMs > 0 ? 60000 : 10000,
        navigationTimeout: slowMoMs > 0 ? 60000 : 15000
    },

    // Jalankan server backend sebelum test dimulai
    // globalSetup dan globalTeardown mengatur lifecycle server
    globalSetup: './e2e/global-setup.js',
    globalTeardown: './e2e/global-teardown.js',

    // Hanya gunakan Chromium agar konsisten dan cepat
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],

                // slowMo: Jeda antar setiap aksi Playwright (klik, isi form, navigasi, dsb.)
                // Nilai diambil dari environment variable PWSLOWMO (dalam milidetik).
                //   - Mode normal/headless : PWSLOWMO tidak diset → slowMo = 0 (tidak ada jeda, cepat)
                //   - Mode headed (demo)   : PWSLOWMO=1000 → jeda 1 detik per aksi
                // Cara aktifkan: jalankan 'npm run test:e2e:headed'
                slowMo: slowMoMs
            }
        }
    ]
});
