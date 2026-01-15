📚 Sistem Monitoring Mutaba'ah Mahasiswa - STMIK Tazkia
Aplikasi berbasis web untuk memantau aktivitas ibadah harian mahasiswa secara real-time. Dilengkapi dengan grafik analisis progres dan sistem indikator periode otomatis.

🚀 Fitur Utama
Dashboard Mahasiswa: Indikator minggu berjalan otomatis (Minggu ke-, Bulan, Tahun).

Grafik Dinamis: Visualisasi persentase capaian amalan menggunakan Chart.js.

Monitoring Admin: Pantau statistik global amalan mahasiswa dengan indikator warna (Hijau/Kuning/Merah).

Keamanan: Autentikasi aman menggunakan JSON Web Token (JWT).

🛠️ Panduan Instalasi (Langkah demi Langkah)
Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi di komputer lokal Anda.

Langkah 1: Instalasi Database (MongoDB)
Aplikasi ini membutuhkan MongoDB sebagai penyimpanan data.

Unduh MongoDB Community Server di mongodb.com/try/download/community.

Instal seperti biasa. Pada saat instalasi, pastikan centang "Install MongoDB as a Service".

Unduh dan instal MongoDB Compass (opsional) untuk melihat data secara visual.

Pastikan MongoDB sudah berjalan. Buka terminal/CMD dan ketik:

Bash

mongosh
(Jika masuk ke shell MongoDB, berarti instalasi berhasil).

Langkah 2: Persiapan Lingkungan Node.js
Pastikan Anda sudah menginstal Node.js (Versi LTS direkomendasikan).

Clone repository ini:

Bash

git clone https://github.com/username/mutabaah-tazkia.git
cd mutabaah-tazkia
Instal semua library yang dibutuhkan:

Bash

npm install
Langkah 3: Konfigurasi Environment (.env)
Buat file baru bernama .env di folder utama (root) proyek dan masukkan kode berikut:

Cuplikan kode

PORT=3000
MONGO_URI=mongodb://localhost:27017/mutabaah_db
JWT_SECRET=rahasia_tazkia_2026
Langkah 4: Menjalankan Aplikasi
Jalankan server:

Bash

npm start
Atau jika menggunakan nodemon:

Bash

npm run dev
Buka browser dan akses: http://localhost:3000

📖 Panduan Penggunaan (User Manual)
1. Peran Mahasiswa
Login: Gunakan kredensial yang diberikan.

Isi Mutaba'ah: Klik "Isi Sekarang" untuk menginput amalan mingguan.

Pantau Grafik: Lihat progres perkembangan ibadah Anda di menu "Grafik".

Peringatan: Segera isi form jika indikator periode sudah berwarna Merah (Sabtu/Minggu).

2. Peran Admin
Monitoring: Lihat statistik rata-rata amalan seluruh mahasiswa.

Analisis Warna:

🟢 Hijau (≥ 85%): Amalan sangat baik.

🟡 Kuning (50-84%): Perlu ditingkatkan.

🔴 Merah (< 50%): Perlu pembinaan khusus.

3. Peran Pembina
Monitoring:Memantau perkembangan anak binaan melalui rekapan perminggu

📂 Struktur Folder
public/: File frontend (HTML, CSS, JS, Assets).

models/: Skema database MongoDB.

routes/: Jalur API (Endpoint).

js/: Logika frontend yang telah dipisah (Main, Dashboard, Grafik).

server.js: File utama backend.

📞 Kontak & Kontribusi
Jika ditemukan kendala atau ingin melakukan pengembangan fitur, silakan hubungi tim kami.

Developed by : - Aisyah
               - Abdurrahman Fathi Mubarok
               - Destri Komalasari
               - Mutiara Adinda