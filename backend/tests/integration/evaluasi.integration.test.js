const request = require('supertest');
const app = require('../../src/app');
const setup = require('../setup');
const User = require('../../src/models/User');
const Evaluation = require('../../src/models/Evaluation');
const jwt = require('jsonwebtoken');

beforeAll(async () => {
    // Pastikan JWT_SECRET ada untuk keperluan token sign di test
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
    await setup.connect();
});

afterEach(async () => {
    await setup.clearDatabase();
});

afterAll(async () => {
    await setup.closeDatabase();
});

describe('Evaluasi Integration Tests', () => {
    let tokenMahasiswa;
    let tokenAdmin;

    beforeEach(async () => {
        const mhs = await User.create({
            nama: 'Fulan',
            email: 'fulan@test.com',
            password: 'hashedpassword',
            role: 'mahasiswa',
            nim: '112233'
        });
        tokenMahasiswa = jwt.sign({ id: mhs._id, nim: mhs.nim, role: mhs.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const admin = await User.create({
            nama: 'Admin',
            email: 'admin@test.com',
            password: 'hashedpassword',
            role: 'admin',
            no_hp: '081234'
        });
        tokenAdmin = jwt.sign({ id: admin._id, nim: admin.nim, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    });

    it('should reject webhook submission without token', async () => {
        const res = await request(app)
            .post('/api/evaluasi/webhook')
            .send({ studentId: '112233', jawaban: { tilawah: 3 } });

        expect(res.statusCode).toEqual(401);
    });

    it('should accept webhook submission with valid student token', async () => {
        const res = await request(app)
            .post('/api/evaluasi/webhook')
            .set('Authorization', `Bearer ${tokenMahasiswa}`)
            .send({
                jawaban: { tilawah: 3, sholatMasjid: 21 }
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Berhasil');

        const evals = await Evaluation.find({ studentId: '112233' });
        expect(evals.length).toBe(1);
        expect(evals[0].jawaban.tilawah).toBe(3);
    });

    it('should return stats for a student', async () => {
        const today = new Date();
        await Evaluation.create({
            studentId: '112233',
            weekStart: 1,
            month: today.getMonth() + 1,
            year: today.getFullYear(),
            jawaban: { tilawah: 3 }
        });

        const res = await request(app)
            .get('/api/evaluasi/stats')
            .set('Authorization', `Bearer ${tokenMahasiswa}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBe(1);
        expect(res.body[0].jawaban.tilawah).toBe(3);
    });

    it('should allow admin to get all stats', async () => {
        const res = await request(app)
            .get('/api/evaluasi/all-stats')
            .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('students');
    });

    it('should forbid student to get all stats', async () => {
        const res = await request(app)
            .get('/api/evaluasi/all-stats')
            .set('Authorization', `Bearer ${tokenMahasiswa}`);

        expect(res.statusCode).toEqual(403);
    });
});
