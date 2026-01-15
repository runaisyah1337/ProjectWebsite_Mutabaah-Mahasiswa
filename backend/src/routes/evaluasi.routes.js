const express = require('express');
const router = express.Router();
const evaluasiController = require('../controllers/evaluasi.controller');
const auth = require('../middleware/auth'); // PASTIKAN BARIS INI ADA

// Baris ini biasanya yang menyebabkan error jika evaluasiController.handleWebhook typo
router.post('/webhook', evaluasiController.handleWebhook);

// Baris 10: Pastikan 'auth' dan 'evaluasiController.getStats' BUKAN undefined
router.get('/stats', auth, evaluasiController.getStats); 
// Tambahkan baris ini di routes/evaluasi.routes.js
router.get('/all-stats', auth, evaluasiController.getAllStats);

module.exports = router;
