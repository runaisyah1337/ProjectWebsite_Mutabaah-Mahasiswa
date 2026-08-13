// 1. IMPORT LIBRARIES & FILES YANG DIBUTUHKAN
// supertest digunakan untuk mensimulasikan request HTTP (POST, GET, dll.) ke aplikasi Express kita tanpa harus menyalakan server secara manual.
const request = require('supertest');
// Mengimport file utama aplikasi Express kita (backend/src/app.js) agar supertest tahu rute mana saja yang tersedia.
const app = require('../../src/app');
// Mengimport helper setup database memori yang sudah kita buat sebelumnya (backend/tests/setup.js).
const setup = require('../setup');
// Mengimport model User database untuk mengecek isi database secara langsung dalam pengujian.
const User = require('../../src/models/User');
// Mengimport model DataMaster database untuk membuat data mahasiswa master sebelum registrasi.
const DataMaster = require('../../src/models/DataMaster');

// 2. MOCKING (SIMULASI/TIRUAN)
// Di dalam fitur 'Forgot Password', sistem kita mengirimkan email asli menggunakan library 'nodemailer'.
// Agar saat test kita tidak benar-benar mengirim email asli ke internet (dan agar test berjalan cepat serta tidak error jika tidak ada koneksi),
// kita membuat tiruan (mock) dari nodemailer. 
// Fungsi tiruan ini akan selalu mengembalikan status sukses (sendMail mengembalikan nilai true) tanpa mengirim email sungguhan.
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue(true)
    })
}));

// 3. LIFECYCLE HOOKS (TAHAPAN PENGUJIAN)
// Sebelum semua pengujian dalam file ini dimulai, jalankan koneksi ke database memori.
beforeAll(async () => {
    await setup.connect();
});

// Setiap kali satu skenario pengujian (satu blok 'it') selesai dijalankan, bersihkan semua data di database.
// Tujuannya agar data dari pengujian sebelumnya tidak mengganggu atau mempengaruhi pengujian berikutnya.
afterEach(async () => {
    await setup.clearDatabase();
});

// Setelah seluruh pengujian di dalam file ini selesai dijalankan, tutup koneksi dan matikan database memori.
afterAll(async () => {
    await setup.closeDatabase();
});

// 4. HELPER FUNCTION (FUNGSI PEMBANTU)
// Fungsi ini dibuat untuk mempermudah persiapan data pengguna yang valid di database sebelum memulai skenario pengujian tertentu.
// Misalnya, sebelum menguji skenario login, database harus sudah terisi data user terlebih dahulu.
// Fungsi ini akan membuat data Master Mahasiswa (DataMaster) terlebih dahulu, kemudian menembak endpoint register untuk membuat user baru.
async function seedValidUser(overrides = {}) {
    // Nilai default untuk Data Master
    const defaults = {
        name: 'Fulan',
        nim: '112233',
        role: 'mahasiswa'
    };
    // Simpan data master ke database (menggabungkan nilai default dengan nilai tambahan jika ada)
    await DataMaster.create({ ...defaults, ...overrides.master });

    // Data registrasi user baru
    const userData = {
        nama: 'Fulan',
        email: 'fulan@test.com',
        password: 'password123',
        role: 'mahasiswa',
        identifier: '112233'
    };
    // Kirim request POST ke endpoint registrasi agar user terdaftar secara resmi di sistem
    await request(app).post('/api/auth/register').send({ ...userData, ...overrides.user });
}

