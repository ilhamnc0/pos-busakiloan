import prisma from '../lib/prisma.js';

export const getCashFlow = async (req, res) => {
  try {
    // 1. Ambil Order Pelanggan (Pemasukan)
    const orders = await prisma.order.findMany({ 
      where: { dp: { gt: 0 } }, 
      include: { customer: true } 
    });
    
    // 2. Ambil Hutang Supplier (Pengeluaran)
    const purchases = await prisma.purchase.findMany({ 
      where: { totalBayar: { gt: 0 } }, 
      include: { supplier: true } 
    });
    
    // 3. Ambil Transaksi Manual
    const manuals = await prisma.manualTransaction.findMany();

    let transactions = [];

    // Map Pemasukan Order
    orders.forEach(o => {
      // LOGIKA MATEMATIKA: Cek sisa hutang untuk menentukan keterangan
      const totalTagihan = o.totalHarga + (o.ongkosKirim || 0);
      const sisaPiutang = totalTagihan - o.dp;
      
      let ket = 'Pembayaran Nota / Order';
      if (sisaPiutang > 0) {
        ket = 'Pembayaran DP Nota / Order';
      } else if (sisaPiutang <= 0) {
        ket = 'Pelunasan Nota / Order';
      }

      transactions.push({
        id: `AUTO-ORD-${o.id}`,
        isAuto: true,
        tipe: 'PEMASUKAN',
        nama: o.customer?.nama || 'Pelanggan',
        nominal: o.dp,
        tanggal: o.tanggal,
        metode: o.metodeBayar || 'TF',
        keterangan: ket,
        buktiLink: o.buktiLunas || o.buktiDp || ''
      });
    });

    // Map Pengeluaran Supplier
    purchases.forEach(p => {
      transactions.push({
        id: `AUTO-PUR-${p.id}`,
        isAuto: true,
        tipe: 'PENGELUARAN',
        nama: p.supplier?.nama || 'Supplier',
        nominal: p.totalBayar,
        tanggal: p.tanggal,
        metode: 'TF', 
        keterangan: `Pembayaran ke Pabrik`,
        buktiLink: p.buktiBayar || p.buktiNota || ''
      });
    });

    // Map Transaksi Manual
    manuals.forEach(m => {
      transactions.push({
        id: `MAN-${m.id}`,
        dbId: m.id, 
        isAuto: false,
        tipe: m.tipe,
        nama: m.nama,
        nominal: m.nominal,
        tanggal: m.tanggal,
        metode: m.metode,
        keterangan: m.keterangan || '',
        buktiLink: m.buktiLink || ''
      });
    });

    // Urutkan dari yang terbaru
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
        tipe,
        nama,
        nominal: parseFloat(nominal),
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        metode: metode || 'CASH',
        keterangan: keterangan || '',
        buktiLink: buktiLink || ''
      }
    });
    res.status(201).json(newTx);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateManualTransaction = async (req, res) => {
  const { id } = req.params;
  const { tipe, nama, nominal, tanggal, metode, keterangan, buktiLink } = req.body;
  
  try {
    const updatedTx = await prisma.manualTransaction.update({
      where: { id: parseInt(id) },
      data: {
        tipe,
        nama,
        nominal: parseFloat(nominal),
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        metode: metode || 'CASH',
        keterangan: keterangan || '',
        buktiLink: buktiLink || ''
      }
    });
    res.json(updatedTx);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteManualTransaction = async (req, res) => {
  try {
    await prisma.manualTransaction.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Transaksi manual dihapus" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};