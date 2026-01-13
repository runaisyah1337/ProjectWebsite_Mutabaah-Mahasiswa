# 🌟 Website Mutabaah Mahasiswa – STMIK Tazkia

Website **Mutabaah Mahasiswa** merupakan aplikasi pemantauan ibadah harian mahasiswa berbasis web.  
Aplikasi ini dirancang untuk membantu **mahasiswa mencatat amal harian** serta memudahkan **Pembina** dalam memantau perkembangan ibadah mahasiswa melalui **statistik real-time**.

---

## ✨ Fitur Utama
- Pencatatan ibadah harian mahasiswa
- Statistik dan visualisasi data ibadah
- Pemantauan perkembangan mahasiswa oleh Pembina
- Aplikasi berbasis web (Frontend & Backend terpisah)

---

## 🛠️ Persiapan Sebelum Menjalankan
Pastikan perangkat kamu telah terpasang:

- **Node.js** (versi 16 atau lebih baru)
- **Git**
- **Visual Studio Code** (disarankan)
- Koneksi internet (untuk MongoDB Atlas)

---

## 🚀 Cara Menjalankan Aplikasi Secara Lokal

Ikuti langkah-langkah berikut **secara berurutan**.

---

### 1️⃣ Persiapan Database (MongoDB Atlas)

Aplikasi ini menggunakan **MongoDB Atlas (Cloud Database)**.

Langkah-langkah:
1. Buat cluster di MongoDB Atlas
2. Salin **Connection String**
3. Pastikan IP Address sudah di-whitelist:
   - Menu: **Network Access**
   - Tambahkan IP: `0.0.0.0/0` (Allow all IP)

---

### 2️⃣ Setup Backend (Server)

Buka Terminal / CMD, lalu jalankan:

```bash
# Masuk ke folder backend
cd backend

# Install semua dependency
npm install

# Buat file konfigurasi environment
echo "MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db_name" > .env
echo "PORT=3000" >> .env

# Jalankan server
npm start
Jika berhasil, akan muncul pesan:

pgsql
Copy code
✅ Terhubung ke Database
3️⃣ Setup Frontend (Tampilan Web)
Buka terminal baru (jangan menutup terminal backend), lalu jalankan:

bash
Copy code
# Masuk ke folder frontend
cd frontend
Kemudian:

Jika menggunakan VS Code → buka login.html menggunakan Live Server

Atau jika sudah menginstall live-server:

bash
Copy code
npx live-server login.html
📂 Struktur Folder Proyek
text
Copy code
root/
├── backend/     # Server, API, dan koneksi Database
└── frontend/    # HTML, CSS, JavaScript, dan Chart.js
⚠️ Catatan Penting
CORS: Backend telah dikonfigurasi agar dapat diakses oleh frontend

Database: IP Address wajib di-whitelist pada MongoDB Atlas agar koneksi berhasil

Pastikan backend berjalan sebelum membuka frontend

👥 Tim Pengembang
Aisyah

Abdurrahman Fathi Mubarok

Destri Komalasari

Mutiara Adinda

📌 Penutup
Aplikasi ini dikembangkan sebagai bagian dari proyek akademik di STMIK Tazkia.
Diharapkan dapat membantu meningkatkan kedisiplinan dan monitoring ibadah mahasiswa secara digital.