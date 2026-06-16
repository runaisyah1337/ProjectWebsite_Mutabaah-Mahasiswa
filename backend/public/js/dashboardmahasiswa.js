// dashboardmahasiswa.js - Logika Dashboard Mahasiswa (BUG FIX: Unified window.onload)
// Sebelumnya terdapat 3 deklarasi window.onload terpisah yang saling menimpa,
// menyebabkan logika penguncian form dan update link tidak pernah tereksekusi.
// Sekarang digabung menjadi satu fungsi terpadu.

function getWeekOfMonth() {
    const today = new Date();
    const day = today.getDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    return Math.ceil((day + firstDay) / 7);
}

function getNamaBulan(monthIndex) {
    const bulan = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return bulan[monthIndex];
}

window.onload = function() {
    // === 1. CEK SESSION ===
    const user = JSON.parse(localStorage.getItem('tazkia_session'));
    if (!user) { 
        window.location.href = "/"; 
        return; 
    }

    const today = new Date();
    const currentDay = today.getDay();    // 0 = Minggu, 6 = Sabtu
    const currentHour = today.getHours();
    const currentMin = today.getMinutes();
    const month = today.getMonth();
    const year = today.getFullYear();
    const currentWeek = getWeekOfMonth();

    // === 2. UPDATE NAMA (Tampilkan nama depan saja) ===
    if (user.nama) {
        const namaDepan = user.nama.split(' ')[0];
        document.getElementById('welcomeName').innerText = `Assalamu'alaikum, ${namaDepan}!`;
    }

    // === 3. UPDATE BADGE PERIODE & WARNING AKHIR PEKAN ===
    const indicator = document.getElementById('weekIndicator');
    if (indicator) {
        if (currentDay === 6 || currentDay === 0) {
            // Sabtu atau Minggu: tampilkan warning merah
            indicator.style.background = "#fee2e2";
            indicator.style.color = "#dc2626";
            indicator.style.border = "1px solid #fca5a5";
            indicator.style.fontWeight = "900";
            indicator.innerHTML = `<i class="fas fa-exclamation-triangle"></i> SEGERA ISI: Minggu ke-${currentWeek}`;
        } else {
            // Hari biasa: tampilkan badge biru normal
            indicator.style.background = "#f0f4f8";
            indicator.style.color = "var(--tazkia-blue)";
            indicator.style.border = "none";
            indicator.style.fontWeight = "bold";
            indicator.innerHTML = `<i class="fas fa-calendar-alt"></i> Minggu ke-${currentWeek}, ${getNamaBulan(month)} ${year}`;
        }
    }

    // === 4. LOGIKA PENGUNCIAN FORM (Minggu 23:59 - Senin 04:00) ===
    let isLocked = false;
    if (currentDay === 0 && (currentHour > 23 || (currentHour === 23 && currentMin >= 59))) isLocked = true;
    if (currentDay === 1 && currentHour < 4) isLocked = true;

    const btnIsi = document.getElementById('btnIsiMutabaah');
    const lockStatusText = document.getElementById('lockStatusText');

    if (isLocked && btnIsi) {
        btnIsi.classList.add('locked');
        btnIsi.href = "#";
        btnIsi.innerHTML = '<i class="fas fa-lock"></i> <span>TERKUNCI</span>';
        if (lockStatusText) {
            lockStatusText.innerHTML = `<b style="color:#ef4444;">Form sedang diproses. Dibuka kembali Senin jam 04:00 Subuh.</b>`;
        }
    }

    // === 5. UPDATE LINK REKAPAN & GRAFIK DENGAN PARAMETER MINGGU ===
    const rekapLink = document.getElementById('rekapLink');
    const grafikLink = document.getElementById('grafikLink');
    if (rekapLink) rekapLink.href = `rekapan.html?week=${currentWeek}`;
    if (grafikLink) grafikLink.href = `grafik.html?week=${currentWeek}`;
};

// === FUNGSI MODAL BANTUAN ===
function openModal() { document.getElementById('faqModal').style.display = 'flex'; }
function closeModal() { document.getElementById('faqModal').style.display = 'none'; }