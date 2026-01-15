// charts.js - Logika Visualisasi Data Ibadah Mahasiswa

// Konfigurasi Warna berdasarkan Skor
function getStatusColor(score) {
    const s = Number(score);
    if (s === 3) return '#28a745'; // Hijau (Baik)
    if (s === 2) return '#ffc107'; // Kuning (Cukup)
    if (s === 1) return '#dc3545'; // Merah (Kurang)
    return '#e9ecef';
}

function getWeekOfMonth() {
    const today = new Date();
    const day = today.getDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
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
    if (!token || !user) { window.location.href = "index.html"; return; }

    const urlParams = new URLSearchParams(window.location.search);
    const targetNim = urlParams.get('nim') || user.nim;
    const targetWeek = urlParams.get('week') || getWeekOfMonth(); 

    document.getElementById('displayName').innerText = "NIM: " + targetNim;
    if (document.getElementById('pieTitle')) {
        document.getElementById('pieTitle').innerText = `Komposisi Amal (Minggu ${targetWeek})`;
    }

    loadCharts(targetNim, token, targetWeek);
};

async function loadCharts(nim, token, weekFilter) {
    try {
        // REVISI: Menggunakan URL relatif untuk sistem Monolith
        const response = await fetch(`/api/evaluasi/stats?nim=${nim}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const allEvaluations = await response.json();
        const currentWeekData = allEvaluations.find(ev => String(ev.weekStart) === String(weekFilter));
        
        renderBarChart(currentWeekData ? currentWeekData.jawaban : {});
        renderLineChart(allEvaluations);
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

function renderLineChart(dataArray) {
    const canvas = document.getElementById('lineChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (lineChartInstance) lineChartInstance.destroy();

    const scores = [0, 0, 0, 0];
    dataArray.forEach(ev => {
        const w = parseInt(ev.weekStart);
        if (w >= 1 && w <= 4) {
            scores[w-1] = Object.values(ev.jawaban || {}).reduce((a, b) => Number(a) + Number(b || 0), 0);
        }
    });

    lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
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
                y: { beginAtZero: true, max: 35, title: { display: true, text: 'Total Skor' } },
                x: { title: { display: true, text: 'Periode Bulan Ini' } }
            } 
        }
    });
}