// ─────────────────────────────────────────────
// 5. GRUP PENGUJIAN: REGISTRASI PENGGUNA (REGISTER)
// ─────────────────────────────────────────────
// `describe` digunakan untuk mengelompokkan skenario-skenario pengujian yang sejenis.
describe('Auth – Register', () => {
    // `it` mendefinisikan satu skenario spesifik yang diuji. Kalimat penjelasnya harus menerangkan apa yang diharapkan.
    it('berhasil mendaftarkan user baru yang valid', async () => {
        // PERSIAPAN (Arrange): Tambahkan data mahasiswa ke dalam DataMaster terlebih dahulu.
        // Sistem kita mewajibkan pendaftar harus terdaftar di DataMaster agar tidak sembarang orang bisa registrasi.
        await DataMaster.create({ name: 'Fulan', nim: '112233', role: 'mahasiswa' });

        // TINDAKAN (Act): Kirim request POST ke route registrasi (/api/auth/register) membawa data mahasiswa baru
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                nama: 'Fulan',
                email: 'fulan@test.com',
                password: 'password123',
                role: 'mahasiswa',
                identifier: '112233' // NIM mahasiswa
            });

        // VERIFIKASI (Assert): Pastikan respon dari server sesuai harapan kita.
        // Status code 201 artinya data berhasil dibuat (Created)
        expect(res.statusCode).toEqual(201);
        // Pastikan respon JSON memiliki properti { success: true }
        expect(res.body).toHaveProperty('success', true);

        // Verifikasi ke Database: Cari user di database dengan email tersebut
        const user = await User.findOne({ email: 'fulan@test.com' });
        // Pastikan user tersebut benar-benar ada di database (tidak null/undefined)
        expect(user).toBeTruthy();
        // Pastikan NIM (identifier) yang disimpan di database sudah benar
        expect(user.nim).toBe('112233');
    });

    it('gagal jika nama tidak sesuai DataMaster', async () => {
        // PERSIAPAN: Data master tercatat nama 'Fulan' dengan NIM '112233'
        await DataMaster.create({ name: 'Fulan', nim: '112233', role: 'mahasiswa' });

        // TINDAKAN: Coba registrasi menggunakan NIM '112233' tapi nama penggunanya diisi 'Budi'
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                nama: 'Budi', // Nama salah! Seharusnya 'Fulan' sesuai NIM-nya
                email: 'budi@test.com',
                password: 'password123',
                role: 'mahasiswa',
                identifier: '112233'
            });

        // VERIFIKASI:
        // Status code 400 bermakna Bad Request (kesalahan input dari klien)
        expect(res.statusCode).toEqual(400);
        // Pastikan pesan error yang dikembalikan server mengandung kalimat "Nama tidak sesuai" (case-insensitive berkat akhiran /i)
        expect(res.body.message).toMatch(/Nama tidak sesuai/i);
    });

    it('gagal jika identifier tidak ditemukan di DataMaster', async () => {
        // TINDAKAN: Coba registrasi menggunakan NIM '999999' yang belum terdaftar di DataMaster sama sekali
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                nama: 'Fulan',
                email: 'fulan@test.com',
                password: 'password123',
                role: 'mahasiswa',
                identifier: '999999' // NIM tidak valid (tidak ada di DataMaster)
            });

        // VERIFIKASI:
        expect(res.statusCode).toEqual(400);
        // Pastikan pesan error server mengandung kalimat "Data Master tidak ditemukan"
        expect(res.body.message).toMatch(/Data Master tidak ditemukan/i);
    });

    it('gagal jika email sudah digunakan', async () => {
        // PERSIAPAN: Daftarkan mahasiswa pertama
        await DataMaster.create({ name: 'Fulan', nim: '112233', role: 'mahasiswa' });
        await request(app).post('/api/auth/register').send({
            nama: 'Fulan', email: 'fulan@test.com', password: 'password123',
            role: 'mahasiswa', identifier: '112233'
        });

        // PERSIAPAN: Daftarkan mahasiswa kedua dengan email yang SAMA
        await DataMaster.create({ name: 'Fulan', nim: '112234', role: 'mahasiswa' });
        
        // TINDAKAN: Coba kirim pendaftaran untuk mahasiswa kedua memakai email fulan@test.com
        const res = await request(app).post('/api/auth/register').send({
            nama: 'Fulan', email: 'fulan@test.com', // Email duplikat!
            password: 'password456',
            role: 'mahasiswa', identifier: '112234'
        });

        // VERIFIKASI:
        expect(res.statusCode).toEqual(400);
        // Pastikan pesan error server menyatakan email sudah digunakan
        expect(res.body.message).toMatch(/sudah digunakan/i);
    });
});

