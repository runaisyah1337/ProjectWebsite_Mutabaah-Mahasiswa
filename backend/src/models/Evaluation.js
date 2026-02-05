const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  weekStart: { type: Number, required: true },
  // --- TAMBAHKAN DUA BARIS INI ---
  month: { type: Number, required: true }, 
  year: { type: Number, required: true },
  // ------------------------------
  jawaban: {
    tilawah: Number,
    matsurot: Number,
    sholatMasjid: Number,
    sholatMalam: Number,
    puasa: Number,
    olahraga: Number,
    infaq: Number,
    keluarga: Number,
    donasiPalestina: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Evaluation', EvaluationSchema);