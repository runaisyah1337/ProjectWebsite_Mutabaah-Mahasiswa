let MASTER_DATA = [];

function getWeekOfMonth() {
    const today = new Date();
    const day = today.getDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    const adjustedDate = day + (firstDay === 0 ? 6 : firstDay - 1);
    return Math.ceil(adjustedDate / 7);
}

window.onload = async function() {
    const user = JSON.parse(localStorage.getItem('tazkia_session'));
    const token = localStorage.getItem('token');
    const currentWeek = getWeekOfMonth();

    // Proteksi Halaman
    if (!user || user.role !== 'pembina') {
        window.location.href = "index.html";
        return;
    }

    document.getElementById('pembinaName').innerText = "Assalamu'alaikum " + user.nama + "!";
    
    try {
        // REVISI: URL Relatif untuk Monolith
        const response = await fetch('/api/evaluasi/all-stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        const rawData = result.students || [];

        MASTER_DATA = rawData.map(item => {
            const evalsThisWeek = (item.evaluations || []).filter(ev => 
                String(ev.weekStart) === String(currentWeek)
            );

            let rerataNum = 0;
            if (evalsThisWeek.length > 0) {
                let totalSkor = 0;
                evalsThisWeek.forEach(ev => {
                    if (ev.jawaban) {
                        totalSkor += Object.values(ev.jawaban).reduce((a, b) => Number(a) + Number(b), 0);
                    }
                });
                rerataNum = totalSkor / evalsThisWeek.length;
            }

            return { 
                nama: item.nama, 
                nim: item.studentId, 
                rerata: rerataNum
            };
        });
        
        MASTER_DATA.sort((a, b) => a.rerata - b.rerata);
        renderTable(MASTER_DATA);
        
    } catch (err) {
        console.error(err);
        document.getElementById('listBinaan').innerHTML = '<tr><td colspan="3" style="text-align:center;">Gagal mengambil data.</td></tr>';
    }
};

function renderTable(dataArray) {
    const tbody = document.getElementById('listBinaan');
    const currentWeek = getWeekOfMonth();
    tbody.innerHTML = '';

    if (dataArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Data tidak ditemukan.</td></tr>';
        return;
    }

    dataArray.forEach(student => {
        const pillStyle = student.rerata < 15 
            ? "background: #fee2e2; color: #ef4444;" 
            : "background: #dcfce7; color: #22c55e;";
        
        const row = `
            <tr>
                <td style="padding-left: 15px;">
                    <span style="font-weight:bold; display:block;">${student.nama}</span>
                    <span style="font-size:11px; color:#888;">NIM: ${student.nim}</span>
                </td>
                <td style="text-align:center;">
                    <span class="score-pill" style="${pillStyle}">${student.rerata.toFixed(1)}</span>
                </td>
                <td style="text-align:center; vertical-align: middle;">
                    <div class="action-buttons-group">
                        <a href="rekapan.html?nim=${student.nim}&nama=${encodeURIComponent(student.nama)}&week=${currentWeek}" class="btn-action">
                            <i class="fas fa-list-check" style="color:#f37021;"></i> REKAPAN
                        </a>
                    </div>
                </td>
            </tr>`;
        tbody.innerHTML += row;
    });
}

function filterTable() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const filtered = MASTER_DATA.filter(student => 
        student.nama.toLowerCase().includes(query) || 
        student.nim.toString().includes(query)
    );
    renderTable(filtered);
}