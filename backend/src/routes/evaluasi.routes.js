const express = require('express');
const router = express.Router();
const evaluasiController = require('../controllers/evaluasi.controller');
const auth = require('../middleware/auth'); // PASTIKAN BARIS INI ADA

<<<<<<< HEAD
// Baris ini biasanya yang menyebabkan error jika evaluasiController.handleWebhook typo
=======
// SECURITY FIX: Menambahkan middleware 'auth' agar endpoint webhook terlindungi JWT
>>>>>>> origin/main
router.post('/webhook', auth, evaluasiController.handleWebhook);

// Baris 10: Pastikan 'auth' dan 'evaluasiController.getStats' BUKAN undefined
router.get('/stats', auth, evaluasiController.getStats); 
// Tambahkan baris ini di routes/evaluasi.routes.js
router.get('/all-stats', auth, evaluasiController.getAllStats);

module.exports = router;
