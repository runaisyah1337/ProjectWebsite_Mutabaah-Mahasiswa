const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. FUNGSI DAFTAR (REGISTER)
exports.register = async (req, res) => {
  try {
    const { nama, nim, email, password, role } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      nama,
      nim: role === "mahasiswa" ? nim : null,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    res.status(201).json({
      message: "Registrasi berhasil"
    });
  } catch (err) {
    res.status(400).json({
      message: "Registrasi gagal",
      error: err.message
    });
  }
};


// REVISI FUNGSI LOGIN
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Mencari user yang nim-nya cocok ATAU no_hp-nya cocok
        const user = await User.findOne({
            $or: [
                { nim: identifier },
                { no_hp: identifier }
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