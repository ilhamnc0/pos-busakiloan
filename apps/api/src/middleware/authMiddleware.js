import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'busakiloan-super-secret-key';

export const verifyToken = (req, res, next) => {
  let token = null;

  // 1. Cek Token dari Header (Digunakan oleh Axios/Frontend secara diam-diam)
  const authHeader = req.header('Authorization');
  if (authHeader) {
    token = authHeader.split(' ')[1]; // Format: "Bearer <token>"
  } 
  // 2. Cek Token dari URL Query (Digunakan KHUSUS untuk link Download Excel)
  else if (req.query.token) {
    token = req.query.token;
  }

  // Jika tidak ada token dari kedua jalur di atas, TOLAK!
  if (!token) return res.status(401).json({ error: "Akses Ditolak. Token tidak ditemukan." });

  try {
    // Verifikasi token, jika asli masukkan data user ke request
    const verified = jwt.verify(token, SECRET);
    req.user = verified; // Isinya: { userId: 1, ... }
    next(); // Silakan lewat ke Controller
  } catch (error) {
    res.status(401).json({ error: "Token tidak valid atau sudah kedaluwarsa. Silakan login ulang." });
  }
};