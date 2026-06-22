const request = require('supertest');
const app = require('../../src/app');
const setup = require('../setup');
const User = require('../../src/models/User');
const Evaluation = require('../../src/models/Evaluation');
const jwt = require('jsonwebtoken');

beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
    await setup.connect();
});

afterEach(async () => {
    await setup.clearDatabase();
});

afterAll(async () => {
    await setup.closeDatabase();
});

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
async function createUserWithToken(overrides = {}) {
    const defaults = {
        nama: 'Fulan',
        email: 'fulan@test.com',
        password: 'hashedpassword',
        role: 'mahasiswa',
        nim: '112233'
    };
    const user = await User.create({ ...defaults, ...overrides });
    const token = jwt.sign(
        { id: user._id, nim: user.nim, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    return { user, token };
}

function todayPeriod() {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const firstDay = new Date(year, today.getMonth(), 1).getDay();
    const weekStart = Math.ceil((today.getDate() + firstDay) / 7);
    return { month, year, weekStart };
}

// ─────────────────────────────────────────────
// WEBHOOK (Submit Evaluasi)
// ─────────────────────────────────────────────
describe('Evaluasi – Webhook (Submit)', () => {
    it('menolak request tanpa token (401)', async () => {
        const res = await request(app)
            .post('/api/evaluasi/webhook')
            .send({ studentId: '112233', jawaban: { tilawah: 3 } });

        expect(res.statusCode).toEqual(401);
    });

    it('menolak token tidak valid (401)', async () => {
        const res = await request(app)
            .post('/api/evaluasi/webhook')
            .set('Authorization', 'Bearer token_palsu_tidak_valid')
            .send({ jawaban: { tilawah: 3 } });

        expect(res.statusCode).toEqual(401);
    });

    it('mahasiswa berhasil submit evaluasi dengan token valid (200)', async () => {
        const { token } = await createUserWithToken();

        const res = await request(app)
            .post('/api/evaluasi/webhook')
            .set('Authorization', `Bearer ${token}`)
            .send({ jawaban: { tilawah: 3, sholatMasjid: 21 } });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Berhasil');

        const evals = await Evaluation.find({ studentId: '112233' });
        expect(evals.length).toBe(1);
        expect(evals[0].jawaban.tilawah).toBe(3);
    });

    it('mahasiswa tidak bisa mengubah studentId (paksa pakai NIM sendiri)', async () => {
        const { token } = await createUserWithToken();

        // Kirim studentId orang lain di body
        const res = await request(app)
            .post('/api/evaluasi/webhook')
            .set('Authorization', `Bearer ${token}`)
            .send({ studentId: '999999', jawaban: { tilawah: 2 } });

        expect(res.statusCode).toEqual(200);

        // Data harus tersimpan dengan NIM sendiri, bukan 999999
        const evals = await Evaluation.find({ studentId: '112233' });
        expect(evals.length).toBe(1);
        // Data tidak boleh ada dengan studentId palsu
        const evalsFake = await Evaluation.find({ studentId: '999999' });
        expect(evalsFake.length).toBe(0);
    });

    it('submit ulang minggu yang sama hanya update (upsert), tidak duplikat', async () => {
        const { token } = await createUserWithToken();

        // Submit pertama
        await request(app)
            .post('/api/evaluasi/webhook')
            .set('Authorization', `Bearer ${token}`)
            .send({ jawaban: { tilawah: 1 } });

        // Submit kedua (update)
        await request(app)
            .post('/api/evaluasi/webhook')
            .set('Authorization', `Bearer ${token}`)
            .send({ jawaban: { tilawah: 3 } });

        const evals = await Evaluation.find({ studentId: '112233' });
        // Harus tetap 1 dokumen, bukan 2
        expect(evals.length).toBe(1);
        expect(evals[0].jawaban.tilawah).toBe(3);
    });
});

// ─────────────────────────────────────────────
// GET STATS (Per Mahasiswa)
// ─────────────────────────────────────────────
describe('Evaluasi – Get Stats', () => {
    it('mengembalikan data evaluasi mahasiswa sendiri', async () => {
        const { token } = await createUserWithToken();
        const { month, year, weekStart } = todayPeriod();

        await Evaluation.create({
            studentId: '112233',
            weekStart,
            month,
            year,
            jawaban: { tilawah: 3 }
        });

        const res = await request(app)
            .get('/api/evaluasi/stats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBe(1);
        expect(res.body[0].jawaban.tilawah).toBe(3);
    });

    it('mengembalikan array kosong jika belum ada data', async () => {
        const { token } = await createUserWithToken();

        const res = await request(app)
            .get('/api/evaluasi/stats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBe(0);
    });

    it('menolak akses tanpa token (401)', async () => {
        const res = await request(app).get('/api/evaluasi/stats');
        expect(res.statusCode).toEqual(401);
    });
});

// ─────────────────────────────────────────────
// GET ALL STATS (Admin & Pembina)
// ─────────────────────────────────────────────
describe('Evaluasi – Get All Stats (RBAC)', () => {
    it('admin dapat mengakses all-stats (200)', async () => {
        const { token } = await createUserWithToken({
            nama: 'Admin', email: 'admin@test.com', role: 'admin', nim: undefined, no_hp: '081234'
        });

        const res = await request(app)
            .get('/api/evaluasi/all-stats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('students');
        expect(res.body).toHaveProperty('frequencyData');
        expect(res.body).toHaveProperty('weeklyTotalScores');
    });

    it('pembina dapat mengakses all-stats (200)', async () => {
        const { token } = await createUserWithToken({
            nama: 'Pembina', email: 'pembina@test.com', role: 'pembina', nim: undefined, no_hp: '081235'
        });

        const res = await request(app)
            .get('/api/evaluasi/all-stats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('success', true);
    });

    it('mahasiswa TIDAK DAPAT mengakses all-stats (403)', async () => {
        const { token } = await createUserWithToken();

        const res = await request(app)
            .get('/api/evaluasi/all-stats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toEqual(403);
        expect(res.body.message).toMatch(/ditolak/i);
    });

    it('tanpa token ditolak (401)', async () => {
        const res = await request(app).get('/api/evaluasi/all-stats');
        expect(res.statusCode).toEqual(401);
    });

    it('all-stats mengembalikan currentWeek dan currentMonth', async () => {
        const { token } = await createUserWithToken({
            nama: 'Admin', email: 'admin@test.com', role: 'admin', nim: undefined, no_hp: '081234'
        });

        const res = await request(app)
            .get('/api/evaluasi/all-stats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.body).toHaveProperty('currentWeek');
        expect(res.body).toHaveProperty('currentMonth');
        expect(typeof res.body.currentWeek).toBe('number');
    });
});
