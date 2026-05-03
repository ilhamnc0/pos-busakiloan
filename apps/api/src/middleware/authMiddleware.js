import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'busakiloan-super-secret-key';

export const verifyToken = (req, res, next) => {
  let token = null;

  const authHeader = req.header('Authorization');
  if (authHeader) {
    token = authHeader.split(' ')[1]; 
  } 
  else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) return res.status(401).json({ error: "Akses Ditolak. Token tidak ditemukan." });

  try {
    const verified = jwt.verify(token, SECRET);
    
    // TRICK MASTER DATA: 
    // Apapun akun yang login (entah ID 2, 3, atau 4), sistem dipaksa menganggap 
    // mereka sedang mengakses data milik Master (User ID 1).
    // Dengan ini, SEMUA akun bisa berkolaborasi di satu database yang sama!
    req.user = { ...verified, userId: 1 }; 
    
    next();
  } catch (error) {
    res.status(401).json({ error: "Token tidak valid atau sudah kedaluwarsa. Silakan login ulang." });
  }
};