// ─────────────────────────────────────────────
// 6. GRUP PENGUJIAN: MASUK SISTEM (LOGIN)
// ─────────────────────────────────────────────
describe('Auth – Login', () => {
    // Sebelum setiap pengujian login dimulai, daftarkan 1 user valid terlebih dahulu agar bisa dicoba login.
    beforeEach(async () => {
        await seedValidUser();
    });

    it('berhasil login menggunakan NIM', async () => {
        // TINDAKAN: Kirim request POST ke route login membawa NIM dan password yang benar
        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: '112233', password: 'password123' });

        // VERIFIKASI:
        // Status code 200 artinya OK / Sukses
        expect(res.statusCode).toEqual(200);
        // Pastikan respon mengembalikan JWT Token untuk hak akses user
        expect(res.body).toHaveProperty('token');
        // Pastikan data profil user yang login dikembalikan dengan NIM & role yang sesuai
        expect(res.body.user).toHaveProperty('nim', '112233');
        expect(res.body.user).toHaveProperty('role', 'mahasiswa');
    });

    it('berhasil login menggunakan email', async () => {
        // TINDAKAN: Kirim request POST login memakai alamat email dan password yang benar
        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: 'fulan@test.com', password: 'password123' });

        // VERIFIKASI:
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('berhasil login menggunakan email dengan huruf kapital (case-insensitive)', async () => {
        // TINDAKAN: Pengguna memasukkan email dengan huruf besar semua ('FULAN@TEST.COM').
        // Sistem yang baik harus tetap mengenalinya (tidak sensitif terhadap huruf kapital pada email).
        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: 'FULAN@TEST.COM', password: 'password123' });

        // VERIFIKASI:
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('gagal login dengan password salah', async () => {
        // TINDAKAN: Kirim request login memakai NIM yang terdaftar tapi password-nya asal-asalan
        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: '112233', password: 'wrongpassword' });

        // VERIFIKASI:
        // Status code 400 (Bad Request)
        expect(res.statusCode).toEqual(400);
        // Pastikan ada pesan kesalahan "Password salah"
        expect(res.body.message).toMatch(/Password salah/i);
    });

    it('gagal login jika user tidak ditemukan', async () => {
        // TINDAKAN: Kirim request login memakai identifier (NIM) yang tidak terdaftar di database
        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: '999999', password: 'password123' });

        // VERIFIKASI:
        // Status code 404 artinya Not Found (sumber daya tidak ditemukan)
        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toMatch(/tidak ditemukan/i);
    });

    it('response login mengandung field nama, nim, dan role', async () => {
        // TINDAKAN: Kirim request login yang valid
        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: '112233', password: 'password123' });

        // VERIFIKASI:
        // Pastikan data objek user di body respon berisi profil lengkap mahasiswa (nama, nim, role)
        expect(res.body.user).toHaveProperty('nama');
        expect(res.body.user).toHaveProperty('nim');
        expect(res.body.user).toHaveProperty('role');
    });
});

// ─────────────────────────────────────────────
// 7. GRUP PENGUJIAN: LUPA PASSWORD (FORGOT PASSWORD)
// ─────────────────────────────────────────────
describe('Auth – Forgot Password', () => {
    // Daftarkan user contoh sebelum memulai pengujian lupa password
    beforeEach(async () => {
        await seedValidUser();
    });

    it('mengirim link reset jika email ditemukan', async () => {
        // TINDAKAN: Kirim request POST meminta token reset password ke email fulan@test.com yang terdaftar
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'fulan@test.com' });

        // VERIFIKASI:
        expect(res.statusCode).toEqual(200);
        // Pastikan respon server mengonfirmasi pengiriman email reset (mengandung kata 'reset')
        expect(res.body.message).toMatch(/reset/i);
    });

    it('gagal jika email tidak terdaftar', async () => {
        // TINDAKAN: Minta token reset password ke email yang tidak pernah didaftarkan
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'tidakada@test.com' });

        // VERIFIKASI:
        // Harus mengembalikan status code 404 (Not Found) karena email tidak ada di sistem
        expect(res.statusCode).toEqual(404);
    });

    it('menyimpan resetPasswordToken ke database', async () => {
        // TINDAKAN: Kirim request minta reset password
        await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'fulan@test.com' });

        // VERIFIKASI: 
        // Cari user yang meminta reset tadi di database
        const user = await User.findOne({ email: 'fulan@test.com' });
        // Pastikan token reset password terisi (tidak kosong)
        expect(user.resetPasswordToken).toBeTruthy();
        // Pastikan waktu kadaluarsa token reset terisi (tidak kosong)
        expect(user.resetPasswordExpires).toBeTruthy();
        // Token yang disimpan di database harus di-hash (SHA-256), yang panjang karakter hash-nya adalah 64 karakter.
        expect(user.resetPasswordToken).toHaveLength(64);
    });
});

