// public/js/auth.js

async function prosesLogin() {
    // Sesuaikan ID dengan index.html
    const userInput = document.getElementById('userInput').value;
    const passInput = document.getElementById('passInput').value;

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

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('tazkia_session', JSON.stringify(data.user));
            
            alert('Login Berhasil sebagai ' + data.user.role);

            if (data.user.role === 'pembina') {
                window.location.href = 'dashboardpembina.html';
            } else if (data.user.role === 'admin') {
                window.location.href = 'dashboardadmin.html';
            } else {
                window.location.href = 'dashboardmahasiswa.html';
            }
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert("Gagal terhubung ke server!");
    }
}

async function prosesDaftar() {
    // SINKRONKAN ID DENGAN daftar.html
    const nama = document.getElementById('regNama').value;
    const identifier = document.getElementById('regId').value; 
    const role = document.getElementById('regRole').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPass').value;

    if(!nama || !identifier || !email || !password) return alert("Lengkapi data!");

    const payload = {
        nama,
        email,
        password,
        role,
        identifier // Kita kirim sebagai 'identifier' agar diterima controller
    };

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.ok) {
            alert("✅ " + data.message);
            window.location.href = 'index.html'; 
        } else {
            alert("❌ " + data.message);
        }
    } catch (error) {
        alert("Gagal terhubung ke server.");
    }
}