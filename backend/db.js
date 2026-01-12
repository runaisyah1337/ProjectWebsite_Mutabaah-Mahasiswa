const mongoose = require('mongoose');

// Gunakan nama 'projectmutabaah' tepat sebelum tanda tanya (?)
const mongoURI = "mongodb+srv://aisyahnasution3300_db_user:proyek4matkul@proyekita.pwydp0t.mongodb.net/projectmutabaah?retryWrites=true&w=majority";

const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI);
        // Tambahkan baris ini untuk memverifikasi nama database di terminal
        console.log(`✅ Terhubung ke Database: ${mongoose.connection.name}`);
    } catch (err) {
        console.error("❌ Gagal terhubung:", err.message);
    }
};

module.exports = connectDB;