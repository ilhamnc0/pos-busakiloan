import prisma from '../lib/prisma.js';

export const getCashFlow = async (req, res) => {
  try {
    const userId = req.user.userId;

    const orders = await prisma.order.findMany({ 
      where: { userId, dp: { gt: 0 } }, 
      include: { customer: true } 
    });
    
    const purchases = await prisma.purchase.findMany({ 
      where: { userId, totalBayar: { gt: 0 } }, 
      include: { supplier: true } 
    });
    
    const manuals = await prisma.manualTransaction.findMany({ where: { userId } });

    let transactions = [];

    // OLAH DATA UANG MASUK (DP AWAL)
    orders.forEach(o => {
      const pembayaranSusulan = manuals.filter(m => m.keterangan === `SYS_PELUNASAN_ORD_${o.id}` || m.keterangan.includes(`SYS_PELUNASAN_ORD_${o.id})`));
      const totalUangSusulan = pembayaranSusulan.reduce((sum, m) => sum + m.nominal, 0);

      const uangMasukAwal = o.dp - totalUangSusulan;
      if (uangMasukAwal > 0) {
        transactions.push({
          id: `AUTO-ORD-${o.id}`, isAuto: true, tipe: 'PEMASUKAN', nama: o.customer?.nama || 'Pelanggan',
          nominal: uangMasukAwal, tanggal: o.tanggal, metode: o.metodeBayar || 'TF', keterangan: 'Uang Muka (DP) Awal / Pembayaran Pertama', buktiLink: o.buktiLunas || o.buktiDp || ''
        });
      }
    });

    // OLAH DATA UANG KELUAR (DP AWAL PABRIK)
    purchases.forEach(p => {
      const pembayaranSusulan = manuals.filter(m => m.keterangan === `SYS_PELUNASAN_PUR_${p.id}` || m.keterangan.includes(`SYS_PELUNASAN_PUR_${p.id})`));
      const totalUangSusulan = pembayaranSusulan.reduce((sum, m) => sum + m.nominal, 0);

      const uangKeluarAwal = p.totalBayar - totalUangSusulan;
      if (uangKeluarAwal > 0) {
        transactions.push({
          id: `AUTO-PUR-${p.id}`, isAuto: true, tipe: 'PENGELUARAN', nama: p.supplier?.nama || 'Supplier',
          nominal: uangKeluarAwal, tanggal: p.tanggal, metode: 'TF', keterangan: `Uang Muka (DP) Awal ke Pabrik`, buktiLink: p.buktiBayar || p.buktiNota || ''
        });
      }
    });

    // MASUKKAN TRANSAKSI PELUNASAN / MANUAL (BISA DIEDIT/HAPUS DARI BUKU KAS)
    manuals.forEach(m => {
      transactions.push({
        id: `MAN-${m.id}`, dbId: m.id, 
        isAuto: false, // <-- KUNCI: Membuat tombol Edit/Delete muncul di Frontend
        tipe: m.tipe, nama: m.nama,
        nominal: m.nominal, 
        tanggal: m.tanggal, 
        metode: m.metode, 
        keterangan: m.keterangan || '', 
        buktiLink: m.buktiLink || ''
      });
    });

    transactions.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createManualTransaction = async (req, res) => {
  const { tipe, nama, nominal, tanggal, metode, keterangan, buktiLink } = req.body;
  try {
    const newTx = await prisma.manualTransaction.create({
      data: {
        userId: req.user.userId, 
        tipe, nama, nominal: parseFloat(nominal), tanggal: tanggal ? new Date(tanggal) : new Date(),
        metode: metode || 'CASH', keterangan: keterangan || '', buktiLink: buktiLink || ''
      }
    });
    res.status(201).json(newTx);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const updateManualTransaction = async (req, res) => {
  const { id } = req.params;
  try {
    const tx = await prisma.manualTransaction.findFirst({ where: { id: parseInt(id), userId: req.user.userId }});
    if (!tx) return res.status(403).json({ error: "Akses ditolak" });

    const selisih = parseFloat(req.body.nominal) - tx.nominal;

    // SYNC KE NOTA PIUTANG / HUTANG JIKA NOMINAL DIUBAH DARI BUKU KAS
    if (tx.keterangan.includes('SYS_PELUNASAN_ORD_')) {
        const match = tx.keterangan.match(/SYS_PELUNASAN_ORD_(\d+)/);
        if (match) { await prisma.order.update({ where: { id: parseInt(match[1]) }, data: { dp: { increment: selisih } } }); }
    } else if (tx.keterangan.includes('SYS_PELUNASAN_PUR_')) {
        const match = tx.keterangan.match(/SYS_PELUNASAN_PUR_(\d+)/);
        if (match) { await prisma.purchase.update({ where: { id: parseInt(match[1]) }, data: { totalBayar: { increment: selisih } } }); }
    }

    // PASTIKAN LABEL SISTEM TIDAK HILANG MESKI KETERANGAN DIEDIT KASIR
    let newKet = req.body.keterangan || '';
    if (tx.keterangan.includes('SYS_PELUNASAN_ORD_') && !newKet.includes('SYS_PELUNASAN_ORD_')) {
        const match = tx.keterangan.match(/SYS_PELUNASAN_ORD_\d+/);
        newKet += ` (${match[0]})`;
    }
    if (tx.keterangan.includes('SYS_PELUNASAN_PUR_') && !newKet.includes('SYS_PELUNASAN_PUR_')) {
        const match = tx.keterangan.match(/SYS_PELUNASAN_PUR_\d+/);
        newKet += ` (${match[0]})`;
    }

    const updatedTx = await prisma.manualTransaction.update({
      where: { id: parseInt(id) },
      data: {
        tipe: req.body.tipe, nama: req.body.nama, nominal: parseFloat(req.body.nominal),
        tanggal: req.body.tanggal ? new Date(req.body.tanggal) : new Date(),
        metode: req.body.metode || 'CASH', keterangan: newKet, buktiLink: req.body.buktiLink || ''
      }
    });
    res.json(updatedTx);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const deleteManualTransaction = async (req, res) => {
  try {
    const tx = await prisma.manualTransaction.findFirst({ where: { id: parseInt(req.params.id), userId: req.user.userId } });
    if (!tx) return res.status(404).json({ error: "Not found" });

    // SYNC: JIKA DIHAPUS DI BUKU KAS, KURANGI TOTAL DIBAYAR DI NOTA PIUTANG / HUTANG
    if (tx.keterangan.includes('SYS_PELUNASAN_ORD_')) {
        const match = tx.keterangan.match(/SYS_PELUNASAN_ORD_(\d+)/);
        if (match) { await prisma.order.update({ where: { id: parseInt(match[1]) }, data: { dp: { decrement: tx.nominal } } }); }
    } else if (tx.keterangan.includes('SYS_PELUNASAN_PUR_')) {
        const match = tx.keterangan.match(/SYS_PELUNASAN_PUR_(\d+)/);
        if (match) { await prisma.purchase.update({ where: { id: parseInt(match[1]) }, data: { totalBayar: { decrement: tx.nominal } } }); }
    }

    await prisma.manualTransaction.delete({ where: { id: tx.id } });
    res.json({ message: "Transaksi manual dihapus dan disinkronisasi ke Piutang/Hutang" });
  } catch (error) { res.status(400).json({ error: error.message }); }
};