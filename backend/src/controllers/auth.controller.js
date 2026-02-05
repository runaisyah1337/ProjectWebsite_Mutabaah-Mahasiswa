// src/controllers/auth.controller.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const DataMaster = require('../models/DataMaster'); // Pastikan model ini sudah benar

exports.register = async (req, res) => {
    // 1. Ambil data dari req.body DULU
    const { nama, email, password, role, identifier } = req.body;

    // 2. Baru boleh console.log identifier-nya
    console.log("=== PROSES DAFTAR:", identifier, role, "===");

    try {
        // CARI DI DATA MASTER DENGAN LOGIKA "ATAU" ($or)
        const dataMaster = await DataMaster.findOne({
            $or: [
                { nim: identifier },
                { "no hp": identifier }
            ]
        });

        if (!dataMaster) {
            console.log("HASIL: Identifier tidak ditemukan di tabel Master.");
            return res.status(400).json({ message: 'Data Master tidak ditemukan!' });
        }

        // Ambil nama resmi (sesuai field di Atlas kamu: name)
        const namaResmi = dataMaster.name;
        
        // Cek Nama (Case Insensitive)
        const isNamaCocok = new RegExp(nama, 'i').test(namaResmi);
        if (!isNamaCocok) {
            return res.status(400).json({ message: "Nama tidak sesuai dengan data resmi kampus!" });
        }

        // Cek apakah sudah ada di tabel User
        const userAda = await User.findOne({ 
            $or: [{ email }, { nim: identifier }, { no_hp: identifier }, { identifier: identifier }] 
        });
        
        if (userAda) {
            return res.status(400).json({ message: "Email atau ID sudah digunakan!" });
        }

        // Hash password & Simpan
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            nama: namaResmi,
            email,
            password: hashedPassword,
            role,
            nim: role === 'mahasiswa' ? identifier : undefined,
            no_hp: role !== 'mahasiswa' ? identifier : undefined,
            identifier: identifier
        });

        await newUser.save();
        console.log("HASIL: Registrasi BERHASIL!");
        res.status(201).json({ success: true, message: "Registrasi berhasil!" });

    } catch (err) {
        console.error("ERROR SERVER:", err);
        res.status(500).json({ message: "Gagal daftar", error: err.message });
    }
};

// REVISI LOGIN CASE-INSENSITIVE
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Gunakan Regex dengan opsi 'i' (insensitive)
        const user = await User.findOne({
            $or: [
                { nim: identifier },
                { no_hp: identifier },
                { email: { $regex: new RegExp(`^${identifier}$`, 'i') } }
            ]
        });
    

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Password salah" });
        }

        // Di dalam fungsi login/register saat membuat token
const token = jwt.sign(
    { 
        id: user._id, 
        nim: user.nim, // WAJIB ADA: Ini yang akan dibaca oleh req.user.nim
        role: user.role 
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '1d' }
);

        // Di dalam auth.controller.js fungsi login
res.status(200).json({ 
    token, 
    user: { 
        nama: user.nama, 
        nim: user.nim,  // PASTIKAN BARIS INI ADA
        role: user.role 
    } 
});
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server" });
    }
};


// --- FUNGSI FORGOT PASSWORD ---
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
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
        res.status(500).json({ message: "Gagal kirim email" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body; // Sesuaikan nama dengan frontend

        // 1. Cari user yang punya token tersebut dan cek apakah belum expired
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // $gt artinya 'Greater Than' (lebih besar dari sekarang)
        });

        if (!user) {
            return res.status(400).json({ message: "Token tidak valid atau sudah kedaluwarsa" });
        }

        // 2. Hash password baru
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // 3. Hapus token reset agar tidak bisa dipakai 2x
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // 4. Simpan perubahan ke MongoDB Atlas
        await user.save();

        res.status(200).json({ message: "Sandi berhasil diperbarui! Silakan login kembali." });
    } catch (error) {
        console.error("Error Reset Password:", error);
        res.status(500).json({ message: "Gagal reset sandi", error: error.message });
    }
};
