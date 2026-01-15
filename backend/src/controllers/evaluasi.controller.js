const Evaluation = require('../models/Evaluation');
const User = require('../models/User');

/**
 * FUNGSI PEMBANTU: Menghitung minggu berjalan secara otomatis (Senin-Minggu)
 * JANGAN DIUBAH
 */
function getAutoWeek() {
  const today = new Date();
  const day = today.getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const adjustedDate = day + (firstDay === 0 ? 6 : firstDay - 1);
  return Math.ceil(adjustedDate / 7);
}

// 1. Fungsi Webhook (Menerima data dari Google Form) - TETAP AMAN
exports.handleWebhook = async (req, res) => {
  try {
    let { studentId, jawaban } = req.body;
    const forcedWeek = getAutoWeek(); 

    console.log(`Menerima data dari NIM ${studentId}. Dipaksa ke Minggu: ${forcedWeek}`);

    const result = await Evaluation.findOneAndUpdate(
      { 
        studentId: String(studentId), 
        weekStart: forcedWeek 
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

// 2. Fungsi getStats (Untuk Grafik Per Mahasiswa) - TETAP AMAN
exports.getStats = async (req, res) => {
  try {
    const nim = req.query.nim || (req.user ? req.user.nim : null);

    if (!nim || nim === "undefined") {
      return res.status(200).json([]);
    }

    const data = await Evaluation.find({ studentId: String(nim) }).sort({ weekStart: 1 });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil statistik" });
  }
};

// 3. Fungsi getAllStats (HANYA BAGIAN INI YANG DIPERBAIKI UNTUK GRAFIK ADMIN)
exports.getAllStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'pembina') {
      return res.status(403).json({ message: "Akses ditolak." });
    }

    const currentWeek = getAutoWeek(); // Ambil minggu saat ini (1-4)
    const allStudents = await User.find({ role: 'mahasiswa' }, 'nama nim');
    const allEvaluations = await Evaluation.find();

    // --- 1. HITUNG RATA-RATA AMALAN MINGGU INI SAJA (BAR CHART) ---
    let totals = { tilawah: 0, matsurot: 0, sholatMasjid: 0, sholatMalam: 0, puasa: 0, olahraga: 0, keluarga: 0, infaq: 0, donasiPalestina: 0 };
    let counts = { tilawah: 0, matsurot: 0, sholatMasjid: 0, sholatMalam: 0, puasa: 0, olahraga: 0, keluarga: 0, infaq: 0, donasiPalestina: 0 };

    // Filter evaluasi hanya untuk minggu berjalan
    const currentWeekEvals = allEvaluations.filter(ev => parseInt(ev.weekStart) === currentWeek);

    currentWeekEvals.forEach(ev => {
      const j = ev.jawaban || {};
      const addData = (key, target) => {
        if (j[key] !== undefined && j[key] !== null) {
          totals[target] += Number(j[key]);
          counts[target]++;
        }
      };

      addData('tilawah', 'tilawah');
      addData('matsurot', 'matsurot');
      addData('sholatMasjid', 'sholatMasjid');
      addData('sholatMalam', 'sholatMalam');
      addData('puasa', 'puasa');
      addData('olahraga', 'olahraga');
      addData('keluarga', 'keluarga');
      addData('infaq', 'infaq');
      addData('donasiPalestina', 'donasiPalestina');
    });

    const averageData = [
      counts.tilawah > 0 ? (totals.tilawah / counts.tilawah).toFixed(2) : 0,
      counts.matsurot > 0 ? (totals.matsurot / counts.matsurot).toFixed(2) : 0,
      counts.sholatMasjid > 0 ? (totals.sholatMasjid / counts.sholatMasjid).toFixed(2) : 0,
      counts.sholatMalam > 0 ? (totals.sholatMalam / counts.sholatMalam).toFixed(2) : 0,
      counts.puasa > 0 ? (totals.puasa / counts.puasa).toFixed(2) : 0,
      counts.olahraga > 0 ? (totals.olahraga / counts.olahraga).toFixed(2) : 0,
      counts.keluarga > 0 ? (totals.keluarga / counts.keluarga).toFixed(2) : 0,
      counts.infaq > 0 ? (totals.infaq / counts.infaq).toFixed(2) : 0,
      counts.donasiPalestina > 0 ? (totals.donasiPalestina / counts.donasiPalestina).toFixed(2) : 0
    ];

    // --- 2. HITUNG TREN SKOR TOTAL (TETAP SEMUA MINGGU) ---
    const weeklyTotalScores = [0, 0, 0, 0]; 
    allEvaluations.forEach(ev => {
      const week = parseInt(ev.weekStart);
      if (week >= 1 && week <= 4) {
        const totalSkor = Object.values(ev.jawaban || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);
        weeklyTotalScores[week - 1] += totalSkor;
      }
    });

    const combinedData = allStudents.map(student => {
      const studentEvals = allEvaluations.filter(e => String(e.studentId) === String(student.nim));
      return { studentId: student.nim, nama: student.nama, evaluations: studentEvals };
    });
    
    res.status(200).json({ 
      success: true, 
      students: combinedData, 
      frequencyData: averageData, 
      weeklyTotalScores,
      currentWeek // Tambahan info minggu berjalan
    });

  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data." });
  }
};