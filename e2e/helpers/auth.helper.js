// e2e/helpers/auth.helper.js
// Helper reusable untuk login dan setup session di Playwright tests

const SERVER_URL = 'http://localhost:3001';

/**
 * Kredensial test yang di-seed oleh global-setup.js
 * Password untuk semua user: TestPass123!
 */
const TEST_USERS = {
    mahasiswa: { identifier: '20210001', password: 'TestPass123!', role: 'mahasiswa', nama: 'Ahmad Fulan' },
    mahasiswa2: { identifier: '20210002', password: 'TestPass123!', role: 'mahasiswa', nama: 'Budi Santoso' },
    pembina:   { identifier: '081111000001', password: 'TestPass123!', role: 'pembina', nama: 'Siti Aminah' },
    admin:     { identifier: '081111000099', password: 'TestPass123!', role: 'admin', nama: 'Admin Tazkia' }
};

/**
 * Login via UI (mengisi form login di browser)
 * Cocok untuk test yang benar-benar menguji alur UI login
 * @param {import('@playwright/test').Page} page
 * @param {'mahasiswa'|'mahasiswa2'|'pembina'|'admin'} role
 */
async function loginViaUI(page, role = 'mahasiswa') {
    const user = TEST_USERS[role];
    await page.goto('/login.html');
    await page.waitForLoadState('networkidle');

    await page.fill('#userInput', user.identifier);
    await page.fill('#passInput', user.password);

    // Tangkap dialog alert (konfirmasi login berhasil) lalu dismiss
    page.once('dialog', dialog => dialog.accept());
    await page.click('button.btn-primary');

    // Tunggu navigasi ke dashboard selesai
    await page.waitForURL(/dashboard/);
}

/**
 * Login via API (bypass UI) dan inject token ke localStorage
 * Jauh lebih cepat — digunakan sebagai beforeEach untuk test
 * yang ingin skip alur login dan langsung test fitur lain
 * @param {import('@playwright/test').Page} page
 * @param {'mahasiswa'|'mahasiswa2'|'pembina'|'admin'} role
 */
async function loginViaAPI(page, role = 'mahasiswa') {
    const user = TEST_USERS[role];

    // Panggil API login langsung (tidak lewat browser)
    const res = await page.request.post(`${SERVER_URL}/api/auth/login`, {
        data: { identifier: user.identifier, password: user.password }
    });

    if (!res.ok()) {
        const body = await res.text();
        throw new Error(`Login API gagal untuk role ${role}: ${res.status()} - ${body}`);
    }

    const data = await res.json();

    // Buka halaman kosong dulu agar bisa set localStorage pada origin yang benar
    await page.goto('/login.html');
    await page.waitForLoadState('domcontentloaded');

    // Inject token & session ke localStorage (simulasi setelah login berhasil)
    await page.evaluate(({ token, userData }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('tazkia_session', JSON.stringify(userData));
    }, { token: data.token, userData: data.user });

    return data;
}

/**
 * Logout via UI
 * @param {import('@playwright/test').Page} page
 */
async function logoutViaUI(page) {
    page.once('dialog', dialog => dialog.accept());
    await page.click('button.logout-btn');
    await page.waitForURL('/');
}

/**
 * Bersihkan session (simulasi logout manual)
 * @param {import('@playwright/test').Page} page
 */
async function clearSession(page) {
    try {
        if (page.url() !== 'about:blank') {
            await page.evaluate(() => localStorage.clear());
        }
    } catch (e) {
        // Abaikan error jika halaman tidak mengizinkan akses localStorage (misal origin tidak valid)
    }
}

module.exports = { loginViaUI, loginViaAPI, logoutViaUI, clearSession, TEST_USERS };
