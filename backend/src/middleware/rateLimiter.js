// src/middleware/rateLimiter.js
// SECURITY FIX: Membatasi jumlah request ke endpoint sensitif
// untuk mencegah serangan brute-force dan spamming

const rateLimit = require('express-rate-limit');

// Bypass total saat mode test — mencegah E2E / Integration test
// diblokir setelah percobaan ke-10 (error 429)
const noopMiddleware = (req, res, next) => next();

if (process.env.NODE_ENV === 'test') {
    module.exports = {
        authLimiter: noopMiddleware,
        forgotPasswordLimiter: noopMiddleware
    };
} else {
    // Limiter untuk login & register: max 10 percobaan per 15 menit per IP
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 menit
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            message: "Terlalu banyak percobaan dari IP ini. Silakan coba lagi setelah 15 menit."
        }
    });

    // Limiter untuk forgot-password: max 3 request per 15 menit per IP
    // Lebih ketat karena memicu pengiriman email
    const forgotPasswordLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 menit
        max: 3,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            message: "Terlalu banyak permintaan reset sandi. Silakan coba lagi setelah 15 menit."
        }
    });

    module.exports = { authLimiter, forgotPasswordLimiter };
}
