import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function buatAkunManual() {
  // GANTI DATA DI BAWAH INI SESUAI KEINGINAN ANDA
  const usernameBaru = "admin";
  const emailBaru = "admin@busakiloan.com";
  const passwordBaru = "#16BusaKiloan";

  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username: usernameBaru }, { email: emailBaru }] }
    });

    if (existingUser) {
      console.log("❌ Gagal: Username atau Email sudah terdaftar di database.");
      process.exit(1);
    }

    // Proses hashing menggunakan bcrypt
    const hashedPassword = await bcrypt.hash(passwordBaru, 10);

    await prisma.user.create({
      data: {
        username: usernameBaru,
        email: emailBaru,
        password: hashedPassword
      }
    });

    console.log(`✅ BERHASIL! Akun '${usernameBaru}' siap digunakan untuk login.`);
  } catch (error) {
    console.error("❌ Terjadi kesalahan:", error);
  } finally {
    await prisma.$disconnect();
  }
}

buatAkunManual();