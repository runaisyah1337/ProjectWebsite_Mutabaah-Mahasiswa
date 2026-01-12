require('dotenv').config();
const express = require('express');
const cors = require('cors'); 
const connectDB = require('./db');
const authRoutes = require('./routes/auth.routes');
const evaluasiRoutes = require('./routes/evaluasi.routes');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt'); // TAMBAHAN: Library untuk enkripsi password
const User = require('./models/User');

const app = express();

connectDB();

app.use(cors()); 
app.use(express.json()); 

// ==========================================
// 1. ENDPOINT MINTA LINK RESET (FORGOT)
// ==========================================
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Email tidak terdaftar!" });

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS 
            }
        });

        // URL Frontend sesuai testing kamu
        const resetUrl = `http://127.0.0.1:5500/frontend/gantisandi.html?token=${resetToken}`;

        const mailOptions = {
            to: user.email,
            subject: 'Reset Password - STMIK Tazkia',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
                    <h3 style="color: #003399;">Permintaan Reset Password</h3>
                    <p>Klik tombol di bawah untuk mereset kata sandi Akun Mutaba'ah Anda:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background:#003399; color:white; padding:12px 25px; text-decoration:none; border-radius:5px; font-weight: bold;">Reset Password Saya</a>
                    </div>
                    <p style="font-size: 12px; color: #777;">Link ini akan kedaluwarsa dalam waktu 1 jam. Jika Anda tidak merasa meminta ini, abaikan saja email ini.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Link reset password telah dikirim ke email Anda." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

// ==========================================
// 2. ENDPOINT SIMPAN SANDI BARU (RESET)
// ==========================================
app.post('/api/auth/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Token tidak valid atau sudah kedaluwarsa." });
        }

        // --- PROSES HASHING PASSWORD BARU ---
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt); 
        
        // Bersihkan token agar tidak bisa dipakai ulang
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        res.json({ message: "Kata sandi berhasil diperbarui. Silakan login kembali." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal memperbarui kata sandi." });
    }
});

app.use('/api/evaluasi', evaluasiRoutes);
app.use('/api/auth', authRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});