// e2e/global-teardown.js
// Dijalankan SEKALI setelah semua test E2E selesai.
// Tugas: cleanup database dan kill server process.

const SERVER_URL = 'http://localhost:3001';

module.exports = async function globalTeardown() {
    console.log('\n🧹 [E2E Global Teardown] Cleaning up...');

    try {
        // Bersihkan semua data test dari in-memory database
        const cleanupRes = await fetch(`${SERVER_URL}/api/test/cleanup`, { method: 'POST' });
        if (cleanupRes.ok) {
            const data = await cleanupRes.json();
            console.log('✅ [E2E Global Teardown] Cleanup selesai:', data.collections?.join(', '));
        }
    } catch {
        // Server mungkin sudah mati, abaikan error
        console.warn('⚠️  [E2E Global Teardown] Tidak bisa cleanup (server sudah mati?)');
    }

    // Kill server process menggunakan PID yang disimpan di global-setup
    const pid = process.env.E2E_SERVER_PID;
    if (pid) {
        try {
            process.kill(Number(pid), 'SIGTERM');
            console.log(`✅ [E2E Global Teardown] Server (PID ${pid}) dihentikan.`);
        } catch (err) {
            console.warn(`⚠️  [E2E Global Teardown] Gagal kill PID ${pid}:`, err.message);
        }
    }

    console.log('✅ [E2E Global Teardown] Selesai.\n');
};
