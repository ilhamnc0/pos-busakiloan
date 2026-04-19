import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const SECRET = process.env.JWT_SECRET || 'busakiloan-super-secret-key';

export const register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    // Enkripsi password sebelum masuk database
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword }
    });
    res.status(201).json({ message: "Akun admin berhasil didaftarkan!" });
  } catch (error) {
    res.status(400).json({ error: "Gagal: Username atau Email mungkin sudah dipakai." });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Email tidak ditemukan di sistem." });

    // Cek kecocokan password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Password yang Anda masukkan salah!" });

    // Buat Tiket Masuk (Token) berlaku 1 Hari
    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '1d' });
    res.json({ token, user: { username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Email tidak terdaftar." });

    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '15m' });
    await prisma.user.update({ where: { email }, data: { resetToken: token } });

    // Setup Pengirim Email (Wajib atur EMAIL_USER & EMAIL_PASS di file .env)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const mailOptions = {
      from: 'Sistem ERP BusaKiloan',
      to: email,
      subject: 'Reset Password Admin BusaKiloan',
      text: `Anda meminta reset password. Berikan token ini ke developer aplikasi Anda, atau atur halaman reset sandi di frontend. Token Anda: ${token}`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Instruksi reset password telah dikirim ke email." });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengirim email. Pastikan koneksi dan file .env sudah diatur." });
  }
};