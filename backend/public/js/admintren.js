// admin_tren.js - Logika Statistik Global untuk Admin (Dynamic Week 1-5)

let ALL_STUDENT_DATA = []; 
const TOTAL_MAHASISWA_KAMPUS = 112; // Sesuaikan dengan target partisipasi kamu
let myBarChart = null;
let myTrendChart = null;

window.onload = async function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('tazkia_session'));

    if (!token || !user || (user.role !== 'admin' && user.role !== 'pembina')) {
        window.location.href = "index.html";
        return;
    }

    try {
        const res = await fetch('/api/evaluasi/all-stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        
        ALL_STUDENT_DATA = result.students || [];
        
        // 1. Sinkronisasi dropdown filter minggu
        const weekFilterEl = document.getElementById('weekFilter');
        if (result.currentWeek > 4) {
            // Jika masuk minggu 5, tambahkan opsi di dropdown secara otomatis
            if (!weekFilterEl.querySelector('option[value="5"]')) {
                const opt = document.createElement('option');
                opt.value = "5";
                opt.text = "Minggu 5";
                weekFilterEl.add(opt);
            }
        }
        weekFilterEl.value = result.currentWeek || 1;
        
        updateDashboard();
        
    } catch (e) { 
        console.error("Gagal load data tren:", e); 
    }
};

function changeWeek() {
    updateDashboard();
}

// REVISI: Partisipasi sekarang dinamis (bisa 4 atau 5 minggu)
function calculateParticipationRate() {
    // Cari minggu tertinggi yang ada di data
    let maxWeek = 4;
    ALL_STUDENT_DATA.forEach(student => {
        (student.evaluations || []).forEach(ev => {
            if (parseInt(ev.weekStart) > maxWeek) maxWeek = parseInt(ev.weekStart);
        });
    });

    let weeklyParticipants = Array(maxWeek).fill(0);
    
    ALL_STUDENT_DATA.forEach(student => {
        (student.evaluations || []).forEach(ev => {
            const w = parseInt(ev.weekStart);
            if (w >= 1 && w <= maxWeek && ev.jawaban) {
                weeklyParticipants[w-1]++;
            }
        });
    });

    return {
        data: weeklyParticipants.map(count => ((count / TOTAL_MAHASISWA_KAMPUS) * 100).toFixed(1)),
        maxWeek: maxWeek
    };
}

function updateDashboard() {
    const selectedWeek = parseInt(document.getElementById('weekFilter').value);
    const titleElement = document.getElementById('barChartTitle');
    
    if (titleElement) {
        titleElement.innerHTML = `
            <i class="fas fa-users" style="color: var(--tazkia-orange);"></i> 
            Kualitas Amalan (Minggu ${selectedWeek})
        `;
    }

    let totals = { tilawah: 0, matsurot: 0, sholatMasjid: 0, sholatMalam: 0, puasa: 0, olahraga: 0, keluarga: 0, infaq: 0, donasiPalestina: 0 };
    let counts = { tilawah: 0, matsurot: 0, sholatMasjid: 0, sholatMalam: 0, puasa: 0, olahraga: 0, keluarga: 0, infaq: 0, donasiPalestina: 0 };

    ALL_STUDENT_DATA.forEach(student => {
        const evalMingguIni = (student.evaluations || []).find(ev => parseInt(ev.weekStart) === selectedWeek);
        if (evalMingguIni && evalMingguIni.jawaban) {
            const j = evalMingguIni.jawaban;
            Object.keys(totals).forEach(key => {
                if (j[key] !== undefined && j[key] !== null) {
                    totals[key] += Number(j[key]);
                    counts[key]++;
                }
            });
        }
    });

    const frequencyData = Object.keys(totals).map(key => counts[key] > 0 ? (totals[key] / counts[key]) : 0);
    renderFrequencyChart(frequencyData);

    // Update Line Chart Tren Partisipasi
    const partData = calculateParticipationRate();
    renderTrendChart(partData.data, partData.maxWeek);
}

function renderFrequencyChart(dataValues) {
    const canvas = document.getElementById('frequencyChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if (myBarChart) { myBarChart.destroy(); }

    myBarChart = new Chart(ctx, {
        type: 'bar',
        plugins: [ChartDataLabels],
        data: {
            labels: ['Tilawah', 'Matsurot', 'Masjid', 'Solat Malam', 'Puasa', 'Olahraga', 'Keluarga', 'Infaq', 'Donasi'],
            datasets: [{
                data: dataValues,
                backgroundColor: dataValues.map(v => {
                    const p = (v / 3) * 100;
                    if (p >= 85) return '#22c55e'; 
                    if (p >= 50) return '#eab308'; 
                    return '#ef4444';             
                }),
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            maintainAspectRatio: false,
            layout: { padding: { right: 60, bottom: 20 } },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => ` Kualitas: ${((context.raw / 3) * 100).toFixed(0)}%`
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'right',
                    formatter: (value) => ((value / 3) * 100).toFixed(0) + '%',
                    font: { weight: 'bold', size: 12 },
                    color: '#444'
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 3,
                    ticks: {
                        callback: (value) => ((value / 3) * 100).toFixed(0) + '%'
                    }
                }
            }
        }
    });
}

function renderTrendChart(percentages, maxWeek) {
    const canvas = document.getElementById('trendChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if (myTrendChart) { myTrendChart.destroy(); }

    // Buat label dinamis (Mgg 1 s/d Mgg N)
    const labels = Array.from({length: maxWeek}, (_, i) => `Mgg ${i + 1}`);

    myTrendChart = new Chart(ctx, {
        type: 'line',
        plugins: [ChartDataLabels],
        data: {
            labels: labels,
            datasets: [{
                label: 'Tingkat Partisipasi (%)',
                data: percentages, 
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                datalabels: {
                    align: 'top',
                    anchor: 'end',
                    formatter: (value) => value + '%'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: v => v + '%' }
                }
            }
        }
    });
}