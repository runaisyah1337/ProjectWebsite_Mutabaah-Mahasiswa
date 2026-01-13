# 🌟 Website Mutabaah Mahasiswa - STMIK Tazkia

Aplikasi pemantauan ibadah harian mahasiswa berbasis web. Dibuat untuk memudahkan mahasiswa mencatat amal harian dan membantu Pembina melihat perkembangan statistik secara real-time.

---

## 🛠️ Persiapan Sebelum Menjalankan
Pastikan laptop kamu sudah terinstall:
* **Node.js** (Versi 16 ke atas)
* **Git**
* **VS Code** (Disarankan)

---

## 🚀 Cara Menjalankan di Lokal (Lokal)

Ikuti langkah-langkah ini secara berurutan:

### 1. Persiapan Database (MongoDB Atlas)
Aplikasi ini memerlukan database cloud.
1. Dapatkan **Connection String** dari MongoDB Atlas.
2. Pastikan IP Address kamu sudah di-whitelist (Network Access -> Add IP `0.0.0.0/0`).

### 2. Setup Backend (Server)
Buka Terminal/CMD, salin dan tempel perintah berikut:

```bash
# Masuk ke folder backend
cd backend

# Install semua library yang dibutuhkan
npm install

# Buat file konfigurasi .env (Ganti bagian link_mongodb_kamu)
echo "MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db_name" > .env
echo "PORT=3000" >> .env

# Jalankan server
npm start
Pastikan muncul tulisan: "✅ Terhubung ke Database".

3. Setup Frontend (Tampilan)
Buka terminal baru (jangan matikan terminal backend), lalu jalankan:

Bash

# Masuk ke folder frontend
cd frontend

# Jika menggunakan VS Code, buka login.html dengan Live Server
# Atau jalankan perintah ini jika kamu punya 'live-server' terinstall:
npx live-server login.html
📂 Struktur Folder Proyek
Bash

root/      # Dokumentasi & Git
├── backend/   # Server, API & Database
└── frontend/  # HTML, CSS, JS & Chart.js
⚠️ Catatan Penting
CORS: Backend sudah mengizinkan akses dari frontend.

Database: Whitelist IP Address wajib dilakukan di Dashboard MongoDB Atlas.

👥 Developed by:
Aisyah

Abdurrahman Fathi Mubarok

Destri Komalasari

Mutiara Adinda


---