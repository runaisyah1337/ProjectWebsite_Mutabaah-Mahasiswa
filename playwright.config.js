// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    // Folder tempat semua file spec E2E
    testDir: './e2e',

    // Timeout per test (60 detik)
    timeout: 60 * 1000,

    // Timeout untuk tiap assertion/expect
    expect: { timeout: 10000 },

    // Jalankan test secara berurutan (bukan paralel)
    // untuk menghindari konflik data pada MongoMemoryServer
    fullyParallel: false,
    workers: 1,

    // Ulangi test yang gagal sekali sebelum dianggap fail
    retries: 1,

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
        actionTimeout: 10000,
        navigationTimeout: 15000
    },

    // Jalankan server backend sebelum test dimulai
    // globalSetup dan globalTeardown mengatur lifecycle server
    globalSetup: './e2e/global-setup.js',
    globalTeardown: './e2e/global-teardown.js',

    // Hanya gunakan Chromium agar konsisten dan cepat
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ]
});
