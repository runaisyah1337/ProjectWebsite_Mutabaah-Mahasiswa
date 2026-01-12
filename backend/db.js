require('dotenv').config(); // Pastikan ini ada agar bisa baca file .env
const mongoose = require('mongoose');

// Ambil URL dari .env
const mongoURI = process.env.MONGO_URI; 

const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log(`✅ Terhubung ke Database: ${mongoose.connection.name}`);
    } catch (err) {
        console.error("❌ Gagal terhubung:", err.message);
    }
};

module.exports = connectDB;