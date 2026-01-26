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
    const forcedWeek = getAutoWeek(); 

    console.log(`Menerima data dari NIM ${studentId}. Dipaksa ke Minggu: ${forcedWeek}`);

    await Evaluation.findOneAndUpdate(
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

// 2. Fungsi getStats (Untuk Grafik Per Mahasiswa)
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

// 3. Fungsi getAllStats (DIPERBAIKI: Support Minggu 1-5 secara Dinamis)
exports.getAllStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'pembina') {
      return res.status(403).json({ message: "Akses ditolak." });
    }

    const currentWeek = getAutoWeek(); 
    const allStudents = await User.find({ role: 'mahasiswa' }, 'nama nim');
    const allEvaluations = await Evaluation.find();

    // --- 1. HITUNG RATA-RATA AMALAN MINGGU BERJALAN (BAR CHART) ---
    // Bar chart akan otomatis menampilkan rata-rata dari minggu ke-5 jika currentWeek = 5
    let totals = { tilawah: 0, matsurot: 0, sholatMasjid: 0, sholatMalam: 0, puasa: 0, olahraga: 0, keluarga: 0, infaq: 0, donasiPalestina: 0 };
    let counts = { tilawah: 0, matsurot: 0, sholatMasjid: 0, sholatMalam: 0, puasa: 0, olahraga: 0, keluarga: 0, infaq: 0, donasiPalestina: 0 };

    const currentWeekEvals = allEvaluations.filter(ev => parseInt(ev.weekStart) === currentWeek);

    currentWeekEvals.forEach(ev => {
      const j = ev.jawaban || {};
      const fields = ['tilawah', 'matsurot', 'sholatMasjid', 'sholatMalam', 'puasa', 'olahraga', 'keluarga', 'infaq', 'donasiPalestina'];
      
      fields.forEach(field => {
        // Penyesuaian: handle field 'donasiPalestina' vs 'donasi' jika ada perbedaan nama di DB
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
    // Cek apakah ada data di minggu ke-5 dalam database
    const hasWeek5 = allEvaluations.some(ev => parseInt(ev.weekStart) === 5);
    const maxWeeks = (currentWeek >= 5 || hasWeek5) ? 5 : 4;

    // Buat array skor dengan panjang dinamis (4 atau 5)
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
      weeklyTotalScores, // Isinya bisa 4 atau 5 data tergantung kondisi
      currentWeek 
    });

  } catch (error) {
    console.error("Error getAllStats:", error);
    res.status(500).json({ message: "Gagal mengambil data." });
  }
};