// rekap.js - Logika Pengolahan Data Rekapan Mahasiswa

// Fungsi pembantu global
function getWeekOfMonth() {
    const today = new Date();
    const day = today.getDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    const adjustedDate = day + (firstDay === 0 ? 6 : firstDay - 1);
    return Math.ceil(adjustedDate / 7);
}

function goBack() {
    const user = JSON.parse(localStorage.getItem('tazkia_session'));
    if (!user) { window.location.href = '/'; return; }
    
    // Navigasi pintar berdasarkan role
    if (user.role === 'admin') window.location.href = 'adminpantau.html';
    else if (user.role === 'pembina') window.location.href = 'dashboardpembina.html';
    else window.location.href = 'dashboardmahasiswa.html';
}

window.onload = async function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('tazkia_session'));
    if (!token || !user) { window.location.href = "/"; return; }

    const urlParams = new URLSearchParams(window.location.search);
    const targetWeek = urlParams.get('week') || getWeekOfMonth(); 
    const targetNim = urlParams.get('nim') || String(user.nim);
    const targetNama = urlParams.get('nama') || (targetNim === String(user.nim) ? user.nama : "Mahasiswa");

    document.getElementById('studentName').innerText = targetNama + " | NIM: " + targetNim;
    document.getElementById('weekTitle').innerText = "Rekapan Minggu ke-" + targetWeek;

    // Sembunyikan summary jika bukan pembina/admin
    if (user.role !== 'pembina' && user.role !== 'admin') {
        const sumSection = document.getElementById('summarySection');
        const alrtBox = document.getElementById('alertBox');
        if(sumSection) sumSection.style.display = 'none';
        if(alrtBox) alrtBox.style.display = 'none';
    }

    loadData(targetNim, token, targetWeek);
};

async function loadData(nim, token, weekFilter) {
    try {
        const response = await fetch(`/api/evaluasi/stats?nim=${nim}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const timeline = document.getElementById('timelineContent');
        timeline.innerHTML = '';

        let filteredData = data.filter(item => String(item.weekStart) === String(weekFilter));
        
        if (filteredData.length === 0) {
            timeline.innerHTML = '<div style="text-align:center; padding:40px; background:white; border-radius:15px; color:#888;">Belum ada laporan minggu ini.</div>';
            return;
        }

        const j = filteredData[0].jawaban || {};
        const activities = [
            { label: 'Tilawah Al-Qur\'an', val: j.tilawah, icon: 'fa-book-open', desc1: '< 4 Juz', desc2: '4-7 Juz', desc3: '> 7 Juz' },
            { label: 'Al-Matsurat', val: j.matsurot, icon: 'fa-pray', desc1: '< 3 Kali', desc2: '4-6 Kali', desc3: '> 7 Kali' },
            { label: 'Sholat di Masjid', val: j.sholatMasjid, icon: 'fa-mosque', desc1: '< 6 Kali', desc2: '7-20 Kali', desc3: '> 21 Kali' },
            { label: 'Sholat Malam', val: j.sholatMalam, icon: 'fa-moon', desc1: '< 1 Kali', desc2: '2 Kali', desc3: '> 3 Kali' },
            { label: 'Puasa Sunnah', val: j.puasa, icon: 'fa-utensils', desc1: '0 Kali', desc2: '1 Kali', desc3: '2 Kali' },
            { label: 'Olahraga', val: j.olahraga, icon: 'fa-running', desc1: '0 Kali', desc2: '1-2 Kali', desc3: '> 3 Kali' },
            { label: 'Kegiatan Keluarga', val: j.keluarga, icon: 'fa-users', desc1: '0 Kali', desc2: '1-3 Kali', desc3: '> 4 Kali' },
            { label: 'Infaq', val: j.infaq, icon: 'fa-hand-holding-heart', type: 'bool' },
            { label: 'Donasi Palestina', val: j.donasiPalestina, icon: 'fa-globe', type: 'bool' }
        ];

        // --- PENGOLAHAN RINGKASAN ---
        let totalSkor = 0;
        let amalanTerendah = [];
        activities.forEach(a => {
            let s = Number(a.val || 1);
            totalSkor += s;
            if (s === 1) amalanTerendah.push(a.label);
        });

        // Update Summary (Hanya tampil jika elemen ada di HTML)
        const summarySection = document.getElementById('summarySection');
        if (summarySection && summarySection.style.display !== 'none') {
            summarySection.style.display = 'grid';
            document.getElementById('totalScoreText').innerText = `${totalSkor}/27`;
            document.getElementById('percentText').innerText = `${Math.round((totalSkor/27)*100)}%`;
            document.getElementById('lowAmalanText').innerText = amalanTerendah.length > 0 ? amalanTerendah[0] : "Lengkap";
            
            const alertBox = document.getElementById('alertBox');
            if (amalanTerendah.length > 0 && alertBox) {
                alertBox.style.display = 'block';
                document.getElementById('alertMessage').innerText = `Perlu bimbingan khusus pada: ${amalanTerendah.join(', ')}.`;
            }
        }

        // --- RENDER TIMELINE ---
        activities.forEach(act => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            let s = Number(act.val || 1);
            let isYa = s === 3;
            let status = s === 3 ? "BAIK" : s === 2 ? "CUKUP" : "KURANG";
            let detail = act[`desc${s}`] || (isYa ? 'Sudah' : 'Belum');
            
            let badgeClass = act.type === 'bool' ? (isYa ? 'score-3' : 'score-1') : `score-${s}`;
            let badgeText = act.type === 'bool' ? (isYa ? 'YA' : 'TIDAK') : status;

            item.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-card">
                    <div class="item-info">
                        <div class="item-icon"><i class="fas ${act.icon}"></i></div>
                        <h4 style="margin:0; font-size:13px;">${act.label}</h4>
                    </div>
                    <div class="score-display">
                        <span class="badge-score ${badgeClass}">${badgeText} (${s})</span>
                        <span class="score-desc">(${detail})</span>
                    </div>
                </div>`;
            timeline.appendChild(item);
        });
    } catch (err) { console.error("Gagal memuat rekapan:", err); }
}