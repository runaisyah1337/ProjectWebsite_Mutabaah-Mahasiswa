const mongoose = require('mongoose');

const DataMasterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    nim: { type: String },    // Untuk Mahasiswa
    no_hp: { type: String },  // Untuk Admin/Pembina
    role: { type: String, required: true }
});

module.exports = mongoose.model('DataMaster', DataMasterSchema, 'mutabaahmahasiswa');