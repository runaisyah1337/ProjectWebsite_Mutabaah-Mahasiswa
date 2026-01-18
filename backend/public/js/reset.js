// reset.js - Logika untuk Lupa Sandi dan Ganti Sandi

async function prosesReset() {
    const emailInput = document.getElementById('emailInput');
    const email = emailInput.value;

    if (!email) {
        alert("Harap masukkan email Anda!");
        return;
    }

    try {
        // Menggunakan URL relatif untuk sistem Monolith
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        
        const data = await response.json();

        if (response.ok) {
            alert("Berhasil! " + data.message);
            window.location.href = "index.html";
        } else {
            alert("Gagal: " + data.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan pada server. Pastikan server backend menyala.");
    }
}
// Tambahkan ini di bawah fungsi prosesReset() yang sudah ada di reset.js

// Fungsi untuk memperbarui kata sandi baru
async function updateSandi() {
    const newPass = document.getElementById('newPass').value;
    const confirmPass = document.getElementById('confirmPass').value;
    
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('token');

    if (!token) {
        alert("Token tidak ditemukan. Silakan klik link dari email kembali.");
        return;
    }

    token = decodeURIComponent(token).trim();

    if (newPass.length < 6) {
        alert("Kata sandi minimal 6 karakter!");
        return;
    }

    if (newPass !== confirmPass) {
        alert("Konfirmasi kata sandi tidak cocok!");
        return;
    }

    try {
        const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        token: token, 
        newPassword: newPass // Pastikan variabel ini 'newPassword'
    })
});

        const data = await response.json();

        if (response.ok) {
            alert("Alhamdulillah, kata sandi berhasil diperbarui!");
            window.location.href = "index.html";
        } else {
            alert("Gagal: " + (data.message || "Token kedaluwarsa"));
        }
    } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan koneksi ke server.");
    }
}

// Fungsi Toggle Mata (Global agar bisa dipakai di mana saja)
function toggleVisibility(inputId, iconElement) {
    const input = document.getElementById(inputId);
    const isPassword = input.getAttribute('type') === 'password';
    
    if (isPassword) {
        input.setAttribute('type', 'text');
        iconElement.classList.replace('fa-eye-slash', 'fa-eye');
    } else {
        input.setAttribute('type', 'password');
        iconElement.classList.replace('fa-eye', 'fa-eye-slash');
    }

    iconElement.style.transform = 'translateY(-50%) scale(1.4)';
    setTimeout(() => {
        iconElement.style.transform = 'translateY(-50%) scale(1)';
    }, 250);
}