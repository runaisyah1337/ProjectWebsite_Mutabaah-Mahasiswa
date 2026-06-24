// File ini berfungsi untuk mengatur "database bayangan" di memori (RAM) saat testing berjalan.
// Kita menggunakan database khusus di memori agar testing tidak mengotori atau merusak data asli di database produksi/development.

const mongoose = require('mongoose');
// MongoMemoryServer adalah library yang mensimulasikan MongoDB di dalam memori komputer kita.
// Database ini akan dibuat secara otomatis saat test dimulai dan langsung dihapus saat test selesai.
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Fungsi ini digunakan untuk membuat koneksi ke database memori sebelum semua test dimulai.
 * Kita panggil fungsi ini di dalam hook `beforeAll` pada file test kita.
 */
module.exports.connect = async () => {
    // 1. Nyalakan server MongoDB bayangan di memori
    mongoServer = await MongoMemoryServer.create();
    // 2. Dapatkan alamat koneksi (URI) dari server bayangan tersebut
    const uri = mongoServer.getUri();
    // 3. Hubungkan mongoose (ODM MongoDB) ke alamat koneksi tersebut
    await mongoose.connect(uri);
};

/**
 * Fungsi ini digunakan untuk menutup koneksi database dan mematikan server memori setelah semua test selesai.
 * Kita panggil fungsi ini di dalam hook `afterAll`.
 */
module.exports.closeDatabase = async () => {
    // 1. Hapus database bayangan
    await mongoose.connection.dropDatabase();
    // 2. Tutup koneksi Mongoose
    await mongoose.connection.close();
    // 3. Matikan server MongoDB bayangan
    await mongoServer.stop();
};

/**
 * Fungsi ini digunakan untuk membersihkan (menghapus) semua data di dalam setiap tabel/koleksi database.
 * Ini biasanya dipanggil setelah setiap satu pengujian (`afterEach`) selesai berjalan,
 * sehingga pengujian berikutnya dimulai dengan database yang bersih tanpa ada sisa data dari pengujian sebelumnya.
 */
module.exports.clearDatabase = async () => {
    const collections = mongoose.connection.collections;
    // Lakukan perulangan untuk setiap koleksi (tabel) yang ada di database, lalu hapus semua datanya
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
};
