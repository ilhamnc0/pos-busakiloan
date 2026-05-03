import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const SECRET = process.env.JWT_SECRET || 'busakiloan-super-secret-key';

// FITUR REGISTER DIHAPUS

// ==============================
// 1. LOGIN
// ==============================
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Akun tidak ditemukan" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Password salah" });

    const token = jwt.sign({ userId: user.id, username: user.username }, SECRET, { expiresIn: '24h' });
    res.json({ message: "Login sukses", token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==============================
// 2. LUPA PASSWORD (Kirim Email)
// ==============================
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) return res.status(404).json({ error: "Email tidak terdaftar di sistem." });

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
       return res.status(500).json({ error: "Sistem belum membaca kredensial email. Hubungi teknisi." });
    }

    const resetToken = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '15m' });
    await prisma.user.update({ where: { id: user.id }, data: { resetToken } });

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: `"BusaKiloan ERP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Password Anda - BusaKiloan',
      html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f7f6; text-align: center;"><div style="max-w: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><h2 style="color: #2563eb;">Reset Password</h2><p style="color: #4b5563; line-height: 1.6;">Klik tombol di bawah ini untuk membuat sandi baru.</p><a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">Buat Password Baru</a></div></div>`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Email reset password telah berhasil dikirim! Silakan cek kotak masuk Anda." });
  } catch (error) {
    res.status(500).json({ error: `Gagal diproses. Detail: ${error.message}` });
  }
};

// ==============================
// 3. RESET PASSWORD (Simpan Sandi Baru)
// ==============================
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, SECRET);
    const user = await prisma.user.findFirst({ where: { id: decoded.userId, resetToken: token } });
    if (!user) return res.status(400).json({ error: "Token tidak valid atau sudah pernah digunakan." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword, resetToken: null }
    });

    res.json({ message: "Password berhasil diubah! Silakan login dengan sandi baru Anda." });
  } catch (error) {
    res.status(400).json({ error: "Link reset password sudah kedaluwarsa atau tidak valid." });
  }
};