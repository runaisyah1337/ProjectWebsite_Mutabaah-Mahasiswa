const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Evaluation = require('../src/models/Evaluation');

// Helper to generate JWT token for testing
function generateToken(user) {
  return jwt.sign(
    { id: user._id || 'mock-id', nim: user.nim, role: user.role },
    process.env.JWT_SECRET || 'rahasia_tazkia_2026',
    { expiresIn: '1h' }
  );
}

describe('Mutabaah API Testing', () => {
  let userAToken;
  let userBToken;
  let adminToken;

  const userA = {
    nama: 'User A',
    email: 'usera@example.com',
    password: 'password123',
    role: 'mahasiswa',
    nim: '111'
  };

  const userB = {
    nama: 'User B',
    email: 'userb@example.com',
    password: 'password123',
    role: 'mahasiswa',
    nim: '222'
  };

  const adminUser = {
    nama: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin'
  };

  beforeAll(async () => {
    // Wait until mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        mongoose.connection.once('open', resolve);
      });
    }

    // Clear existing test data to ensure clean slate
    await User.deleteMany({ email: { $in: [userA.email, userB.email, adminUser.email] } });
    await Evaluation.deleteMany({ studentId: { $in: [userA.nim, userB.nim] } });

    // Seed test users
    const dbUserA = await User.create(userA);
    const dbUserB = await User.create(userB);
    const dbAdmin = await User.create(adminUser);

    // Generate tokens
    userAToken = generateToken(dbUserA);
    userBToken = generateToken(dbUserB);
    adminToken = generateToken(dbAdmin);
  });

  afterAll(async () => {
    // Clean up created users and evaluations
    await User.deleteMany({ email: { $in: [userA.email, userB.email, adminUser.email] } });
    await Evaluation.deleteMany({ studentId: { $in: [userA.nim, userB.nim] } });
    
    // Close mongoose connection
    await mongoose.connection.close();
  });

  describe('Skenario Pembuatan Data (POST /api/evaluasi/webhook)', () => {
    it('Harus berhasil menyimpan data mutabaah jika mahasiswa menginput datanya sendiri dengan token valid', async () => {
      const payload = {
        studentId: '111',
        jawaban: {
          tilawah: 10,
          matsurot: 1,
          sholatMasjid: 5,
          sholatMalam: 1,
          puasa: 0,
          olahraga: 1,
          infaq: 10000,
          keluarga: 1,
          donasiPalestina: 5000
        }
      };

      const res = await request(app)
        .post('/api/evaluasi/webhook')
        .set('Authorization', `Bearer ${userAToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Berhasil');
      expect(res.body).toHaveProperty('week');

      // Verify in DB
      const dbEval = await Evaluation.findOne({ studentId: '111' });
      expect(dbEval).toBeTruthy();
      expect(dbEval.jawaban.tilawah).toBe(10);
    });

    it('Harus ditolak (401) jika menyimpan data mutabaah tanpa token', async () => {
      const payload = {
        studentId: '111',
        jawaban: { tilawah: 5 }
      };

      const res = await request(app)
        .post('/api/evaluasi/webhook')
        .send(payload);

      expect(res.status).toBe(401);
    });
  });

  describe('Skenario Keamanan (RBAC)', () => {
    // Test Case: User A tidak boleh mengedit/mengisi data User B
    it('Harus ditolak (403) jika User A mencoba mengisi/mengedit data mutabaah User B', async () => {
      const payload = {
        studentId: '222', // NIM milik User B
        jawaban: { tilawah: 10 }
      };

      const res = await request(app)
        .post('/api/evaluasi/webhook')
        .set('Authorization', `Bearer ${userAToken}`) // Token milik User A
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Akses ditolak');
    });

    // Test Case: User A tidak boleh membaca data User B
    it('Harus ditolak (403) jika User A mencoba melihat data mutabaah milik User B', async () => {
      // Create some evaluation data for User B first (using User B's token)
      await request(app)
        .post('/api/evaluasi/webhook')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          studentId: '222',
          jawaban: { tilawah: 7 }
        });

      // User A tries to view User B's data
      const res = await request(app)
        .get('/api/evaluasi/stats')
        .set('Authorization', `Bearer ${userAToken}`) // Token milik User A
        .query({ nim: '222' }); // NIM milik User B

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Akses ditolak');
    });

    // Test Case: Admin/Pembina boleh membaca data siapa saja
    it('Harus diizinkan (200) jika Admin melihat data mutabaah milik User B', async () => {
      const res = await request(app)
        .get('/api/evaluasi/stats')
        .set('Authorization', `Bearer ${adminToken}`) // Token milik Admin
        .query({ nim: '222' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].studentId).toBe('222');
    });
  });
});
