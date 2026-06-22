// e2e/helpers/db.helper.js
// Helper untuk seed dan cleanup data via test endpoint API

const SERVER_URL = 'http://localhost:3001';

/**
 * Bersihkan semua data test dari database in-memory
 * Dipanggil di afterEach pada test yang membuat data baru
 * (agar test berikutnya mulai dari kondisi bersih)
 * 
 * ⚠️ Setelah cleanup, jangan lupa re-seed data awal
 * jika test berikutnya membutuhkannya.
 */
async function cleanupDatabase() {
    const res = await fetch(`${SERVER_URL}/api/test/cleanup`, { method: 'POST' });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Database cleanup gagal: ${body}`);
    }
    return res.json();
}

/**
 * Seed ulang data awal (4 user + DataMaster)
 * Dipanggil setelah cleanup jika test berikutnya butuh fresh data
 */
async function seedInitialData() {
    const res = await fetch(`${SERVER_URL}/api/test/seed`, { method: 'POST' });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Seed gagal: ${body}`);
    }
    return res.json();
}

/**
 * Seed data evaluasi untuk mahasiswa dengan NIM 20210001 (minggu berjalan)
 * Digunakan oleh test yang butuh data existing di form assessment
 */
async function seedEvaluationData() {
    const res = await fetch(`${SERVER_URL}/api/test/seed-evaluation`, { method: 'POST' });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Evaluation seed gagal: ${body}`);
    }
    return res.json();
}

/**
 * Reset database ke kondisi awal: cleanup + seed ulang
 * Shortcut untuk digunakan di afterEach ketika test membuat/mengubah data
 */
async function resetDatabase() {
    await cleanupDatabase();
    await seedInitialData();
}

module.exports = { cleanupDatabase, seedInitialData, seedEvaluationData, resetDatabase };
