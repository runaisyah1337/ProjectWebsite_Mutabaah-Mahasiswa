
// dashboardmahasiswa.js

window.onload = function() {
    const user = JSON.parse(localStorage.getItem('tazkia_session'));
    if (!user) return; // checkAuth di main.js akan menangani ini

    // Update Nama di Dashboard
    document.getElementById('welcomeName').innerText = `Assalamu'alaikum ${user.nama}!`;

    function getWeekOfMonth() {
    const today = new Date();
    const day = today.getDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    
    // Logika: Tanggal sekarang + hari pertama dalam bulan itu, dibagi 7
    // Ini menghitung baris di kalender
    return Math.ceil((day + firstDay) / 7);
}

window.onload = function() {
    // Ambil data user dari localStorage
    const user = JSON.parse(localStorage.getItem('tazkia_session'));
    
    // Jika tidak ada session, tendang balik ke login
    if (!user) { 
        window.location.href = "/"; 
        return; 
    }

    const today = new Date();
    const currentDay = today.getDay(); 
    const currentHour = today.getHours();
    const currentMin = today.getMinutes();

    // Logika Penguncian Form
    let isLocked = false;
    // Minggu malam (pukul 23:59 ke atas)
    if (currentDay === 0 && (currentHour > 23 || (currentHour === 23 && currentMin >= 59))) isLocked = true;
    // Senin pagi (sebelum pukul 04:00)
    if (currentDay === 1 && currentHour < 4) isLocked = true;

    const btnIsi = document.getElementById('btnIsiMutabaah');
    const lockStatusText = document.getElementById('lockStatusText');

    if (isLocked && btnIsi) {
        btnIsi.classList.add('locked');
        btnIsi.href = "#"; 
        btnIsi.innerHTML = '<i class="fas fa-lock"></i> <span>TERKUNCI</span>';
        lockStatusText.innerHTML = `<b style="color:#ef4444;">Form sedang diproses. Dibuka kembali Senin jam 04:00 Subuh.</b>`;
    }

    const currentWeek = getWeekOfMonth();
    const monthNames = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
    
    // Update tampilan nama dan minggu
    document.getElementById('weekIndicator').innerText = `MINGGU ${currentWeek} | ${monthNames[today.getMonth()]} ${today.getFullYear()}`;
    document.getElementById('welcomeName').innerText = "Assalamu'alaikum " + user.nama + "!";
    
    // Update Link Rekapan & Grafik agar membawa parameter minggu
    document.getElementById('rekapLink').href = `rekapan.html?week=${currentWeek}`;
    document.getElementById('grafikLink').href = `grafik.html?week=${currentWeek}`;
};
};

// Fungsi pembantu lainnya seperti openModal() dan closeModal()
function openModal() { document.getElementById('faqModal').style.display = "flex"; }
function closeModal() { document.getElementById('faqModal').style.display = "none"; }
// dashboardmahasiswa.js - Logika Dashboard & Informasi Periode

// dashboardmahasiswa.js - Logika Dashboard Mahasiswa

function getNamaBulan(monthIndex) {
    const bulan = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return bulan[monthIndex];
}

function updatePeriodeDashboard() {
    const today = new Date();
    const dayName = today.getDay(); // 0 (Minggu), 6 (Sabtu)
    const date = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();

    // 1. Logika Hitung Minggu Berjalan (Sesuai Baris Kalender)
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Minggu) sampai 6 (Sabtu)
    // Rumus simpel: (tanggal sekarang + posisi hari pertama) / 7
    const week = Math.ceil((date + firstDayOfMonth) / 7);

    // Jika hasilnya 0 (jarang terjadi tapi untuk jaga-jaga), set ke 1
    const finalWeek = week === 0 ? 1 : week;
    
    // 2. PERBAIKAN NAMA USER (Agar tidak terpotong)
    const session = JSON.parse(localStorage.getItem('tazkia_session'));
    if (session && session.nama) {
        // split(' ') membagi berdasarkan spasi untuk mengambil nama depan
        // [0] mengambil elemen pertama (nama depan) secara utuh
        const namaDepan = session.nama.split(' ')[0]; 
        document.getElementById('welcomeName').innerText = `Assalamu'alaikum, ${namaDepan}!`;
    }

    // 3. Update Badge Periode & Warna Warning MERAH saat Akhir Pekan
    const indicator = document.getElementById('weekIndicator');
    if (indicator) {
        indicator.innerHTML = `<i class="fas fa-calendar-alt"></i> Minggu ke-${week}, ${getNamaBulan(month)} ${year}`;

        // Jika Sabtu (6) atau Minggu (0), ubah ke warna MERAH
        if (dayName === 6 || dayName === 0) {
            indicator.style.background = "#fee2e2"; // Background Merah Muda (Soft Red)
            indicator.style.color = "#dc2626";     // Teks Merah Berani (Bold Red)
            indicator.style.border = "1px solid #fca5a5"; // Border Merah tipis
            indicator.innerHTML = `<i class="fas fa-exclamation-triangle"></i> SEGERA ISI: Minggu ke-${week}`;
            
            // Tambahkan efek sedikit bergetar atau font lebih tebal agar mencolok
            indicator.style.fontWeight = "900";
        } else {
            // Reset ke warna normal (Biru) jika bukan akhir pekan
            indicator.style.background = "#f0f4f8";
            indicator.style.color = "var(--tazkia-blue)";
            indicator.style.border = "none";
            indicator.style.fontWeight = "bold";
        }
    }
}

// Fungsi Modal Bantuan
function openModal() { document.getElementById('faqModal').style.display = 'flex'; }
function closeModal() { document.getElementById('faqModal').style.display = 'none'; }

// Jalankan saat load
window.onload = updatePeriodeDashboard;