// adminpantau.js - Logika Manajemen & Monitoring Seluruh Mahasiswa (Admin)

let ALL_STUDENTS = []; 
let currentSortOrder = 'desc'; // Default: Tertinggi ke Terendah

// Fungsi menghitung minggu keberapa dalam bulan berjalan
function getWeekOfMonth() {
    const today = new Date();
    const day = today.getDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    const adjustedDate = day + (firstDay === 0 ? 6 : firstDay - 1);
    return Math.ceil(adjustedDate / 7);
}

window.onload = async function() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('tazkia_session'));
    const currentWeek = getWeekOfMonth();

    // PROTEKSI: Hanya Admin yang boleh mengakses halaman ini
    if (!token || !user || user.role !== 'admin') {
        window.location.href = "/";
        return;
    }

    try {
        // REVISI: Menggunakan URL relatif untuk sinkronisasi Monolith
        const res = await fetch('/api/evaluasi/all-stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        
        ALL_STUDENTS = (result.students || []).map(m => {
            // Filter evaluasi hanya untuk minggu berjalan
            const evalsThisWeek = (m.evaluations || []).filter(ev => 
                String(ev.weekStart) === String(currentWeek)
            );

            let total = 0;
            if (evalsThisWeek.length > 0) {
                evalsThisWeek.forEach(ev => { 
                    if(ev.jawaban) {
                        total += Object.values(ev.jawaban).reduce((a,b) => Number(a) + Number(b), 0);
                    }
                });
                const rerataNum = total / evalsThisWeek.length;
                return { ...m, rerataNum };
            } else {
                return { ...m, rerataNum: 0 }; // Belum isi = Skor 0
            }
        });

        sortAndRender();
    } catch (e) { 
        console.error("Gagal memuat data pantauan:", e); 
        document.getElementById('listMhsBody').innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">Gagal memuat data mahasiswa dari server.</td></tr>';
    }
};

// LOGIKA SORTING (PENGURUTAN)
function toggleSort() {
    currentSortOrder = currentSortOrder === 'desc' ? 'asc' : 'desc';
    const icon = document.getElementById('sortIcon');
    if (icon) {
        icon.className = currentSortOrder === 'desc' ? 'fas fa-sort-down' : 'fas fa-sort-up';
    }
    sortAndRender();
}

function sortAndRender() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.toLowerCase() : "";
    
    // 1. Jalankan Filter Pencarian
    let data = ALL_STUDENTS.filter(m => 
        m.nama.toLowerCase().includes(query) || 
        m.studentId.toString().includes(query)
    );

    // 2. Jalankan Pengurutan Skor
    data.sort((a, b) => {
        return currentSortOrder === 'desc' ? b.rerataNum - a.rerataNum : a.rerataNum - b.rerataNum;
    });

    renderTable(data);
}

function filterTable() {
    sortAndRender(); 
}

function renderTable(data) {
    const currentWeek = getWeekOfMonth();
    const listBody = document.getElementById('listMhsBody');
    if (!listBody) return;

    const html = data.map(m => {
        const rerata = m.rerataNum.toFixed(1);
        const statusClass = m.rerataNum < 15 ? 'pill-rerata low-score' : 'pill-rerata';
        const encodedName = encodeURIComponent(m.nama);

        return `
            <tr>
                <td>
                    <p class="mhs-name" style="font-weight:bold; margin:0;">${m.nama}</p>
                    <p class="mhs-nim" style="font-size:11px; color:#888; margin:0;">NIM: ${m.studentId}</p>
                </td>
                <td style="text-align:center;">
                    <span class="${statusClass}">${rerata}</span>
                </td>
                <td style="text-align:center; vertical-align: middle;">
                    <div class="action-buttons-group">
                        <a href="grafik.html?nim=${m.studentId}&week=${currentWeek}" class="btn-action btn-grafik">
                            <i class="fas fa-chart-line"></i> <small>GRAFIK</small>
                        </a>
                        <a href="rekapan.html?nim=${m.studentId}&nama=${encodedName}&week=${currentWeek}" class="btn-action btn-rekapan">
                            <i class="fas fa-list-check"></i> <small>REKAPAN</small>
                        </a>
                    </div>
                </td>
            </tr>`;
    }).join('');
    
    listBody.innerHTML = html || '<tr><td colspan="3" style="text-align:center;">Mahasiswa tidak ditemukan.</td></tr>';
}