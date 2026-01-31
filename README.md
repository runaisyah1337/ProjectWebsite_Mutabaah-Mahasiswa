# 📚 SISTEM MONITORING MUTABA'AH MAHASISWA - STMIK TAZKIA
Aplikasi pemantauan amalan ibadah harian mahasiswa berbasis web. Dirancang untuk memudahkan evaluasi spiritual secara mandiri dan transparan antara mahasiswa, pembina, dan admin.

## 🚀 FITUR UTAMA
**DASHBOARD DINAMIS**: Menampilkan periode minggu berjalan secara otomatis.

**VISUALISASI DATA**: Grafik persentase capaian amalan yang interaktif menggunakan Chart.js.

**REKAPAN & RIWAYAT**: Mahasiswa dapat melihat kembali catatan amalan yang telah diisi sebelumnya.

**MULTI-USER**: Sistem login terpisah untuk Mahasiswa, Pembina, dan Admin.

## 🛠️ PANDUAN INSTALASI & PERSIAPAN
Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi di lingkungan lokal (laptop) Anda.

### 1. PRASYARAT
Pastikan laptop Anda sudah terinstal:

* Node.js (Versi LTS)

* Git (Untuk melakukan push ke GitHub)

* Koneksi Internet (Karena database menggunakan MongoDB Atlas)

### 2. CLONE & INSTALASI
Buka terminal atau CMD, lalu jalankan perintah berikut:

* Clone proyek dari GitHub
```bash
git clone https://github.com/runaisyah1337/ProjectWebsite_Mutabaah-Mahasiswa
```
* Masuk ke folder proyek
```bash
cd ProjectWebsite_Mutabaah-Mahasiswa
```
```bash
cd backend
```
* Instal semua library (dependencies)
```bash
npm install
```

### 3. KONFIGURASI DATABASE (MONGODB ATLAS)
Buat file bernama `.env` di dalam folder utama proyek (sejajar dengan file `package.json`). Masukkan kode berikut:

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mutabaah_db
JWT_SECRET=rahasia_tazkia_2026
```

**PENTING**: Pastikan Anda sudah mengatur Network Access di MongoDB Atlas menjadi "Allow Access from Anywhere" (0.0.0.0/0) agar koneksi dari laptop lokal tidak diblokir.

### 4. MENJALANKAN APLIKASI

* Jalankan server
```bash
npm start
```
Buka browser dan akses: http://localhost:3000

## 📖 PANDUAN PENGGUNAAN (USER MANUAL)
### **A. MAHASISWA AREA**
LOGIN: Masuk menggunakan email dan password yang terdaftar.

ISI MUTABA'AH: Klik tombol "Isi Sekarang". Isi sesuai dengan capaian amalan Anda.

MONITORING: Cek menu "Grafik" untuk melihat persentase keberhasilan ibadah Anda minggu ini.

LOG OUT: Tekan tombol keluar dan konfirmasi pada jendela pesan yang muncul.

### **B. ADMIN AREA**
PANTAU STATISTIK: Lihat grafik global mahasiswa untuk mengetahui tren ibadah di kampus.

INDIKATOR WARNA:

🟢 HIJAU: Capaian ≥ 85% (Sangat Baik)

🟡 KUNING: Capaian 50% - 84% (Perlu Ditingkatkan)

🔴 MERAH: Capaian < 50% (Perlu Perhatian/Pembinaan)

### **C. ADMIN AREA**
- Memantau perkembangan anak binaan

- Melihat rekap mutaba'ah per minggu

## 📂 STRUKTUR PROYEK
```bash
public/ : Berisi file frontend (HTML, CSS, Assets).

public/js/ : Berisi logika JavaScript (Dashboard, Grafik, Main).

models/ : Definisi skema data (Database Schema).

routes/ : Pengaturan endpoint API.

server.js : File utama penggerak backend.
```

## 👥 Tim Pengembang

* Aisyah

* Abdurrahman Fathi Mubarok

* Destri Komalasari

* Mutiara Adinda

## 📞 Kontak & Kontribusi

Jika menemukan bug atau ingin mengembangkan fitur, silakan hubungi tim pengembang atau lakukan kontribusi melalui repository ini.
