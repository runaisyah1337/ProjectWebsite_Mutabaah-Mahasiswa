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
            $or: [
                { email: cleanEmail }, 
                { nim: cleanIdentifier }, 
                { no_hp: cleanIdentifier }, 
                { identifier: cleanIdentifier }
            ] 
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
            nim: role === 'mahasiswa' ? cleanIdentifier : undefined,
            no_hp: role !== 'mahasiswa' ? cleanIdentifier : undefined,
            identifier: cleanIdentifier
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

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        const resetUrl = `${req.headers.origin}/gantisandi.html?token=${resetToken}`;
        await transporter.sendMail({
            to: user.email,
            subject: 'Reset Password Mutabaah',
            html: `<h3>Reset Password</h3><p>Klik link ini: <a href="${resetUrl}">${resetUrl}</a></p>`
        });

        res.json({ message: "Link reset terkirim ke email" });
    } catch (err) {
        console.error("ERROR FORGOT PASSWORD:", err);
        res.status(500).json({ message: "Gagal kirim email" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Token tidak valid atau sudah kedaluwarsa" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ message: "Sandi berhasil diperbarui! Silakan login kembali." });
    } catch (error) {
        console.error("Error Reset Password:", error);
        res.status(500).json({ message: "Gagal reset sandi", error: error.message });
    }
};