// e2e/global-setup.js
// Dijalankan SEKALI sebelum semua test E2E dimulai.
// Tugas: start backend server dengan database in-memory, lalu seed data awal.

const { spawn } = require('child_process');
const path = require('path');

const SERVER_PORT = 3001;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const BACKEND_DIR = path.join(__dirname, '..', 'backend');

/**
 * Tunggu sampai server siap menerima request.
 * Polling GET /api/test/status setiap 500ms, maksimal 60 detik.
 * dbState 1 = Mongoose terhubung ke MongoMemoryServer
 */
async function waitForServer(url, maxWaitMs = 60000) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
        try {
            const res = await fetch(`${url}/api/test/status`);
            if (res.ok) {
                const data = await res.json();
                if (data.ok && data.dbState === 1) return true;
            }
        } catch {
            // Server belum siap, lanjut polling
        }
        await new Promise(r => setTimeout(r, 500));
    }
    throw new Error(`Server tidak siap setelah ${maxWaitMs}ms`);
}

module.exports = async function globalSetup() {
    console.log('\n🚀 [E2E Global Setup] Starting test server...');

    // Gunakan server-test.js yang menginisialisasi MongoMemoryServer sendiri
    const serverProcess = spawn(
        'node',
        ['src/server-test.js'],
        {
            cwd: BACKEND_DIR,
            env: {
                ...process.env,
                NODE_ENV: 'test',
                PORT: String(SERVER_PORT),
                JWT_SECRET: 'test_secret_mutabaah_e2e_2026',
                EMAIL_USER: 'test@test.com',
                EMAIL_PASS: 'testpass',
                // Kosongkan MONGO_URI — server-test.js pakai MongoMemoryServer
                MONGO_URI: '',
                // Arahkan ke cache binary yang sudah didownload di node_modules backend
                // agar tidak perlu re-download saat spawned sebagai proses terpisah
                MONGOMS_DOWNLOAD_DIR: path.join(BACKEND_DIR, 'node_modules', '.cache', 'mongodb-memory-server'),
                MONGOMS_VERSION: '8.2.6'
            },
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false
        }
    );

    // Simpan PID agar bisa di-kill di globalTeardown
    process.env.E2E_SERVER_PID = String(serverProcess.pid);

    serverProcess.stdout.on('data', (data) => {
        process.stdout.write(`[Server] ${data}`);
    });
    serverProcess.stderr.on('data', (data) => {
        process.stderr.write(`[Server ERR] ${data}`);
    });
    serverProcess.on('error', (err) => {
        console.error('[E2E] Server process error:', err);
    });
    serverProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
            console.error(`[E2E] Server exit dengan kode: ${code}`);
        }
    });

    // Tunggu server siap (MongoMemoryServer + Express + Mongoose connected)
    await waitForServer(SERVER_URL);
    console.log('✅ [E2E Global Setup] Server ready at', SERVER_URL);

    // Seed data awal: 4 user + DataMaster
    const seedRes = await fetch(`${SERVER_URL}/api/test/seed`, { method: 'POST' });
    if (!seedRes.ok) {
        const body = await seedRes.text();
        throw new Error(`Seed gagal: ${body}`);
    }
    const seedData = await seedRes.json();
    console.log('🌱 [E2E Global Setup] Seed selesai:', seedData.seeded.join(', '));
};

