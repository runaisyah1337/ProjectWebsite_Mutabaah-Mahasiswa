# 🌟 Website Mutabaah Mahasiswa - STMIK Tazkia

Aplikasi pemantauan ibadah harian mahasiswa berbasis web. Dibuat untuk memudahkan mahasiswa mencatat amal harian dan membantu Pembina melihat perkembangan statistik secara real-time.

---

## 🛠️ Persiapan Sebelum Menjalankan
Sebelum memulai, pastikan laptop kamu sudah terinstall:
1. **Node.js** (Versi 16 ke atas)
2. **Git**
3. **Browser** (Chrome/Edge/Firefox)

---

## 🚀 Cara Menjalankan di Laptop (Lokal)

Ikuti langkah-langkah ini secara berurutan:

### 1. Persiapan Database (MongoDB Atlas)
Aplikasi ini memerlukan database cloud. 
- Pastikan kamu sudah punya akun di MongoDB Atlas.
- Dapatkan **Connection String** (Contoh: mongodb+srv://user:pass@cluster.mongodb.net/db_name).

### 2. Setup Backend (Server)
Buka Terminal/CMD, lalu ketik perintah berikut:

# Masuk ke folder backend
cd backend

# Install semua library yang dibutuhkan
npm install

# Buat file .env di dalam folder backend
# Isi file tersebut dengan:
MONGO_URI=isi_dengan_connection_string_atlas_kamu
PORT=3000

# Jalankan servernya
npm start

*Jika muncul tulisan "✅ Terhubung ke Database", berarti server sudah jalan.*

### 3. Setup Frontend (Tampilan)
- Jangan tutup terminal backend yang sedang berjalan.
- Masuk ke folder `frontend`.
- Cari file **login.html**.
- Klik kanan, lalu pilih "Open with Live Server" (jika pakai VS Code) atau langsung klik 2x untuk membuka di Browser.

---

## 📂 Struktur Folder Proyek
- root/: Berisi dokumentasi (README) dan pengaturan Git (.gitignore).
- backend/: Server Node.js, koneksi database, dan logika API.
- frontend/: File tampilan (HTML, CSS, JS) dan grafik Chart.js.

---

## ⚠️ Catatan Penting
- **CORS**: Pastikan backend sudah mengizinkan akses dari frontend agar data bisa tampil.
- **Database**: Pastikan IP Address kamu sudah di-whitelist di Dashboard MongoDB Atlas (Network Access) agar koneksi tidak ditolak.

---
Developed by :- Aisyah
              - Abdurrahman Fathi Mubarok
              - Destri Komalasari
              - Mutiara Adinda