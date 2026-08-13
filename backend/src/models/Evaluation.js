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

// --- PERBAIKAN POIN 4: COMPOUND INDEX ---
// Mempercepat pencarian data saat query getStats & getAllStats
EvaluationSchema.index({ studentId: 1, month: 1, year: 1 });
EvaluationSchema.index({ studentId: 1, weekStart: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Evaluation', EvaluationSchema);