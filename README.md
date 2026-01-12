# 🌟 Website Mutabaah Mahasiswa - STMIK Tazkia

Aplikasi berbasis web untuk memudahkan mahasiswa dalam mencatat dan memantau ibadah harian (Mutabaah). Sistem ini juga membantu admin dan pembina untuk melihat statistik perkembangan spiritual mahasiswa secara real-time.

## 🚀 Fitur Utama
- **Login & Register**: Sistem autentikasi aman untuk Mahasiswa, Admin, dan Pembina.
- **Input Mutabaah**: Form harian yang user-friendly untuk mencatat progres ibadah.
- **Visualisasi Data**: Grafik perkembangan menggunakan Chart.js.
- **Dashboard Admin/Pembina**: Pemantauan statistik anak binaan dengan indikator warna (Merah untuk skor rendah/belum isi).
- **Keamanan**: Fitur eye-toggle (intip sandi) yang interaktif dan penggunaan Environment Variables (.env).

## 🛠️ Teknologi (Tech Stack)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js & Express.js
- **Database**: MongoDB Atlas (Cloud)
- **Library**: mongoose, dotenv, cors

## 📦 Cara Instalasi & Menjalankan di Lokal

1. **Clone Repository**
   git clone https://github.com/runaisyah1337/ProjectWebsite_Mutabaah-Mahasiswa.git

2. **Setup Backend**
   Masuk ke folder backend, lalu jalankan:
   npm install

3. **Konfigurasi Environment (.env)**
   Buat file .env di dalam folder backend dan isi:
   MONGO_URI=isi_dengan_url_mongodb_atlas_kamu
   PORT=3000

4. **Jalankan Aplikasi**
   npm start

5. **Akses Frontend**
   Buka file frontend/login.html melalui browser.

---
Dikembangkan oleh:- Aisyah
                  - Abdurrahman Fathi Mubarok
                  - Destri Komalasari
                  - Mutiara Adinda