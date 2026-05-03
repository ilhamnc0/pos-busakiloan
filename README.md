# 📦 BusaKiloan ERP System v2.0

Sistem Perencanaan Sumber Daya Perusahaan (ERP) terpadu untuk mengelola stok, penjualan, hutang-piutang, arus kas, dan profit harian BusaKiloan.

---

## 🚀 CARA MENJALANKAN SISTEM DI LOCALHOST

Sistem ini terbagi menjadi dua bagian: **Frontend (React/Vite)** dan **Backend (Node.js/Express)**. Anda harus menjalankan keduanya secara bersamaan.

### 1. Persiapan Awal (Install Dependencies)
Buka terminal di dalam VSCode, lalu jalankan perintah ini untuk menginstal semua *library* yang dibutuhkan:
```bash
# Buka tab terminal ke-1 (Untuk Backend)
cd apps/api
npm install

# Buka tab terminal ke-2 (Untuk Frontend)
cd apps/web
npm install
2. Konfigurasi Database Lokal (PostgreSQL)
Jika sebelumnya Anda menggunakan Supabase (Cloud) dan ingin memindahkannya ke komputer lokal (menggunakan pgAdmin atau PostgreSQL lokal), ikuti langkah berikut:

Buka aplikasi pgAdmin di komputer Anda, lalu buat database baru (Misalnya beri nama: busakiloan_db).

Buka file .env yang berada di dalam folder apps/api.

Ubah tulisan DATABASE_URL menjadi format lokal seperti ini:

Cuplikan kode
# Format: postgresql://USER:PASSWORD@localhost:5432/NAMA_DATABASE
DATABASE_URL="postgresql://postgres:password_anda@localhost:5432/busakiloan_db?schema=public"
(Ganti postgres dengan username pgAdmin Anda, dan password_anda dengan password pgAdmin Anda).

Setelah disave, buka terminal di folder apps/api lalu jalankan perintah sinkronisasi database:

Bash
npx prisma db push
3. Menjalankan Server
Setelah database siap, saatnya menyalakan sistem:

Bash
# Di tab terminal ke-1 (apps/api), ketik:
npm run dev
# (Akan muncul tulisan: Server BE jalan di port 5000)

# Di tab terminal ke-2 (apps/web), ketik:
npm run dev
# (Akan muncul tulisan: Local: http://localhost:5173/)
Buka browser Anda dan ketik http://localhost:5173 untuk masuk ke aplikasi.

🛠️ CARA MEMBUAT AKUN LOGIN BARU
Demi keamanan tingkat tinggi, fitur "Daftar Akun" (Register) di halaman depan telah dihilangkan agar orang asing tidak bisa sembarangan masuk.

Untuk membuat akun Admin/Kasir baru, ikuti 4 langkah mudah ini:

Buka folder proyek BusaKiloan di aplikasi VSCode.

Buka folder apps/api dan cari file bernama tambah-user.js.

Buka file tersebut, lalu ubah 3 baris data ini sesuai dengan karyawan baru yang ingin ditambahkan:

JavaScript
const usernameBaru = "nama_kasir_baru";
const emailBaru = "emailkasir@busakiloan.com";
const passwordBaru = "sandi12345";
Jangan lupa di-Save (Ctrl+S).

Buka Terminal di VSCode (arahkan ke folder apps/api), lalu ketik perintah berikut:

Bash
node tambah-user.js
Jika berhasil, akan muncul tulisan "✅ BERHASIL! Akun siap digunakan.". Karyawan sudah bisa login menggunakan email dan password tersebut.

📖 PANDUAN PENGGUNAAN FITUR (MENU)
Sistem ini didesain agar otomatis. Setiap Anda membuat transaksi (Order/Beli), sistem akan otomatis memotong/menambah stok, menghitung hutang, dan mencatat arus kas. Berikut adalah fungsi dari tiap menu:

1. 📊 Dashboard Utama
Halaman ringkasan. Di sini Anda bisa melihat Total Kas saat ini, Omset, Profit Bersih, Piutang yang belum dibayar, Grafik Omset, serta Daftar Antrean Order yang harus segera dikirim hari ini.

2. 🛒 Buat Order & Rekap Transaksi
Order Baru: Klik tombol "Order Baru" untuk masuk ke sistem Kasir. Pilih pelanggan, masukkan barang, tentukan ongkir, ongkir supir, dan DP.

Rekap Transaksi: Melihat seluruh nota penjualan. Anda bisa mengubah status barang (Dikirim, Terkirim, Selesai), mengedit nota, menghapus, atau mencetak struk.

3. 👥 Data Pelanggan
Menyimpan nama, alamat, dan kontak pelanggan.

Harga Khusus: Anda bisa memberikan harga "Diskon/Reseller" permanen untuk produk tertentu pada pelanggan tertentu. Saat pelanggan ini berbelanja di kasir, harganya akan otomatis berubah.

Rank Profit (Klasemen): Fitur untuk melihat daftar urutan pelanggan mana yang memberikan untung (profit bersih) paling besar untuk perusahaan di rentang bulan tertentu.

4. 🚚 Data Sopir & Ongkir
Menyimpan data supir dan daftar tarif wilayah. (Contoh: Supir Y untuk area Sleman = Rp 100.000). Ini memudahkan referensi harga saat membuat order di Kasir.

5. 📦 Stok & Produk (Master Data)
Pusat kendali barang Anda (Busa, Bantal, dll).

HPP Otomatis: Jika Anda membeli barang dari Pabrik, sistem akan otomatis menghitung rata-rata Modal (HPP) untuk Anda.

Sub-Produk: Anda bisa membuat produk turunan. Jika harga HPP produk Induk berubah, maka HPP produk anak akan ikut disesuaikan.

Jika stok menyentuh angka 5 ke bawah, angkanya akan berubah menjadi merah (Peringatan Stok Kritis).

6. 🔄 Mutasi Produk
Kartu riwayat pergerakan fisik barang. Semua barang yang bertambah (karena beli dari pabrik) atau berkurang (karena laku dibeli pelanggan) akan tercatat di sini beserta detiknya.

7. 📒 Hutang & Piutang
Halaman khusus untuk menagih janji!

Piutang Customer: Daftar nota pelanggan yang belum lunas. Klik "Update Bayar" jika pelanggan mentransfer sisa uangnya.

Hutang Pabrik: Daftar hutang perusahaan ke supplier. Klik "Bayar Hutang" jika Anda mentransfer angsuran ke pabrik.

Uang yang dibayar di sini akan langsung masuk/keluar ke Buku Kas di hari yang bersangkutan!

8. 🏢 Database Supplier (Barang Masuk)
Tempat mendaftarkan pabrik/vendor.

Di sini Anda wajib melakukan "Input Barang Masuk (Restock)".

Saat Anda klik Restock: Stok di menu Produk akan bertambah, nilai HPP (Modal) akan dihitung ulang secara akurat, dan Tagihan akan masuk ke Hutang Pabrik.

9. 💰 Buku Kas & Keuangan
Arus kas (Cashflow) otomatis perusahaan.

Semua uang muka (DP), pelunasan pelanggan, dan pembayaran hutang pabrik akan otomatis tercatat di sini.

Input Manual: Gunakan tombol ini untuk mencatat uang keluar/masuk di luar sistem order (Contoh: Gaji Karyawan, Beli Bensin, Beli Alat, dll).

Catatan: Jika Anda menghapus transaksi pelunasan di sini, Sisa Hutang/Piutang di nota aslinya akan otomatis kembali (membengkak).

10. 📈 Laba & Profit
Halaman yang paling ditunggu bos! Menampilkan Laporan Laba Bersih yang sangat akurat.

Perhitungannya = (Harga Jual Asli - Modal HPP Asli) + (Ongkos Kirim Tagihan - Ongkos Kirim Supir).

Catatan: Jika ada barang yang HPP/Modalnya masih Rp 0, sistem akan menangguhkan profit barang tersebut sampai Anda memperbaiki modalnya agar laporan keuangan tidak palsu/bocor.

11. ⚙️ Manajemen Data (Database)
Export Excel: Anda bisa mendownload seluruh laporan (Pelanggan, Stok, Penjualan, Buku Kas, dll) ke dalam format Excel (.xlsx) dengan rapi berdasarkan bulan/tahun.

Hapus Transaksi Permanen: Fitur untuk menghapus riwayat order/kas tahun-tahun lama agar memori database tetap ringan dan cepat (Fitur Berbahaya).

🔑 TROUBLESHOOTING (PEMECAHAN MASALAH)
Q: Saya Lupa Password, apa yang harus dilakukan?
A: Di halaman Login, klik tulisan "Lupa Password?". Masukkan Email Anda. Sistem akan mengirimkan link khusus ke email Anda untuk membuat password baru. (Syarat: Fitur email SMTP di file .env backend harus sudah dikonfigurasi dengan akun Google App Password).

Q: Saya sudah update pembayaran Piutang, tapi kenapa di halaman "Laba & Profit" angkanya tidak bertambah?
A: Halaman "Laba & Profit" menghitung omset bukan berdasarkan kapan dia lunas, melainkan berdasarkan "Tanggal Nota/Order" dibuat. Ini adalah standar akuntansi agar laporan per bulan tetap utuh. Untuk melihat uang riil yang masuk hari ini, silakan cek halaman Buku Kas.

Q: Saat mau Hapus Kategori Produk, kenapa dibilang GAGAL?
A: Karena kategori tersebut masih dipakai oleh salah satu Produk di Gudang. Anda harus masuk ke menu Stok & Produk, edit produk tersebut (ganti kategorinya atau kosongkan), baru kategori tersebut bisa dihapus.

Developed with ❤️ for BusaKiloan