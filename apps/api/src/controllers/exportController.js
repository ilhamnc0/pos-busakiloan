import prisma from '../lib/prisma.js';
import ExcelJS from 'exceljs';

export const exportData = async (req, res) => {
  const { start, end, type = 'semua' } = req.query;
  const userId = req.user.userId;

  try {
    const workbook = new ExcelJS.Workbook();
    
    // Tentukan tanggal (Bisa jadi null jika master data di-download tanpa filter tanggal)
    const startDate = start ? new Date(start) : new Date('2000-01-01');
    const endDate = end ? new Date(end) : new Date('2100-12-31');
    endDate.setHours(23, 59, 59, 999);

    // ==========================================
    // 1. DATA MASTER (Pelanggan, Sopir, Stok, Supplier)
    // ==========================================
    if (type === 'semua' || type === 'pelanggan') {
      const customers = await prisma.customer.findMany({ where: { userId }, orderBy: { nama: 'asc' } });
      const sheet = workbook.addWorksheet('Data Pelanggan');
      sheet.columns = [ { header: 'Nama Pelanggan', key: 'nama', width: 25 }, { header: 'Kontak', key: 'kontak', width: 20 }, { header: 'Alamat', key: 'alamat', width: 35 }, { header: 'Ongkir Customer (Default)', key: 'ongkir', width: 20 }, { header: 'Ongkir Sopir (Default)', key: 'ongkir_sopir', width: 20 }, { header: 'Catatan', key: 'catatan', width: 30 } ];
      customers.forEach(c => sheet.addRow({ nama: c.nama, kontak: c.kontak || '-', alamat: c.alamat || '-', ongkir: c.ongkirDefault, ongkir_sopir: c.ongkirPerusahaanDefault, catatan: c.catatan || '-' }));
    }

    if (type === 'semua' || type === 'supplier') {
      const suppliers = await prisma.supplier.findMany({ where: { userId }, orderBy: { nama: 'asc' } });
      const sheet = workbook.addWorksheet('Data Supplier');
      sheet.columns = [ { header: 'Nama Pabrik/Supplier', key: 'nama', width: 25 }, { header: 'Kontak', key: 'kontak', width: 20 }, { header: 'Alamat', key: 'alamat', width: 35 } ];
      suppliers.forEach(s => sheet.addRow({ nama: s.nama, kontak: s.kontak || '-', alamat: s.alamat || '-' }));
    }

    if (type === 'semua' || type === 'sopir') {
      const sopirs = await prisma.sopir.findMany({ where: { userId }, include: { ongkir: true }, orderBy: { nama: 'asc' } });
      const sheet = workbook.addWorksheet('Data Sopir');
      sheet.columns = [ { header: 'Nama Sopir', key: 'nama', width: 25 }, { header: 'Kontak', key: 'kontak', width: 20 }, { header: 'Daftar Tarif Daerah', key: 'tarif', width: 50 } ];
      sopirs.forEach(s => sheet.addRow({ nama: s.nama, kontak: s.kontak || '-', tarif: s.ongkir.map(o => `${o.daerah}: Rp${o.tarif}`).join(' | ') || 'Belum ada tarif' }));
    }

    if (type === 'semua' || type === 'stok') {
      const products = await prisma.product.findMany({ where: { userId }, include: { category: true, parent: true }, orderBy: { nama: 'asc' } });
      const sheet = workbook.addWorksheet('Stok & Produk');
      sheet.columns = [ { header: 'Kategori', key: 'kat', width: 20 }, { header: 'Nama Produk', key: 'nama', width: 30 }, { header: 'Tipe', key: 'tipe', width: 15 }, { header: 'Stok Gudang', key: 'stok', width: 15 }, { header: 'Satuan Jual', key: 'satuan', width: 15 }, { header: 'Harga Jual', key: 'harga', width: 15 }, { header: 'HPP (Modal)', key: 'hpp', width: 15 } ];
      products.forEach(p => sheet.addRow({ kat: p.category?.nama || 'UMUM', nama: p.nama, tipe: p.parentId ? 'Sub-Produk' : 'Induk', stok: p.stok, satuan: p.satuanJual || '-', harga: p.hargaJual, hpp: p.hpp }));
    }

    // ==========================================
    // 2. TRANSAKSI UTAMA (Order & Purchase)
    // ==========================================
    if (type === 'semua' || type === 'penjualan') {
      const orders = await prisma.order.findMany({ where: { userId, tanggal: { gte: startDate, lte: endDate } }, include: { customer: true, items: { include: { product: true } } }, orderBy: { tanggal: 'asc' } });
      const sheetOrder = workbook.addWorksheet('Rekap Transaksi Order');
      sheetOrder.columns = [ { header: 'Tgl Order', key: 'tanggal', width: 15 }, { header: 'Jatuh Tempo', key: 'jt', width: 15 }, { header: 'Pelanggan', key: 'customer', width: 25 }, { header: 'Rincian Beli', key: 'barang', width: 40 }, { header: 'Total Tagihan', key: 'tagihan', width: 15 }, { header: 'Sudah Bayar', key: 'dp', width: 15 }, { header: 'Sisa Piutang', key: 'sisa', width: 15 }, { header: 'Status', key: 'status', width: 15 }, { header: 'Link Bukti', key: 'bukti', width: 30 } ];
      orders.forEach(o => {
        const tagihan = o.totalHarga + (o.ongkosKirim || 0);
        let jtDate = o.tanggalJatuhTempo ? new Date(o.tanggalJatuhTempo) : new Date(o.tanggal); if (!o.tanggalJatuhTempo) jtDate.setMonth(jtDate.getMonth() + 1);
        sheetOrder.addRow({ tanggal: new Date(o.tanggal).toLocaleDateString('id-ID'), jt: (tagihan - o.dp) > 0 ? jtDate.toLocaleDateString('id-ID') : '-', customer: o.customer?.nama, barang: o.items.map(i => `${i.product?.nama} (${i.qty})`).join(', '), tagihan: tagihan, dp: o.dp, sisa: tagihan - o.dp, status: o.status, bukti: o.buktiLunas || o.buktiDp || '-' });
      });
    }

    if (type === 'semua' || type === 'pembelian') {
      const purchases = await prisma.purchase.findMany({ where: { userId, tanggal: { gte: startDate, lte: endDate } }, include: { supplier: true, items: { include: { product: true } } }, orderBy: { tanggal: 'asc' } });
      const sheetPurchase = workbook.addWorksheet('Rekap Pembelian Pabrik');
      sheetPurchase.columns = [ { header: 'Tgl Beli', key: 'tanggal', width: 15 }, { header: 'Jatuh Tempo', key: 'jt', width: 15 }, { header: 'Supplier', key: 'supplier', width: 25 }, { header: 'Rincian', key: 'barang', width: 40 }, { header: 'Tagihan Pabrik', key: 'tagihan', width: 15 }, { header: 'Sudah Bayar', key: 'bayar', width: 15 }, { header: 'Sisa Hutang', key: 'sisa', width: 15 }, { header: 'Status', key: 'status', width: 15 }, { header: 'Link Nota', key: 'nota', width: 30 } ];
      purchases.forEach(p => {
        let jtDate = p.tanggalJatuhTempo ? new Date(p.tanggalJatuhTempo) : new Date(p.tanggal); if (!p.tanggalJatuhTempo) jtDate.setDate(jtDate.getDate() + 7);
        sheetPurchase.addRow({ tanggal: new Date(p.tanggal).toLocaleDateString('id-ID'), jt: p.sisaTagihan > 0 ? jtDate.toLocaleDateString('id-ID') : '-', supplier: p.supplier?.nama, barang: p.items.map(i => `${i.product?.nama} (Beli: ${i.qtyBeli}, Msuk: ${i.qty})`).join(', '), tagihan: p.totalTagihan, bayar: p.totalBayar, sisa: p.sisaTagihan, status: p.status, nota: p.buktiNota || '-' });
      });
    }

    // ==========================================
    // 3. FITUR SPESIFIK (Keuangan, Mutasi, Profit, Piutang Khusus)
    // ==========================================
    if (type === 'semua' || type === 'keuangan') {
      const orders = await prisma.order.findMany({ where: { userId, dp: { gt: 0 }, tanggal: { gte: startDate, lte: endDate } }, include: { customer: true } });
      const purchases = await prisma.purchase.findMany({ where: { userId, totalBayar: { gt: 0 }, tanggal: { gte: startDate, lte: endDate } }, include: { supplier: true } });
      const manuals = await prisma.manualTransaction.findMany({ where: { userId, tanggal: { gte: startDate, lte: endDate } } });

      let allIn = []; let allOut = [];
      orders.forEach(o => allIn.push({ tgl: o.tanggal, nama: o.customer?.nama, nominal: o.dp, metode: o.metodeBayar, ket: 'Pembayaran Order', link: o.buktiLunas || o.buktiDp || '-' }));
      manuals.filter(m => m.tipe === 'PEMASUKAN').forEach(m => allIn.push({ tgl: m.tanggal, nama: m.nama, nominal: m.nominal, metode: m.metode, ket: m.keterangan, link: m.buktiLink || '-' }));
      purchases.forEach(p => allOut.push({ tgl: p.tanggal, nama: p.supplier?.nama, nominal: p.totalBayar, metode: 'TF', ket: 'Bayar Pabrik', link: p.buktiBayar || p.buktiNota || '-' }));
      manuals.filter(m => m.tipe === 'PENGELUARAN').forEach(m => allOut.push({ tgl: m.tanggal, nama: m.nama, nominal: m.nominal, metode: m.metode, ket: m.keterangan, link: m.buktiLink || '-' }));

      const sheetIn = workbook.addWorksheet('Uang Masuk');
      sheetIn.columns = [ { header: 'Tanggal', key: 'tgl', width: 15 }, { header: 'Sumber', key: 'nama', width: 25 }, { header: 'Nominal', key: 'nominal', width: 20 }, { header: 'Via', key: 'metode', width: 10 }, { header: 'Ket', key: 'ket', width: 35 } ];
      allIn.sort((a,b) => new Date(a.tgl) - new Date(b.tgl)).forEach(x => sheetIn.addRow({ tgl: new Date(x.tgl).toLocaleDateString('id-ID'), nama: x.nama, nominal: x.nominal, metode: x.metode, ket: x.ket }));

      const sheetOut = workbook.addWorksheet('Uang Keluar');
      sheetOut.columns = [ { header: 'Tanggal', key: 'tgl', width: 15 }, { header: 'Tujuan', key: 'nama', width: 25 }, { header: 'Nominal', key: 'nominal', width: 20 }, { header: 'Via', key: 'metode', width: 10 }, { header: 'Ket', key: 'ket', width: 35 } ];
      allOut.sort((a,b) => new Date(a.tgl) - new Date(b.tgl)).forEach(x => sheetOut.addRow({ tgl: new Date(x.tgl).toLocaleDateString('id-ID'), nama: x.nama, nominal: x.nominal, metode: x.metode, ket: x.ket }));
    }

    if (type === 'semua' || type === 'mutasi') {
      const purchases = await prisma.purchaseItem.findMany({ where: { product: { userId }, purchase: { tanggal: { gte: startDate, lte: endDate } } }, include: { purchase: { include: { supplier: true } }, product: true } });
      const sales = await prisma.orderItem.findMany({ where: { product: { userId }, order: { tanggal: { gte: startDate, lte: endDate } } }, include: { order: { include: { customer: true } }, product: true } });

      const sheetMasuk = workbook.addWorksheet('Mutasi Masuk');
      sheetMasuk.columns = [ { header: 'Waktu', key: 'tgl', width: 20 }, { header: 'Produk', key: 'produk', width: 35 }, { header: 'Dari (Supplier)', key: 'sup', width: 30 }, { header: 'Qty Masuk', key: 'qty', width: 15 } ];
      purchases.sort((a,b) => new Date(a.purchase.tanggal) - new Date(b.purchase.tanggal)).forEach(p => sheetMasuk.addRow({ tgl: new Date(p.purchase.tanggal).toLocaleString('id-ID'), produk: p.product?.nama, sup: p.purchase.supplier?.nama, qty: p.qty }));

      const sheetKeluar = workbook.addWorksheet('Mutasi Keluar');
      sheetKeluar.columns = [ { header: 'Waktu', key: 'tgl', width: 20 }, { header: 'Produk', key: 'produk', width: 35 }, { header: 'Ke (Customer)', key: 'cust', width: 30 }, { header: 'Qty Keluar', key: 'qty', width: 15 } ];
      sales.sort((a,b) => new Date(a.order.tanggal) - new Date(b.order.tanggal)).forEach(s => sheetKeluar.addRow({ tgl: new Date(s.order.tanggal).toLocaleString('id-ID'), produk: s.product?.nama, cust: s.order.customer?.nama, qty: s.qty }));
    }

    if (type === 'semua' || type === 'profit') {
      const orders = await prisma.order.findMany({ where: { userId, status: { in: ['TERKIRIM', 'SELESAI'] }, tanggal: { gte: startDate, lte: endDate } }, include: { customer: true, items: { include: { product: true } } }, orderBy: { tanggal: 'asc' } });
      const sheet = workbook.addWorksheet('Laba & Profit');
      sheet.columns = [ { header: 'Tanggal', key: 'tgl', width: 15 }, { header: 'Pelanggan', key: 'cust', width: 25 }, { header: 'Omset Penjualan', key: 'omset', width: 20 }, { header: 'Total HPP (Modal)', key: 'hpp', width: 20 }, { header: 'Margin Ongkir', key: 'ongkir', width: 20 }, { header: 'Profit Bersih', key: 'profit', width: 20 } ];
      
      let grandOmset = 0, grandHpp = 0, grandOngkir = 0, grandProfit = 0;
      orders.forEach(o => {
        let totalHpp = 0, totalJual = 0;
        o.items.forEach(i => { totalHpp += (i.hppSatuan || 0) * i.qty; totalJual += i.hargaSatuan * i.qty; });
        const marginOngkir = (o.ongkosKirim || 0) - (o.ongkosKirimModal || 0);
        const netProfit = (totalJual - totalHpp) + marginOngkir;
        
        grandOmset += totalJual; grandHpp += totalHpp; grandOngkir += marginOngkir; grandProfit += netProfit;
        sheet.addRow({ tgl: new Date(o.tanggal).toLocaleDateString('id-ID'), cust: o.customer?.nama, omset: totalJual, hpp: totalHpp, ongkir: marginOngkir, profit: netProfit });
      });
      sheet.addRow({}); // Spasi
      sheet.addRow({ cust: 'TOTAL KESELURUHAN', omset: grandOmset, hpp: grandHpp, ongkir: grandOngkir, profit: grandProfit }).font = { bold: true };
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=BusaKiloan-${type}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const bulkDeleteData = async (req, res) => {
  const { start, end, type = 'semua' } = req.body;
  const userId = req.user.userId;
  try {
    // PROTEKSI: Mencegah penghapusan Master Data berdasarkan Tanggal
    const protectedTypes = ['pelanggan', 'sopir', 'stok', 'supplier'];
    if (protectedTypes.includes(type)) return res.status(400).json({ error: "Master Data (Pelanggan/Sopir/Stok/Supplier) tidak bisa dihapus massal berdasarkan tanggal." });

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    if (type === 'semua' || type === 'penjualan' || type === 'piutang' || type === 'profit') await prisma.order.deleteMany({ where: { userId, tanggal: { gte: startDate, lte: endDate } } });
    if (type === 'semua' || type === 'pembelian') await prisma.purchase.deleteMany({ where: { userId, tanggal: { gte: startDate, lte: endDate } } });
    if (type === 'semua' || type === 'keuangan') await prisma.manualTransaction.deleteMany({ where: { userId, tanggal: { gte: startDate, lte: endDate } } });

    res.json({ message: `Data Transaksi di rentang waktu tersebut berhasil dihapus permanen.` });
  } catch (error) { res.status(500).json({ error: error.message }); }
};