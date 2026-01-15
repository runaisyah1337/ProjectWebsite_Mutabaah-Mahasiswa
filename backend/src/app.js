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

// 2. Static Files
app.use(express.static(path.join(__dirname, '../public')));

// 3. Catch-all HTML
app.get(/^((?!\/api|.*\..*).)*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));