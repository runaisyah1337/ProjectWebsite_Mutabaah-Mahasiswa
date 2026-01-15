// admin_tren.js - Logika Statistik Global untuk Admin

let ALL_STUDENT_DATA = []; 
const TOTAL_MAHASISWA_KAMPUS = 112;
let myBarChart = null;
let myTrendChart = null;

window.onload = async function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('tazkia_session'));

    if (!token || !user || user.role !== 'admin') {
        window.location.href = "index.html";
        return;
    }

    try {
        const res = await fetch('/api/evaluasi/all-stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        
        ALL_STUDENT_DATA = result.students || [];
        document.getElementById('weekFilter').value = result.currentWeek || 1;
        
        updateDashboard();
        renderTrendChart(calculateParticipationRate());
        
    } catch (e) { 
        console.error("Gagal load data tren:", e); 
    }
};

function changeWeek() {
    updateDashboard();
}

function calculateParticipationRate() {
    let weeklyParticipants = [0, 0, 0, 0];
    ALL_STUDENT_DATA.forEach(student => {
        (student.evaluations || []).forEach(ev => {
            const w = parseInt(ev.weekStart);
            if (w >= 1 && w <= 4 && ev.jawaban) {
                weeklyParticipants[w-1]++;
            }
        });
    });
    return weeklyParticipants.map(count => ((count / TOTAL_MAHASISWA_KAMPUS) * 100).toFixed(1));
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
                if (j[key] !== undefined) {
                    totals[key] += Number(j[key]);
                    counts[key]++;
                }
            });
        }
    });

    const frequencyData = Object.keys(totals).map(key => counts[key] > 0 ? (totals[key] / counts[key]) : 0);
    renderFrequencyChart(frequencyData);
}

function renderFrequencyChart(dataValues) {
    const ctx = document.getElementById('frequencyChart').getContext('2d');
    if (myBarChart) { myBarChart.destroy(); }

    myBarChart = new Chart(ctx, {
        type: 'bar',
        plugins: [ChartDataLabels],
        data: {
            labels: ['Tilawah', 'Matsurot', 'Masjid', 'Solat Malam', 'Puasa', 'Olahraga', 'Keluarga', 'Infaq', 'Donasi'],
            datasets: [{
                data: dataValues,
                // LOGIKA WARNA BERDASARKAN PERSENTASE
                backgroundColor: dataValues.map(v => {
                    const p = (v / 3) * 100;
                    if (p >= 85) return '#22c55e'; // Hijau (Baik)
                    if (p >= 50) return '#eab308'; // Kuning (Cukup)
                    return '#ef4444';             // Merah (Kurang)
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
                        label: function(context) {
                            const persen = (context.raw / 3) * 100;
                            return ` Kualitas: ${persen.toFixed(0)}%`;
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'right',
                    offset: 5,
                    formatter: (value) => {
                        const persen = (value / 3) * 100;
                        return persen.toFixed(0) + '%'; 
                    },
                    font: { weight: 'bold', size: 12 },
                    color: '#444'
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 3,
                    grace: '10%',
                    ticks: {
                        stepSize: 0.75, 
                        callback: function(value) {
                            return ((value / 3) * 100).toFixed(0) + '%';
                        }
                    },
                    grid: { display: true, drawBorder: false }
                }
            }
        }
    });
} // <--- INI TUTUPNYA FUNGSI

function renderTrendChart(percentages) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    if (myTrendChart) { myTrendChart.destroy(); }

    myTrendChart = new Chart(ctx, {
        type: 'line',
        plugins: [ChartDataLabels],
        data: {
            labels: ['Mgg 1', 'Mgg 2', 'Mgg 3', 'Mgg 4'],
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
            layout: { padding: { top: 30 } },
            plugins: {
                datalabels: {
                    align: 'top',
                    anchor: 'end',
                    formatter: (value) => value + '%',
                    font: { weight: 'bold' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grace: '5%',
                    ticks: { callback: v => v + '%' }
                }
            }
        }
    });
}