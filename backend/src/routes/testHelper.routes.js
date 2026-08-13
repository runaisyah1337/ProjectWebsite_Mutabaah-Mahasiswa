// src/routes/testHelper.routes.js
// ⚠️  HANYA AKTIF SAAT NODE_ENV === 'test'
// Route ini TIDAK BOLEH PERNAH aktif di production/development
// Digunakan oleh Playwright global-setup untuk seed dan cleanup data test

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const DataMaster = require('../models/DataMaster');
const Evaluation = require('../models/Evaluation');

/**
 * GET /api/test/status
 * Cek apakah server test aktif dan database terhubung
 */
router.get('/status', (req, res) => {
    res.json({
        ok: true,
        env: process.env.NODE_ENV,
        dbState: mongoose.connection.readyState // 1 = connected
    });
});

/**
 * POST /api/test/seed
 * Seed data test awal: 3 user (mahasiswa, pembina, admin) + DataMaster
 * Dipanggil oleh e2e/global-setup.js sebelum test dimulai
 */
router.post('/seed', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash('TestPass123!', 10);

        // --- Seed DataMaster (tabel validasi registrasi) ---
        await DataMaster.insertMany([
            { name: 'Ahmad Fulan',   nim: '20210001', role: 'mahasiswa' },
            { name: 'Budi Santoso',  nim: '20210002', role: 'mahasiswa' },
            { name: 'Siti Aminah',   'no hp': '081111000001', role: 'pembina' },
            { name: 'Admin Tazkia',  'no hp': '081111000099', role: 'admin' }
        ]);

        // --- Seed Users ---
        await User.insertMany([
            {
                nama: 'Ahmad Fulan',
                email: 'mahasiswa@test.com',
                password: hashedPassword,
                role: 'mahasiswa',
                nim: '20210001',
                pembina: 'Siti Aminah'
            },
            {
                nama: 'Budi Santoso',
                email: 'mahasiswa2@test.com',
                password: hashedPassword,
                role: 'mahasiswa',
                nim: '20210002',
                pembina: 'Siti Aminah'
            },
            {
                nama: 'Siti Aminah',
                email: 'pembina@test.com',
                password: hashedPassword,
                role: 'pembina',
                no_hp: '081111000001'
            },
            {
                nama: 'Admin Tazkia',
                email: 'admin@test.com',
                password: hashedPassword,
                role: 'admin',
                no_hp: '081111000099'
            }
        ]);

        res.json({ ok: true, message: 'Seed berhasil', seeded: ['DataMaster x4', 'User x4'] });
    } catch (err) {
        console.error('[TestHelper] Seed error:', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * POST /api/test/cleanup
 * Hapus SEMUA data dari semua collection test
 * Dipanggil oleh e2e/global-teardown.js atau afterEach Playwright
 * ⚠️  AMAN: Hanya berjalan di MongoMemoryServer, bukan Atlas
 */
router.post('/cleanup', async (req, res) => {
    try {
        const collections = mongoose.connection.collections;
        const deleted = [];
        for (const key in collections) {
            await collections[key].deleteMany({});
            deleted.push(key);
        }
        res.json({ ok: true, message: 'Cleanup berhasil', collections: deleted });
    } catch (err) {
        console.error('[TestHelper] Cleanup error:', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * POST /api/test/seed-evaluation
 * Seed data evaluasi untuk test assessment yang butuh data existing
 */
router.post('/seed-evaluation', async (req, res) => {
    try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        const firstDay = new Date(year, today.getMonth(), 1).getDay();
        const weekStart = Math.ceil((today.getDate() + firstDay) / 7);

        await Evaluation.create({
            studentId: '20210001',
            weekStart,
            month,
            year,
            jawaban: {
                tilawah: 3,
                matsurot: 2,
                sholatMasjid: 3,
                sholatMalam: 1,
                puasa: 2,
                olahraga: 1,
                keluarga: 2,
                infaq: 3,
                donasiPalestina: 1
            }
        });

        res.json({ ok: true, message: 'Evaluation seed berhasil', week: weekStart });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

module.exports = router;
