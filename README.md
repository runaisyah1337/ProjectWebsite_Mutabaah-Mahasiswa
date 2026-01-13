🌟 Website Mutabaah Mahasiswa – STMIK Tazkia

Website Mutabaah Mahasiswa adalah aplikasi berbasis web yang digunakan untuk mencatat dan memantau ibadah harian mahasiswa.
Aplikasi ini membantu:

Mahasiswa mencatat amal harian

Pembina memantau perkembangan ibadah secara digital dan real-time

🎯 Tujuan Aplikasi

Memudahkan pencatatan ibadah harian mahasiswa

Membantu pembina dalam monitoring dan evaluasi

Menggantikan pencatatan manual menjadi sistem digital

🛠️ Persiapan Sebelum Menjalankan

Pastikan di laptop kamu sudah terinstall:

Node.js (versi 16 atau lebih baru)

Git

Visual Studio Code (disarankan)

Akun MongoDB Atlas

💡 Jika belum punya MongoDB Atlas, daftar gratis di website resminya.

🚀 Cara Menjalankan Aplikasi

Ikuti langkah berikut berurutan dari atas ke bawah.

1️⃣ Setup Database (MongoDB Atlas)

Login ke MongoDB Atlas

Buat Cluster

Ambil MongoDB Connection String

Whitelist IP Address:

Masuk ke Network Access

Klik Add IP Address

Masukkan:

0.0.0.0/0

2️⃣ Menjalankan Backend (Server)

Buka folder project menggunakan VS Code

Buka Terminal di VS Code

Masuk ke folder backend:

cd backend


Install semua dependensi:

npm install


Buat file .env di folder backend, lalu isi dengan:

MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/db_name
PORT=3000


Jalankan backend:

npm start


✅ Jika berhasil, backend akan berjalan di port 3000

3️⃣ Menjalankan Frontend (Tampilan Website)

Buka terminal baru (jangan menutup backend)

Masuk ke folder frontend:

cd frontend


Buka file login.html menggunakan:

Live Server (disarankan), atau

Jalankan perintah:

npx live-server login.html


🌐 Website akan terbuka otomatis di browser.

📂 Struktur Folder Proyek
root/
├── backend/    # Server, API, dan koneksi database
└── frontend/   # Tampilan website (HTML, CSS, JavaScript)

⚠️ Catatan Penting

Backend harus dijalankan terlebih dahulu sebelum membuka frontend

Pastikan MongoDB Atlas sudah whitelist IP

Jika backend mati, frontend tidak akan bisa mengambil data

👥 Tim Pengembang

Aisyah

Abdurrahman Fathi Mubarok

Destri Komalasari

Mutiara Adinda