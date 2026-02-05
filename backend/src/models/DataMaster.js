const mongoose = require('mongoose');

const DataMasterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    nim: { type: String },
    "no hp": { type: String }, // Pakai kutip karena ada spasi sesuai gambar Atlas
    role: { type: String, required: true }
});

// SESUAI GAMBAR ATLAS: Nama tabelnya adalah 'mutabaahmahasiswa'
module.exports = mongoose.model('DataMaster', DataMasterSchema, 'mutabaahmahasiswa');