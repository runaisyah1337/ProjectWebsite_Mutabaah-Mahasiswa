const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) return res.status(401).json({ message: "Akses ditolak, token tidak ada" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // --- BARIS PALING PENTING ---
        // Pastikan 'decoded' berisi 'nim'. Jika di JWT kamu pakai 'id', sesuaikan di sini.
        req.user = decoded; 
        // ----------------------------
        next();
    } catch (err) {
        res.status(401).json({ message: "Token tidak valid" });
    }
};