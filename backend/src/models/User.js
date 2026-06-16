const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nama: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // sparse: true memungkinkan banyak nilai 'null' untuk Admin/Pembina
    nim: { type: String, unique: true, sparse: true }, 
    no_hp: { type: String, unique: true, sparse: true },
    // BUG FIX: Tambahkan field pembina untuk relasi mahasiswa-pembina
    pembina: { type: String, default: null },
    
    // --- TAMBAHAN UNTUK FITUR LUPA SANDI ---
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
}, { collection: 'users' });

module.exports = mongoose.model('User', UserSchema);