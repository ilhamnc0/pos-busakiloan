# 📦 BusaKiloan ERP System v2.0
Sistem Perencanaan Sumber Daya Perusahaan (ERP) terpadu untuk mengelola stok, penjualan, hutang-piutang, arus kas, dan profit harian BusaKiloan.

---

## 🛠️ CARA MEMBUAT AKUN LOGIN BARU (BACA INI DULU!)
Demi keamanan tingkat tinggi, fitur "Daftar Akun" (Register) di halaman depan telah dihilangkan agar orang asing tidak bisa sembarangan masuk. 

**Untuk membuat akun Admin/Kasir baru, ikuti 4 langkah mudah ini:**

1. Buka folder proyek BusaKiloan di aplikasi **VSCode** (atau aplikasi teks editor lainnya).
2. Buka folder `apps/api` dan cari file bernama **`tambah-user.js`**.
3. Buka file tersebut, lalu ubah 3 baris data ini sesuai dengan karyawan baru yang ingin ditambahkan:
   ```javascript
   const usernameBaru = "nama_kasir_baru";
   const emailBaru = "emailkasir@busakiloan.com";
   const passwordBaru = "sandi12345";