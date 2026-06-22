// src/app.js
require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const evaluasiRoutes = require('./routes/evaluasi.routes');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// 1. Routes API
app.use('/api/auth', authRoutes);
app.use('/api/evaluasi', evaluasiRoutes);

// 2. Test Helper Routes — HANYA aktif saat NODE_ENV === 'test'
// ⚠️  Endpoint ini TIDAK BOLEH aktif di production/development
if (process.env.NODE_ENV === 'test') {
    const testHelperRoutes = require('./routes/testHelper.routes');
    app.use('/api/test', testHelperRoutes);
}

// 3. Static Files
app.use(express.static(path.join(__dirname, '../public')));

// 4. Catch-all HTML
app.get(/^((?!\/api|.*\..*).)*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
}
module.exports = app;