const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Mutiara123',      // isi jika MySQL kamu pakai password
  database: 'db_mahasiswa'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Koneksi gagal:', err);
  } else {
    console.log('✅ MySQL terhubung ke db_mahasiswa');
  }
});

module.exports = db;
