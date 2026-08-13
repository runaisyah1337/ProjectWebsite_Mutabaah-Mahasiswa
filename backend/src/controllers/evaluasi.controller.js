const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
// 1. IMPORT HELPER TANGGAL TERPUSAT
const { getWeekOfMonth } = require('../utils/dateHelper');

// 1. Fungsi Webhook (Menerima data dari Google Form / Frontend Form)
exports.handleWebhook = async (req, res) => {
  try {
    let { studentId, jawaban } = req.body;

    // RBAC: Mahasiswa hanya boleh mengisi/mengedit datanya sendiri
    if (req.user && req.user.role === 'mahasiswa' && req.user.nim !== String(studentId)) {
      return res.status(403).json({ message: "Akses ditolak, Anda tidak dapat memodifikasi data mahasiswa lain" });
    }

    // --- VALIDASI WAKTU PENGISIAN DI BACKEND (PRODUKSI) ---
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Minggu, 1 = Senin, dst.
    const currentHour = today.getHours(); // 0 - 23

    // Form TUTUP HANYA pada hari Senin antara jam 00:00 sampai 03:59 WIB untuk rekap data
    if (dayOfWeek === 1 && currentHour < 4) {
      return res.status(400).json({ 
        message: "Pengisian mutabaah sedang ditutup untuk pemrosesan data mingguan. Form akan dibuka kembali hari Senin pukul 04:00 WIB." 
      });
    }
    // -----------------------------------------------------------------

    const forcedWeek = getWeekOfMonth(today); 
    const currentMonth = today.getMonth() + 1; // Januari = 1, Februari = 2
    const currentYear = today.getFullYear();

    await Evaluation.findOneAndUpdate(
      { 
        studentId: String(studentId), 
        weekStart: forcedWeek,
        month: currentMonth, 
        year: currentYear   
      },
      { jawaban },
      { upsert: true, new: true }
    );
    
    res.status(200).json({ message: "Berhasil", week: forcedWeek });
  } catch (error) {
    console.error("Error Webhook:", error);
    res.status(500).json({ message: "Gagal" });
  }
};

// 2. Fungsi getStats (Untuk Grafik Per Mahasiswa)
exports.getStats = async (req, res) => {
  try {
    const nim = req.query.nim || (req.user ? req.user.nim : null);
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // RBAC: Mahasiswa hanya boleh melihat datanya sendiri
    if (req.user && req.user.role === 'mahasiswa' && req.user.nim !== nim) {
      return res.status(403).json({ message: "Akses ditolak, Anda tidak dapat melihat data mahasiswa lain" });
    }

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    if (!nim || nim === "undefined") {
      return res.status(200).json([]);
    }

    // FILTER: Cari berdasarkan NIM + BULAN SEKARANG + TAHUN SEKARANG
    const data = await Evaluation.find({ 
      studentId: String(nim),
      month: currentMonth,
      year: currentYear
    }).sort({ weekStart: 1 });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil statistik" });
  }
};

// 3. Fungsi getAllStats (Support Minggu 1-5 secara Dinamis)
exports.getAllStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'pembina') {
      return res.status(403).json({ message: "Akses ditolak." });
    }

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const currentWeek = getWeekOfMonth(today); 

    // BUG FIX: Tambahkan field 'pembina' agar data relasi pembina tersedia
    const allStudents = await User.find({ role: 'mahasiswa' }, 'nama nim pembina');
    
    // --- FILTER UTAMA: Hanya ambil data bulan ini ---
    const allEvaluations = await Evaluation.find({ 
      month: currentMonth, 
      year: currentYear 
    });

    // --- 1. HITUNG RATA-RATA AMALAN MINGGU BERJALAN (BAR CHART) ---
    let totals = { tilawah: 0, matsurot: 0, sholatMasjid: 0, sholatMalam: 0, puasa: 0, olahraga: 0, keluarga: 0, infaq: 0, donasiPalestina: 0 };
    let counts = { tilawah: 0, matsurot: 0, sholatMasjid: 0, sholatMalam: 0, puasa: 0, olahraga: 0, keluarga: 0, infaq: 0, donasiPalestina: 0 };

    // Filter evaluasi hanya untuk minggu yang sedang berjalan di bulan ini
    const currentWeekEvals = allEvaluations.filter(ev => parseInt(ev.weekStart) === currentWeek);

    currentWeekEvals.forEach(ev => {
      const j = ev.jawaban || {};
      const fields = Object.keys(totals);
      
      fields.forEach(field => {
        let val = j[field];
        if (val !== undefined && val !== null) {
          totals[field] += Number(val);
          counts[field]++;
        }
      });
    });

    const averageData = Object.keys(totals).map(key => 
      counts[key] > 0 ? (totals[key] / counts[key]).toFixed(2) : 0
    );

    // --- 2. HITUNG TREN SKOR TOTAL (LINE CHART DINAMIS) ---
    const hasWeek5 = allEvaluations.some(ev => parseInt(ev.weekStart) === 5);
    const maxWeeks = (currentWeek >= 5 || hasWeek5) ? 5 : 4;

    const weeklyTotalScores = Array(maxWeeks).fill(0); 

    allEvaluations.forEach(ev => {
      const week = parseInt(ev.weekStart);
      if (week >= 1 && week <= maxWeeks) {
        const totalSkor = Object.values(ev.jawaban || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);
        weeklyTotalScores[week - 1] += totalSkor;
      }
    });

    // --- 3. GABUNGKAN DATA UNTUK TABEL ---
    const combinedData = allStudents.map(student => {
      const studentEvals = allEvaluations.filter(e => String(e.studentId) === String(student.nim));
      // BUG FIX: Sertakan pembinaName agar rekap pembina berfungsi
      return { studentId: student.nim, nama: student.nama, pembinaName: student.pembina || null, evaluations: studentEvals };
    });
    
    res.status(200).json({ 
      success: true, 
      students: combinedData, 
      frequencyData: averageData, 
      weeklyTotalScores,
      currentWeek,
      currentMonth 
    });

  } catch (error) {
    console.error("Error getAllStats:", error);
    res.status(500).json({ message: "Gagal mengambil data." });
  }
};