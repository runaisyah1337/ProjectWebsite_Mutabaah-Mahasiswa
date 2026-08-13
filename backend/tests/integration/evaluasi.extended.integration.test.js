// 1. IMPORT LIBRARIES & FILES YANG DIBUTUHKAN
// supertest digunakan untuk menembak endpoint API backend secara virtual dalam pengujian.
const request = require('supertest');
// File utama aplikasi Express backend (backend/src/app.js).
const app = require('../../src/app');
// Helper setup database memori bayangan.
const setup = require('../setup');
// Model database User.
const User = require('../../src/models/User');
// Model database Evaluation (untuk mencatat poin amalan harian/mingguan).
const Evaluation = require('../../src/models/Evaluation');
// jsonwebtoken untuk membuat JWT token (tanda pengenal) simulasi user yang sedang login.
const jwt = require('jsonwebtoken');

// 2. LIFECYCLE HOOKS (TAHAPAN PENGUJIAN)
beforeAll(async () => {
    // Siapkan JWT_SECRET sementara jika belum dikonfigurasi di environment local
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
    // Nyalakan database memori
    await setup.connect();
});

afterEach(async () => {
    // Bersihkan database dari data test sebelumnya agar setiap test dimulai dengan kondisi bersih (isolated)
    await setup.clearDatabase();
});

afterAll(async () => {
    // Matikan database memori setelah seluruh rangkaian test dalam file ini rampung
    await setup.closeDatabase();
});

// ─────────────────────────────────────────────
// 3. FUNGSI PEMBANTU (HELPERS) UNTUK TESTING
// ─────────────────────────────────────────────

/**
 * Membuat data user baru di database memori lalu langsung men-generate token JWT login-nya.
 * @param {Object} overrides - Untuk mengganti field bawaan (misal email, nama, role, nim) sesuai kebutuhan skenario test.
 * @returns {Object} { user, token }
 */
