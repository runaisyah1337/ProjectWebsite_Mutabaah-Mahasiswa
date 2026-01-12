const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nama: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    // sparse: true memungkinkan banyak nilai 'null' untuk Admin/Pembina
    nim: { type: String, unique: true, sparse: true }, 
    no_hp: { type: String, unique: true, sparse: true },
    
    // --- TAMBAHAN UNTUK FITUR LUPA SANDI ---
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
}, { collection: 'users' });

module.exports = mongoose.model('User', UserSchema);