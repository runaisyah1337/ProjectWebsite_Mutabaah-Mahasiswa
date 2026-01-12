const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Daftarkan semua rute terlebih dahulu
router.post('/register', authController.register);
router.post('/login', authController.login);

// Export HANYA SEKALI di baris paling bawah
module.exports = router;