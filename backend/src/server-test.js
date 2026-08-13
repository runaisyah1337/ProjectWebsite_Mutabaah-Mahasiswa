// backend/src/server-test.js
// Script startup khusus untuk E2E test
// Menginisialisasi MongoMemoryServer + Mongoose, lalu start Express

// Inject variabel test sebelum load apapun
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_mutabaah_e2e_2026';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

async function startTestServer() {
    // 1. Start MongoDB in-memory
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // 2. Hubungkan Mongoose ke in-memory DB
    await mongoose.connect(mongoUri);
    console.log('✅ MongoMemoryServer terhubung di:', mongoUri);

    // 3. Load dan start Express app
    // app.js sudah tidak memanggil connectDB() saat NODE_ENV=test
    // sehingga aman di-require setelah koneksi manual di atas
    const app = require('./app');

    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
        console.log(`🚀 Test server berjalan di http://localhost:${PORT}`);
    });

    // Handle shutdown bersih (dari SIGTERM di global-teardown.js)
    const cleanup = async () => {
        console.log('\n🛑 Menerima signal shutdown...');
        server.close(async () => {
            await mongoose.connection.dropDatabase();
            await mongoose.connection.close();
            await mongoServer.stop();
            console.log('✅ Test server dihentikan dengan bersih.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
}

startTestServer().catch(err => {
    console.error('❌ Gagal start test server:', err);
    process.exit(1);
});
