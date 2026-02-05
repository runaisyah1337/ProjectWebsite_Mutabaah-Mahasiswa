// charts.js - Logika Visualisasi Data Ibadah Mahasiswa (Full Dynamic Version)

// Konfigurasi Warna berdasarkan Skor
function getStatusColor(score) {
    const s = Number(score);
    if (s === 3) return '#28a745'; // Hijau (Baik)
    if (s === 2) return '#ffc107'; // Kuning (Cukup)
    if (s === 1) return '#dc3545'; // Merah (Kurang)
    return '#e9ecef';
}

// Logika Minggu Berjalan yang Sinkron dengan Backend
function getWeekOfMonth() {
    const today = new Date();
    const day = today.getDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    // Penyesuaian agar Senin dianggap awal minggu
    const adjustedDate = day + (firstDay === 0 ? 6 : firstDay - 1);
    return Math.ceil(adjustedDate / 7);
}

function goBack() {
    const user = JSON.parse(localStorage.getItem('tazkia_session'));
    if (user && user.role === 'admin') window.location.href = 'adminpantau.html';
    else if (user && user.role === 'pembina') window.location.href = 'dashboardpembina.html';
    else window.location.href = 'dashboardmahasiswa.html';
}

let barChartInstance = null;
let lineChartInstance = null;

window.onload = async function() {
    const user = JSON.parse(localStorage.getItem('tazkia_session'));
    const token = localStorage.getItem('token');
    if (!token || !user) { window.location.href = "/"; return; }

    const urlParams = new URLSearchParams(window.location.search);
    const targetNim = urlParams.get('nim') || user.nim;
    
    // Tentukan minggu filter (Default: minggu saat ini)
    const currentRealWeek = getWeekOfMonth();
    const targetWeek = urlParams.get('week') || currentRealWeek; 

    document.getElementById('displayName').innerText = "NIM: " + targetNim;
    
    // Update Judul Komposisi Amal agar sinkron dengan minggu berjalan
    if (document.getElementById('pieTitle')) {
        document.getElementById('pieTitle').innerText = `Komposisi Amal (Minggu ${targetWeek})`;
    }

    loadCharts(targetNim, token, targetWeek);
};

async function loadCharts(nim, token, weekFilter) {
    try {
        const response = await fetch(`/api/evaluasi/stats?nim=${nim}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const allEvaluations = await response.json();
        
        // Filter data untuk Bar Chart (Minggu yang sedang dilihat)
        const currentWeekData = allEvaluations.find(ev => String(ev.weekStart) === String(weekFilter));
        
        renderBarChart(currentWeekData ? currentWeekData.jawaban : {});
        renderLineChart(allEvaluations, weekFilter);
    } catch (err) { 
        console.error("Gagal memuat grafik:", err); 
    }
}

function renderBarChart(jawaban) {
    const canvas = document.getElementById('horizontalBarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (barChartInstance) barChartInstance.destroy();

    const labels = ['Tilawah', 'Matsurot', 'Sholat Masjid', 'Sholat Malam', 'Puasa', 'Olahraga', 'Keluarga', 'Infaq', 'Palestina'];
    const dataValues = [
        Number(jawaban.tilawah || 0), Number(jawaban.matsurot || 0), 
        Number(jawaban.sholatMasjid || 0), Number(jawaban.sholatMalam || 0), 
        Number(jawaban.puasa || 0), Number(jawaban.olahraga || 0), 
        Number(jawaban.keluarga || 0), Number(jawaban.infaq || 0), 
        Number(jawaban.donasiPalestina || 0)
    ];

    barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Skor Amalan',
                data: dataValues,
                backgroundColor: dataValues.map(v => getStatusColor(v)),
                borderRadius: 5,
                barThickness: 20
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { beginAtZero: true, max: 3, ticks: { stepSize: 1 } },
                y: { ticks: { font: { size: 12, weight: 'bold' } } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderLineChart(dataArray, currentWeekFilter) {
    const canvas = document.getElementById('lineChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (lineChartInstance) lineChartInstance.destroy();

    // 1. Tentukan batas minggu secara dinamis
    const maxWeekInData = dataArray.length > 0 ? Math.max(...dataArray.map(ev => parseInt(ev.weekStart))) : 4;
    const displayWeeks = Math.max(maxWeekInData, parseInt(currentWeekFilter), 4);
    
    // 2. Siapkan array label dan skor
    const labels = [];
    const scores = [];

    for (let i = 1; i <= displayWeeks; i++) {
        labels.push(`Minggu ${i}`);
        
        // Cari data di minggu ke-i
        const weekData = dataArray.find(ev => parseInt(ev.weekStart) === i);
        if (weekData) {
            const total = Object.values(weekData.jawaban || {}).reduce((a, b) => Number(a) + Number(b || 0), 0);
            scores.push(total);
        } else {
            scores.push(0); // Titik nol jika belum diisi
        }
    }

    lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Skor',
                data: scores,
                borderColor: '#003399',
                backgroundColor: 'rgba(0, 51, 153, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                y: { 
                    beginAtZero: true, 
                    max: 30, 
                    title: { display: true, text: 'Total Skor' } 
                },
                x: { title: { display: true, text: 'Periode Bulan Ini' } }
            } 
        }
    });
}