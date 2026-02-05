const Evaluation = require('../models/Evaluation');
const User = require('../models/User');

/**
 * FUNGSI PEMBANTU: Menghitung minggu berjalan secara otomatis (Senin-Minggu)
 */
function getAutoWeek() {
  const today = new Date();
  const day = today.getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const adjustedDate = day + (firstDay === 0 ? 6 : firstDay - 1);
  return Math.ceil(adjustedDate / 7);
}

// 1. Fungsi Webhook (Menerima data dari Google Form)
exports.handleWebhook = async (req, res) => {
  try {
    let { studentId, jawaban } = req.body;
    const today = new Date();
    const forcedWeek = getAutoWeek(); 
    const currentMonth = today.getMonth() + 1; // Januari = 1, Februari = 2
    const currentYear = today.getFullYear();

    await Evaluation.findOneAndUpdate(
      { 
        studentId: String(studentId), 
        weekStart: forcedWeek,
        month: currentMonth, // TAMBAHKAN INI
        year: currentYear   // TAMBAHKAN INI
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

    if (!nim || nim === "undefined") {
      return res.status(200).json([]);
    }

    // FILTER: Cari berdasarkan NIM + BULAN SEKARANG + TAHUN SEKARANG
    const data = await Evaluation.find({ 
      studentId: String(nim),
      month: currentMonth,
      year: currentYear
    }).sort({ weekStart: 1 }); // Tetap urutkan per minggu (1-5)

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil statistik" });
  }
};

// 3. Fungsi getAllStats (DIPERBAIKI: Support Minggu 1-5 secara Dinamis)
exports.getAllStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'pembina') {
      return res.status(403).json({ message: "Akses ditolak." });
    }

    const today = new Date();
    const currentMonth = today.getMonth() + 1; // Februari = 2
    const currentYear = today.getFullYear(); // 2026
    const currentWeek = getAutoWeek(); 

    const allStudents = await User.find({ role: 'mahasiswa' }, 'nama nim');
    
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
      return { studentId: student.nim, nama: student.nama, evaluations: studentEvals };
    });
    
    res.status(200).json({ 
      success: true, 
      students: combinedData, 
      frequencyData: averageData, 
      weeklyTotalScores,
      currentWeek,
      currentMonth // Tambahan informasi bulan apa yang sedang tampil
    });

  } catch (error) {
    console.error("Error getAllStats:", error);
    res.status(500).json({ message: "Gagal mengambil data." });
  }
};