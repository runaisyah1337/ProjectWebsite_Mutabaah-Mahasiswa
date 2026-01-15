// mutabaah.js - Logika Pengisian dan Update Amalan Mahasiswa

const sessionStr = localStorage.getItem('tazkia_session');
const token = localStorage.getItem('token');

// Proteksi: Jika tidak ada session, tendang balik ke login
if (!sessionStr || !token) { 
    window.location.href = "index.html"; 
}

const session = JSON.parse(sessionStr);

// Fungsi menghitung minggu keberapa dalam bulan ini
function getWeekOfMonth() {
    const today = new Date();
    const day = today.getDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    const adjustedDate = day + (firstDay === 0 ? 6 : firstDay - 1);
    return Math.ceil(adjustedDate / 7);
}

window.onload = async function() {
    try {
        const currentWeek = getWeekOfMonth();
        // Ambil data lama untuk cek apakah sudah pernah isi minggu ini
        const res = await fetch(`/api/evaluasi/stats?nim=${session.nim}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (Array.isArray(data)) {
            const existingData = data.find(d => Number(d.weekStart) === currentWeek);
            if (existingData && existingData.jawaban) {
                const j = existingData.jawaban;
                const form = document.getElementById('mutabaahForm');
                
                // Isi otomatis form dengan data yang sudah ada (Auto-fill)
                Object.keys(j).forEach(key => { 
                    if (form.elements[key]) form.elements[key].value = j[key]; 
                });
                
                // Ubah teks UI agar user tahu ini mode Update
                document.querySelector('.btn-submit-form').innerHTML = '<i class="fas fa-sync"></i> UPDATE DATA AMALAN';
                document.getElementById('subHeaderStatus').innerHTML = `<b style="color:var(--tazkia-orange)">Data Minggu ke-${currentWeek} sudah terisi.</b>`;
            }
        }
    } catch (err) { 
        console.error("Gagal memuat data lama:", err); 
    }
};

// Logika Submit Form
document.getElementById('mutabaahForm').onsubmit = async function(e) {
    e.preventDefault();
    const btn = document.querySelector('.btn-submit-form');
    const originalText = btn.innerHTML;
    
    btn.innerText = "Mengirim...";
    btn.disabled = true;

    const formData = new FormData(this);
    const jawaban = {};
    formData.forEach((value, key) => { jawaban[key] = value; });

    try {
        const res = await fetch('/api/evaluasi/webhook', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ studentId: session.nim, jawaban: jawaban })
        });
        
        if(res.ok) { 
            alert("Alhamdulillah, data berhasil disimpan!"); 
            window.location.href = "dashboardmahasiswa.html"; 
        } else {
            alert("Gagal menyimpan data. Silakan coba lagi.");
        }
    } catch (err) { 
        alert("Koneksi gagal. Pastikan server menyala."); 
    } finally { 
        btn.innerHTML = originalText;
        btn.disabled = false; 
    }
};