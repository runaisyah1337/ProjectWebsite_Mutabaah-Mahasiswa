const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
  // Disesuaikan dengan indeks di MongoDB Atlas kamu
  studentId: { type: String, required: true }, // Ini untuk menyimpan NIM
  weekStart: { type: Number, required: true }, // Ini untuk menyimpan MingguKe
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