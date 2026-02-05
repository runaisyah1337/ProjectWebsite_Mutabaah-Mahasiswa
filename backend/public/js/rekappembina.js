// rekappembina.js - Logika Analisis Performa Kelompok Pembina

// Fungsi Label Kualitas (Standardisasi Warna & Status)
function getStatusKualitas(skor) {
    if (skor >= 25) return '<span style="color: #22c55e; font-weight: bold;">● Sangat Baik</span>';
    if (skor >= 15) return '<span style="color: #ffc107; font-weight: bold;">● Cukup</span>';
    return '<span style="color: #ef4444; font-weight: bold;">● Perlu Atensi</span>';
}

window.onload = async function() {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = "/"; return; }

    try {
        // REVISI: Menggunakan URL relatif untuk sistem Monolith
        const response = await fetch('/api/evaluasi/all-stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        const students = result.students || [];

        const kelompokMap = {};

        // Logika Pengelompokan & Kalkulasi
        students.forEach(s => {
            // Gunakan Proper Case untuk nama kelompok
            let rawGroupName = s.pembinaName || "Tanpa Pembina";
            let displayGroupName = rawGroupName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            
            let groupKey = displayGroupName.toLowerCase().trim();

            // Hitung rerata satu mahasiswa
            let totalSkor = 0;
            const evals = s.evaluations || [];
            evals.forEach(ev => {
                if (ev.jawaban) {
                    totalSkor += Object.values(ev.jawaban).reduce((a, b) => Number(a) + Number(b), 0);
                }
            });
            const rerataMhs = evals.length > 0 ? (totalSkor / evals.length) : 0;

            if (!kelompokMap[groupKey]) {
                kelompokMap[groupKey] = { displayName: displayGroupName, jml: 0, totalRerata: 0 };
            }
            kelompokMap[groupKey].jml += 1;
            kelompokMap[groupKey].totalRerata += rerataMhs;
        });

        const tbody = document.getElementById('rekapKelompokBody');
        tbody.innerHTML = '';

        // Render ke tabel & Urutkan berdasarkan rerata tertinggi (Leaderboard)
        const sortedGroups = Object.entries(kelompokMap).sort((a, b) => (b[1].totalRerata / b[1].jml) - (a[1].totalRerata / a[1].jml));

        if (sortedGroups.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#888;">Data belum tersedia.</td></tr>';
            return;
        }

        sortedGroups.forEach(([key, data]) => {
            const rerataGrup = (data.totalRerata / data.jml).toFixed(1);
            const row = `
                <tr style="border-bottom: 1px solid #262626;">
                    <td style="padding: 20px 15px; font-weight: bold; color: #fff;">
                        <i class="fas fa-circle-user" style="color: #f37021; margin-right: 5px;"></i> ${data.displayName}
                    </td>
                    <td style="text-align:center; color: #aaa;">${data.jml} <small>Mhs</small></td>
                    <td style="text-align:center; color: #fff; font-weight: 900; font-size: 15px;">${rerataGrup}</td>
                    <td style="padding: 15px;">${getStatusKualitas(rerataGrup)}</td>
                </tr>`;
            tbody.innerHTML += row;
        });

    } catch (err) {
        console.error("Gagal Analisis Kelompok:", err);
        document.getElementById('rekapKelompokBody').innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color: #ef4444;">Gagal mengambil data dari server.</td></tr>';
    }
}