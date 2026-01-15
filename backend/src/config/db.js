const mongoose = require('mongoose');
const path = require('path'); // Tambahkan ini agar lebih aman

// Mengarahkan ke .env yang ada di folder 'backend' (keluar 2 tingkat dari src/config)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); 

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGO_URI tidak terbaca di .env! Periksa path filenya.");
        }
        await mongoose.connect(uri);
        console.log('✅ Terhubung ke Database: ' + mongoose.connection.name);
    } catch (err) {
        console.error('❌ Gagal terhubung:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;