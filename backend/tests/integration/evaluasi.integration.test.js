// 1. IMPORT LIBRARIES & FILES YANG DIBUTUHKAN
// supertest digunakan untuk menembak endpoint API Express tanpa perlu menyalakan server di port riil.
const request = require('supertest');
// Mengimport file utama aplikasi Express kita.
const app = require('../../src/app');
// Mengimport helper setup database memori bayangan.
const setup = require('../setup');
// Mengimport model User database.
const User = require('../../src/models/User');
// Mengimport model Evaluation database untuk data evaluasi harian/mingguan mahasiswa.
const Evaluation = require('../../src/models/Evaluation');
// jsonwebtoken digunakan untuk membuat (menandatangani) token JWT tiruan agar test bisa login.
const jwt = require('jsonwebtoken');

// 2. LIFECYCLE HOOKS (TAHAPAN PENGUJIAN)
beforeAll(async () => {
    // Pastikan environment variable JWT_SECRET terisi nilai sementara (jika belum ada).
    // Nilai rahasia ini digunakan untuk men-generate token JWT tiruan bagi test.
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
    // Hubungkan ke database memori bayangan
    await setup.connect();
});

afterEach(async () => {
    // Bersihkan database setelah setiap skenario test selesai
    await setup.clearDatabase();
});

afterAll(async () => {
    // Matikan database memori setelah seluruh test selesai
    await setup.closeDatabase();
});

// 3. GRUP PENGUJIAN: FITUR EVALUASI & AMALAN YAUMI (MUTABAAH)
describe('Evaluasi Integration Tests', () => {
    // Variabel penampung token JWT untuk simulasi login mahasiswa dan admin
    let tokenMahasiswa;
    let tokenAdmin;

    // Sebelum setiap pengujian di grup ini berjalan, buat user Mahasiswa & Admin,
    // lalu generate token JWT untuk masing-masing agar bisa disisipkan ke header request pengujian.
    beforeEach(async () => {
        // A. Buat User Mahasiswa
        const mhs = await User.create({
            nama: 'Fulan',
            email: 'fulan@test.com',
            password: 'hashedpassword',
            role: 'mahasiswa',
            nim: '112233'
        });
        // Tanda tangani token JWT mahasiswa dengan menyisipkan ID, NIM, dan role ke dalam payload token
        tokenMahasiswa = jwt.sign({ id: mhs._id, nim: mhs.nim, role: mhs.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // B. Buat User Admin
        const admin = await User.create({
            nama: 'Admin',
            email: 'admin@test.com',
            password: 'hashedpassword',
            role: 'admin',
            no_hp: '081234'
        });
        // Tanda tangani token JWT admin
        tokenAdmin = jwt.sign({ id: admin._id, nim: admin.nim, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    });

    // SKENARIO 1: Keamanan API Webhook
    // Endpoint ini harus dijaga ketat. Jika ada yang menembak API tanpa login, server wajib menolak.
    it('should reject webhook submission without token', async () => {
        // TINDAKAN: Kirim request POST ke webhook tanpa membawa header otorisasi (token)
        const res = await request(app)
            .post('/api/evaluasi/webhook')
            .send({ studentId: '112233', jawaban: { tilawah: 3 } });

        // VERIFIKASI:
        // Status code 401 berarti Unauthorized (tidak memiliki hak akses karena belum login)
        expect(res.statusCode).toEqual(401);
    });

    // SKENARIO 2: Pengiriman Evaluasi Berhasil
    it('should accept webhook submission with valid student token', async () => {
        // TINDAKAN: Kirim request POST ke webhook dengan membawa token JWT mahasiswa di header Authorization
        const res = await request(app)
            .post('/api/evaluasi/webhook')
            .set('Authorization', `Bearer ${tokenMahasiswa}`) // Menyisipkan token login
            .send({
                jawaban: { tilawah: 3, sholatMasjid: 21 } // Mengirim isian evaluasi amalan harian
            });

        // VERIFIKASI:
        // Status code 200 (OK / Sukses)
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Berhasil');

        // Verifikasi ke database: cari apakah data evaluasi mahasiswa dengan NIM '112233' sudah tersimpan
        const evals = await Evaluation.find({ studentId: '112233' });
        // Pastikan jumlah data evaluasi yang tersimpan adalah 1
        expect(evals.length).toBe(1);
        // Pastikan isi jawabannya cocok dengan yang dikirim tadi (tilawah: 3)
        expect(evals[0].jawaban.tilawah).toBe(3);
    });

    // SKENARIO 3: Melihat Statistik Amalan Sendiri (Oleh Mahasiswa)
    it('should return stats for a student', async () => {
        // PERSIAPAN: Masukkan 1 baris data evaluasi mahasiswa ke database secara manual
        const today = new Date();
        await Evaluation.create({
            studentId: '112233',
            weekStart: 1,
            month: today.getMonth() + 1,
            year: today.getFullYear(),
            jawaban: { tilawah: 3 }
        });

        // TINDAKAN: Kirim request GET untuk mengambil statistik amalan mahasiswa ybs
        const res = await request(app)
            .get('/api/evaluasi/stats')
            .set('Authorization', `Bearer ${tokenMahasiswa}`); // Memakai token mahasiswa yang valid

        // VERIFIKASI:
        expect(res.statusCode).toEqual(200);
        // Respon body yang dikembalikan harus berupa Array (daftar data statistik)
        expect(Array.isArray(res.body)).toBeTruthy();
        // Jumlah datanya harus 1
        expect(res.body.length).toBe(1);
        // Data di dalam array harus memiliki nilai amalan yang tepat
        expect(res.body[0].jawaban.tilawah).toBe(3);
    });

    // SKENARIO 4: Admin Melihat Semua Statistik Mahasiswa
    // Admin harus memiliki wewenang penuh untuk memantau perkembangan seluruh mahasiswa.
    it('should allow admin to get all stats', async () => {
        // TINDAKAN: Kirim request GET ke rute '/api/evaluasi/all-stats' dengan token Admin
        const res = await request(app)
            .get('/api/evaluasi/all-stats')
            .set('Authorization', `Bearer ${tokenAdmin}`);

        // VERIFIKASI:
        expect(res.statusCode).toEqual(200);
        // Memastikan respon sukses dan mengembalikan objek data para mahasiswa (students)
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('students');
    });

    // SKENARIO 5: Mahasiswa Dilarang Melihat Statistik Semua Mahasiswa Lain
    // Ini adalah uji keamanan otorisasi (Role-based access control). Mahasiswa tidak boleh mengakses data mahasiswa lain.
    it('should forbid student to get all stats', async () => {
        // TINDAKAN: Mahasiswa mencoba menembak API admin '/api/evaluasi/all-stats' menggunakan token mahasiswanya
        const res = await request(app)
            .get('/api/evaluasi/all-stats')
            .set('Authorization', `Bearer ${tokenMahasiswa}`);

        // VERIFIKASI:
        // Status code 403 bermakna Forbidden (Terlarang/Dilarang masuk karena tidak punya wewenang)
        expect(res.statusCode).toEqual(403);
    });
});
