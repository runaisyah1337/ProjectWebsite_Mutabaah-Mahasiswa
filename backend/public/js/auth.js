// public/js/auth.js

async function prosesLogin(event) {
    if (event) event.preventDefault();
    console.log("--- Memulai Proses Login ---");

    const userInput = document.getElementById('userInput').value;
    const passInput = document.getElementById('passInput').value;

    if (!userInput || !passInput) return alert("Username/NIM dan Password harus diisi!");

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                identifier: userInput, 
                password: passInput 
            })
        });

        const data = await response.json();
        console.log("Response dari Server (Login):", data);

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('tazkia_session', JSON.stringify(data.user));
            
            alert('Selamat, Login Berhasil!');

            // Redirect berdasarkan role
            if (data.user.role === 'pembina') {
                window.location.href = 'dashboardpembina.html';
            } else if (data.user.role === 'admin') {
                window.location.href = 'dashboardadmin.html';
            } else {
                window.location.href = 'dashboardmahasiswa.html';
            }
        } else {
            alert("❌ " + data.message);
        }
    } catch (error) {
        console.error("Login Error:", error);
        alert("Gagal terhubung ke server! Pastikan backend menyala.");
    }
}

async function prosesDaftar(event) {
    if (event) event.preventDefault(); // Mencegah halaman refresh
    
    console.log("--- Memulai Proses Pendaftaran ---");

    // Ambil data dari elemen HTML
    const nama = document.getElementById('regNama').value.trim();
    const identifier = document.getElementById('regId').value.trim(); 
    const role = document.getElementById('regRole').value;
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPass').value;

    // Validasi Sederhana di Frontend
    if(!nama || !identifier || !email || !password) {
        console.warn("Pendaftaran dibatalkan: Data tidak lengkap");
        return alert("Mohon lengkapi semua data!");
    }

    const payload = {
        nama,
        email,
        password,
        role,
        identifier // Dikirim sebagai identifier (NIM atau No HP)
    };

    console.log("Data yang akan dikirim ke Backend:", payload);

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("Response dari Server (Register):", data);

        if (response.ok) {
            alert("✅ " + data.message);
            window.location.href = '/'; 
        } else {
            // Jika ditolak oleh sistem validasi DataMaster
            alert("❌ " + data.message);
        }
    } catch (error) {
        console.error("Register Error:", error);
        alert("Gagal terhubung ke server. Periksa koneksi atau terminal VS Code.");
    }
}