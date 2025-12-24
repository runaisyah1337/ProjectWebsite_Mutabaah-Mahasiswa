const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Mutiara123', // Masukkan password MySQL Anda
    database: 'db_mahasiswa' // Pastikan nama database sudah benar
});

db.connect((err) => {
    if (err) {
        // Error 'Access denied' biasanya karena password di atas salah
        console.error('❌ Gagal terhubung ke MySQL:', err.message);
        return;
    }
    console.log('✅ Database MySQL Terhubung ke db_mahasiswa');
});
// Endpoint Daftar
app.post("/register", (req, res) => {
  const { nama, peran, kode_unik, email, password } = req.body;
  const sql = "INSERT INTO users (nama, role, kode_unik, email, password) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [nama, peran, kode_unik, email, password], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Pendaftaran berhasil!" });
  });
});

// Endpoint Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) {
      res.json({ message: "Login Berhasil", user: results[0] });
    } else {
      res.status(401).json({ error: "Email atau Password salah" });
    }
  });
});

app.listen(3000, () => console.log("🚀 Server berjalan di http://localhost:3000"));

// Contoh script simpan data di app.js
app.post('/simpan-mutabaah', (req, res) => {
    const { nama, sholat, tilawah } = req.body;
    const query = "INSERT INTO tabel_mutabaah (nama, sholat, tilawah, tanggal) VALUES (?, ?, ?, NOW())";
    
    db.query(query, [nama, sholat, tilawah], (err, result) => {
        if (err) {
            console.error("❌ Gagal simpan ke MySQL:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "✅ Data berhasil disimpan!" });
    });
});

function doGet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var result = [];
    
    // Mulai dari baris ke-2 (i=1) supaya judul kolom tidak ikut terbawa
    for (var i = 1; i < data.length; i++) {
      result.push({
        tanggal: data[i][0], // Kolom A
        nim:     data[i][1], // Kolom B
        nama:    data[i][2], // Kolom C
        tilawah: data[i][3], // Kolom D
        sholat:  data[i][4]  // Kolom E
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Jika ada error di spreadsheet, dia akan kasih tahu di browser
    return ContentService.createTextOutput(JSON.stringify({"error": error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}