async function createUserWithToken(overrides = {}) {
    // Data bawaan mahasiswa
    const defaults = {
        nama: 'Fulan',
        email: 'fulan@test.com',
        password: 'hashedpassword',
        role: 'mahasiswa',
        nim: '112233'
    };
    // Simpan ke database
    const user = await User.create({ ...defaults, ...overrides });
    // Tanda tangani JWT dengan menyimpan payload data user & ditandatangani memakai JWT_SECRET
    const token = jwt.sign(
        { id: user._id, nim: user.nim, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    return { user, token };
}

/**
 * Menghitung periode waktu saat ini (minggu ke berapa, bulan apa, tahun berapa).
 * Berguna untuk mencocokkan penyimpanan data evaluasi mutabaah mahasiswa.
 */
function todayPeriod() {
    const today = new Date();
    const month = today.getMonth() + 1; // getMonth() dimulai dari 0 (Januari = 0), jadi ditambah 1
    const year = today.getFullYear();
    // Menghitung minggu ke berapa dalam bulan ini
    const firstDay = new Date(year, today.getMonth(), 1).getDay();
    const weekStart = Math.ceil((today.getDate() + firstDay) / 7);
    return { month, year, weekStart };
}

// ─────────────────────────────────────────────
// 4. GRUP PENGUJIAN: API WEBHOOK (PENGIRIMAN DATA AMALAN)
// ─────────────────────────────────────────────
describe('Evaluasi – Webhook (Submit)', () => {
    it('menolak request tanpa token (401)', async () => {
        // TINDAKAN: Kirim data jawaban amalan tapi tanpa menyisipkan token Authorization di header
        const res = await request(app)
            .post('/api/evaluasi/webhook')
            .send({ studentId: '112233', jawaban: { tilawah: 3 } });

        // VERIFIKASI: Status code harus 401 (Unauthorized / Belum Login)
        expect(res.statusCode).toEqual(401);
    });

    it('menolak token tidak valid (401)', async () => {
        // TINDAKAN: Kirim data amalan dengan menyertakan token palsu/asal-asalan
        const res = await request(app)
            .post('/api/evaluasi/webhook')
            .set('Authorization', 'Bearer token_palsu_tidak_valid')
            .send({ jawaban: { tilawah: 3 } });

        // VERIFIKASI: Status code harus tetap 401 karena token tidak dikenali/tidak sah
        expect(res.statusCode).toEqual(401);
    });

    it('mahasiswa berhasil submit evaluasi dengan token valid (200)', async () => {
        // PERSIAPAN: Buat user mahasiswa dan dapatkan token loginnya
        const { token } = await createUserWithToken();

        // TINDAKAN: Kirim request POST ke webhook membawa token valid & isian amalan yaumi
        const res = await request(app)
            .post('/api/evaluasi/webhook')
            .set('Authorization', `Bearer ${token}`)
            .send({ jawaban: { tilawah: 3, sholatMasjid: 21 } });

        // VERIFIKASI: Status code 200 (OK/Sukses) dan pesan sukses 'Berhasil'
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Berhasil');

        // Pastikan di database tersimpan data amalan mahasiswa ybs
        const evals = await Evaluation.find({ studentId: '112233' });
        expect(evals.length).toBe(1);
        expect(evals[0].jawaban.tilawah).toBe(3);
    });

    it('mahasiswa tidak bisa mengubah studentId (paksa pakai NIM sendiri)', async () => {
        // PERSIAPAN: Buat user mahasiswa dengan NIM '112233'
        const { token } = await createUserWithToken();

        // TINDAKAN: Coba nakal dengan mengirimkan 'studentId' milik orang lain ('999999') di dalam body request
        const res = await request(app)
            .post('/api/evaluasi/webhook')
            .set('Authorization', `Bearer ${token}`)
            .send({ studentId: '999999', jawaban: { tilawah: 2 } });

        expect(res.statusCode).toEqual(200);

        // VERIFIKASI: Sistem backend yang aman harus mengabaikan studentId kiriman body dan memaksa memakai NIM asli dari token JWT
        // Cari data mahasiswa kita (112233)
        const evals = await Evaluation.find({ studentId: '112233' });
        expect(evals.length).toBe(1); // Data tersimpan di NIM kita sendiri
        
        // Cari data NIM palsu (999999)
        const evalsFake = await Evaluation.find({ studentId: '999999' });
        expect(evalsFake.length).toBe(0); // Data tidak boleh tersimpan di NIM palsu tersebut
    });

    it('submit ulang minggu yang sama hanya update (upsert), tidak duplikat', async () => {
        // PERSIAPAN: Dapatkan token login mahasiswa
        const { token } = await createUserWithToken();

        // TINDAKAN 1: Mengirimkan evaluasi pertama kali (misal poin tilawah = 1)
        await request(app)
            .post('/api/evaluasi/webhook')
            .set('Authorization', `Bearer ${token}`)
            .send({ jawaban: { tilawah: 1 } });

        // TINDAKAN 2: Mahasiswa memperbarui amalan di minggu yang sama (mengirim ulang, misal tilawah = 3)
        await request(app)
            .post('/api/evaluasi/webhook')
            .set('Authorization', `Bearer ${token}`)
            .send({ jawaban: { tilawah: 3 } });

        // VERIFIKASI: 
        const evals = await Evaluation.find({ studentId: '112233' });
        // Dokumen di database harus tetap berjumlah 1 (tidak duplikat), melainkan diupdate (proses Upsert)
        expect(evals.length).toBe(1);
        // Pastikan nilai amalan terupdate menjadi nilai yang baru (3)
        expect(evals[0].jawaban.tilawah).toBe(3);
    });
});

// ─────────────────────────────────────────────
// 5. GRUP PENGUJIAN: PENGAMBILAN STATISTIK MAHASISWA
// ─────────────────────────────────────────────
describe('Evaluasi – Get Stats', () => {
    it('mengembalikan data evaluasi mahasiswa sendiri', async () => {
        // PERSIAPAN: Daftarkan mahasiswa & tentukan periode tanggal saat ini
        const { token } = await createUserWithToken();
        const { month, year, weekStart } = todayPeriod();

        // Buat data evaluasi secara langsung di database memori
        await Evaluation.create({
            studentId: '112233',
            weekStart,
            month,
            year,
            jawaban: { tilawah: 3 }
        });

        // TINDAKAN: Mintalah statistik lewat API GET '/api/evaluasi/stats'
        const res = await request(app)
            .get('/api/evaluasi/stats')
            .set('Authorization', `Bearer ${token}`);

        // VERIFIKASI:
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBe(1);
        expect(res.body[0].jawaban.tilawah).toBe(3);
    });

    it('mengembalikan array kosong jika belum ada data', async () => {
        // PERSIAPAN: Mahasiswa baru terdaftar dan belum pernah mengisi amalan/evaluasi apa pun
        const { token } = await createUserWithToken();

        // TINDAKAN: Ambil statistik amalan
        const res = await request(app)
            .get('/api/evaluasi/stats')
            .set('Authorization', `Bearer ${token}`);

        // VERIFIKASI:
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        // Responnya harus array kosong [] (length = 0) karena belum pernah input data amalan
        expect(res.body.length).toBe(0);
    });

    it('menolak akses tanpa token (401)', async () => {
        // TINDAKAN: Coba ambil statistik tanpa menyertakan login
        const res = await request(app).get('/api/evaluasi/stats');
        // VERIFIKASI: Harus ditolak dengan kode 401
        expect(res.statusCode).toEqual(401);
    });
});

// ─────────────────────────────────────────────
// 6. GRUP PENGUJIAN: HAK AKSES PENGAMBILAN SEMUA STATISTIK (ROLE-BASED ACCESS CONTROL)
// ─────────────────────────────────────────────
describe('Evaluasi – Get All Stats (RBAC)', () => {
    it('admin dapat mengakses all-stats (200)', async () => {
        // PERSIAPAN: Buat user dengan role 'admin'
        const { token } = await createUserWithToken({
            nama: 'Admin', email: 'admin@test.com', role: 'admin', nim: undefined, no_hp: '081234'
        });

        // TINDAKAN: Admin menembak route all-stats
        const res = await request(app)
            .get('/api/evaluasi/all-stats')
            .set('Authorization', `Bearer ${token}`);

        // VERIFIKASI:
        expect(res.statusCode).toEqual(200);
        // Admin berhak menerima data statistik, daftar mahasiswa, grafik frekuensi, dan skor total mingguan
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('students');
        expect(res.body).toHaveProperty('frequencyData');
        expect(res.body).toHaveProperty('weeklyTotalScores');
    });

    it('pembina dapat mengakses all-stats (200)', async () => {
        // PERSIAPAN: Buat user dengan role 'pembina' (pembimbing asrama/mahasiswa)
        const { token } = await createUserWithToken({
            nama: 'Pembina', email: 'pembina@test.com', role: 'pembina', nim: undefined, no_hp: '081235'
        });

        // TINDAKAN: Pembina mengakses all-stats
        const res = await request(app)
            .get('/api/evaluasi/all-stats')
            .set('Authorization', `Bearer ${token}`);

        // VERIFIKASI: Pembina juga berhak melihat perkembangan amalan seluruh mahasiswa (200 OK)
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
    });

    it('mahasiswa TIDAK DAPAT mengakses all-stats (403)', async () => {
        // PERSIAPAN: Buat user mahasiswa biasa
        const { token } = await createUserWithToken();

        // TINDAKAN: Mahasiswa lancang meminta semua data statistik mahasiswa lain
        const res = await request(app)
            .get('/api/evaluasi/all-stats')
            .set('Authorization', `Bearer ${token}`);

        // VERIFIKASI:
        // Harus ditolak dengan kode 403 (Forbidden / Hak Akses Ditolak)
        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toMatch(/ditolak/i);
    });

    it('tanpa token ditolak (401)', async () => {
        // TINDAKAN: Mengakses API data massal tanpa login
        const res = await request(app).get('/api/evaluasi/all-stats');
        expect(res.statusCode).toEqual(401);
    });

    it('all-stats mengembalikan currentWeek dan currentMonth', async () => {
        // PERSIAPAN: Buat user admin
        const { token } = await createUserWithToken({
            nama: 'Admin', email: 'admin@test.com', role: 'admin', nim: undefined, no_hp: '081234'
        });

        // TINDAKAN: Ambil data all-stats
        const res = await request(app)
            .get('/api/evaluasi/all-stats')
            .set('Authorization', `Bearer ${token}`);

        // VERIFIKASI: Memastikan struktur output menyertakan informasi minggu dan bulan saat ini
        expect(res.body).toHaveProperty('currentWeek');
        expect(res.body).toHaveProperty('currentMonth');
        expect(typeof res.body.currentWeek).toBe('number');
    });
});
