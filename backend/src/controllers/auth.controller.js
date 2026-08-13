// src/controllers/auth.controller.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const DataMaster = require('../models/DataMaster');

exports.register = async (req, res) => {
    const { nama, email, password, role, identifier } = req.body;

    try {
        // Sanitasi input dasar
        const cleanEmail = email ? email.trim().toLowerCase() : '';
        const cleanIdentifier = identifier ? identifier.trim() : '';
        const cleanNama = nama ? nama.trim().toLowerCase() : '';

        // 1. CARI DI DATA MASTER
        const dataMaster = await DataMaster.findOne({
            $or: [
                { nim: cleanIdentifier },
                { "no hp": cleanIdentifier }
            ]
        });

        if (!dataMaster) {
            return res.status(400).json({ message: 'Data Master tidak ditemukan!' });
        }

        // Ambil nama resmi dan lakukan pengecekan tanpa RegExp (Aman dari ReDoS)
        const namaResmi = dataMaster.name || '';
        if (cleanNama !== namaResmi.trim().toLowerCase()) {
            return res.status(400).json({ message: "Nama tidak sesuai dengan data resmi kampus!" });
        }

        // 2. Cek apakah user sudah terdaftar di database
        const userAda = await User.findOne({ 
<<<<<<< HEAD
            $or: [
                { email: cleanEmail }, 
                { nim: cleanIdentifier }, 
                { no_hp: cleanIdentifier }, 
                { identifier: cleanIdentifier }
            ] 
=======
            // BUG FIX: Hapus query { identifier } karena field tsb tidak ada di schema
            $or: [{ email }, { nim: identifier }, { no_hp: identifier }] 
>>>>>>> origin/main
        });
        
        if (userAda) {
            return res.status(400).json({ message: "Email atau ID sudah digunakan!" });
        }

        // 3. Hash password & Simpan User Baru
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            nama: namaResmi,
            email: cleanEmail,
            password: hashedPassword,
            role,
<<<<<<< HEAD
            nim: role === 'mahasiswa' ? cleanIdentifier : undefined,
            no_hp: role !== 'mahasiswa' ? cleanIdentifier : undefined,
            identifier: cleanIdentifier
=======
            nim: role === 'mahasiswa' ? identifier : undefined,
            no_hp: role !== 'mahasiswa' ? identifier : undefined
            // BUG FIX: Dihapus "identifier: identifier" karena tidak ada di UserSchema
>>>>>>> origin/main
        });

        await newUser.save();
        res.status(201).json({ success: true, message: "Registrasi berhasil!" });

    } catch (err) {
        console.error("ERROR SERVER REGISTER:", err);
        res.status(500).json({ message: "Gagal daftar", error: err.message });
    }
};

// LOGIN BEBAS ReDoS
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const cleanIdentifier = identifier ? identifier.trim() : '';
        const cleanEmail = identifier ? identifier.trim().toLowerCase() : '';

        // Pencarian Exact Match tanpa new RegExp (Mencegah ReDoS Vulnerability)
        const user = await User.findOne({
            $or: [
                { nim: cleanIdentifier },
                { no_hp: cleanIdentifier },
                { identifier: cleanIdentifier },
                { email: cleanEmail }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Password salah" });
        }

        // Pembuatan Token JWT
        const token = jwt.sign(
            { 
                id: user._id, 
                nim: user.nim, 
                role: user.role 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.status(200).json({ 
            token, 
            user: { 
                nama: user.nama, 
                nim: user.nim, 
                role: user.role 
            } 
        });
    } catch (error) {
        console.error("ERROR SERVER LOGIN:", error);
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
};

// --- FUNGSI FORGOT PASSWORD ---
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const cleanEmail = email ? email.trim().toLowerCase() : '';
        const user = await User.findOne({ email: cleanEmail });
        if (!user) return res.status(404).json({ message: "Email tidak terdaftar" });

        // Generate token acak
        const resetToken = crypto.randomBytes(32).toString('hex');

        // SECURITY FIX: Simpan versi HASH dari token ke database (bukan plaintext)
        // Jika database bocor, penyerang tidak bisa menggunakan token ini langsung
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 jam
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        // Kirim token PLAINTEXT ke email (bukan hash)
        const resetUrl = `${req.headers.origin}/gantisandi.html?token=${resetToken}`;
        await transporter.sendMail({
            to: user.email,
            subject: 'Reset Password Mutabaah',
            html: `<h3>Reset Password</h3><p>Klik link ini: <a href="${resetUrl}">${resetUrl}</a></p><p>Link ini berlaku selama 1 jam.</p>`
        });

        res.json({ message: "Link reset terkirim ke email" });
    } catch (err) {
<<<<<<< HEAD
        console.error("ERROR FORGOT PASSWORD:", err);
=======
        console.error("Error Forgot Password:", err);
>>>>>>> origin/main
        res.status(500).json({ message: "Gagal kirim email" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
<<<<<<< HEAD

        const user = await User.findOne({
            resetPasswordToken: token,
=======

        // SECURITY FIX: Hash token dari user, lalu cocokkan dengan hash yang tersimpan di DB
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
>>>>>>> origin/main
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Token tidak valid atau sudah kedaluwarsa" });
        }

<<<<<<< HEAD
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

=======
        // Hash password baru
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Hapus token reset agar tidak bisa dipakai 2x
>>>>>>> origin/main
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: "Sandi berhasil diperbarui! Silakan login kembali." });
    } catch (error) {
        console.error("Error Reset Password:", error);
        res.status(500).json({ message: "Gagal reset sandi", error: error.message });
    }
};