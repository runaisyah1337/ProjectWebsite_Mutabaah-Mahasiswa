// main.js - Fungsi Global

// 1. Fungsi Logout
function logout() {
    if (confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
        localStorage.clear(); // Hapus token & session
        window.location.href = "index.html";
    }
}

// 2. Cek apakah user sudah login (Hanya jalankan di halaman selain Login/Daftar)
function checkAuth() {
    const publicPages = ['/index.html', '/daftar.html', '/lupasandi.html', '/'];
    const currentPath = window.location.pathname;
    const token = localStorage.getItem('token');

    if (!token && !publicPages.includes(currentPath)) {
        window.location.href = "index.html";
    }
}

// 3. Format Tanggal Indonesia
function formatTglIndo(dateString) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Jalankan cek auth saat file dimuat
checkAuth();