const request = require('supertest');
const app = require('../../src/app');
const setup = require('../setup');
const User = require('../../src/models/User');
const DataMaster = require('../../src/models/DataMaster');

jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue(true)
    })
}));

beforeAll(async () => {
    await setup.connect();
});

afterEach(async () => {
    await setup.clearDatabase();
});

afterAll(async () => {
    await setup.closeDatabase();
});

// Helper: buat DataMaster + User sekaligus
async function seedValidUser(overrides = {}) {
    const defaults = {
        name: 'Fulan',
        nim: '112233',
        role: 'mahasiswa'
    };
    await DataMaster.create({ ...defaults, ...overrides.master });

    const userData = {
        nama: 'Fulan',
        email: 'fulan@test.com',
        password: 'password123',
        role: 'mahasiswa',
        identifier: '112233'
    };
    await request(app).post('/api/auth/register').send({ ...userData, ...overrides.user });
}

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
describe('Auth – Register', () => {
    it('berhasil mendaftarkan user baru yang valid', async () => {
        await DataMaster.create({ name: 'Fulan', nim: '112233', role: 'mahasiswa' });

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                nama: 'Fulan',
                email: 'fulan@test.com',
                password: 'password123',
                role: 'mahasiswa',
                identifier: '112233'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('success', true);

        const user = await User.findOne({ email: 'fulan@test.com' });
        expect(user).toBeTruthy();
        expect(user.nim).toBe('112233');
    });

    it('gagal jika nama tidak sesuai DataMaster', async () => {
        await DataMaster.create({ name: 'Fulan', nim: '112233', role: 'mahasiswa' });

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                nama: 'Budi',
                email: 'budi@test.com',
                password: 'password123',
                role: 'mahasiswa',
                identifier: '112233'
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/Nama tidak sesuai/i);
    });

    it('gagal jika identifier tidak ditemukan di DataMaster', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                nama: 'Fulan',
                email: 'fulan@test.com',
                password: 'password123',
                role: 'mahasiswa',
                identifier: '999999' // tidak ada di DataMaster
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/Data Master tidak ditemukan/i);
    });

    it('gagal jika email sudah digunakan', async () => {
        await DataMaster.create({ name: 'Fulan', nim: '112233', role: 'mahasiswa' });
        // Daftar pertama kali
        await request(app).post('/api/auth/register').send({
            nama: 'Fulan', email: 'fulan@test.com', password: 'password123',
            role: 'mahasiswa', identifier: '112233'
        });

        await DataMaster.create({ name: 'Fulan', nim: '112234', role: 'mahasiswa' });
        // Coba daftar lagi dengan email sama
        const res = await request(app).post('/api/auth/register').send({
            nama: 'Fulan', email: 'fulan@test.com', password: 'password456',
            role: 'mahasiswa', identifier: '112234'
        });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/sudah digunakan/i);
    });
});

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
describe('Auth – Login', () => {
    beforeEach(async () => {
        await seedValidUser();
    });

    it('berhasil login menggunakan NIM', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: '112233', password: 'password123' });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('nim', '112233');
        expect(res.body.user).toHaveProperty('role', 'mahasiswa');
    });

    it('berhasil login menggunakan email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: 'fulan@test.com', password: 'password123' });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('berhasil login menggunakan email dengan huruf kapital (case-insensitive)', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: 'FULAN@TEST.COM', password: 'password123' });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('token');
    });

    it('gagal login dengan password salah', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: '112233', password: 'wrongpassword' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toMatch(/Password salah/i);
    });

    it('gagal login jika user tidak ditemukan', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: '999999', password: 'password123' });

        expect(res.statusCode).toEqual(404);
        expect(res.body.message).toMatch(/tidak ditemukan/i);
    });

    it('response login mengandung field nama, nim, dan role', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ identifier: '112233', password: 'password123' });

        expect(res.body.user).toHaveProperty('nama');
        expect(res.body.user).toHaveProperty('nim');
        expect(res.body.user).toHaveProperty('role');
    });
});

// ─────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────
describe('Auth – Forgot Password', () => {
    beforeEach(async () => {
        await seedValidUser();
    });

    it('mengirim link reset jika email ditemukan', async () => {
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'fulan@test.com' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toMatch(/reset/i);
    });

    it('gagal jika email tidak terdaftar', async () => {
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'tidakada@test.com' });

        expect(res.statusCode).toEqual(404);
    });

    it('menyimpan resetPasswordToken ke database', async () => {
        await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'fulan@test.com' });

        const user = await User.findOne({ email: 'fulan@test.com' });
        expect(user.resetPasswordToken).toBeTruthy();
        expect(user.resetPasswordExpires).toBeTruthy();
        // Token di DB harus hash SHA-256, bukan plaintext
        expect(user.resetPasswordToken).toHaveLength(64);
    });
});

