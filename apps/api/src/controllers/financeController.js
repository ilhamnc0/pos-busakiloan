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

    orders.forEach(o => {
      const totalTagihan = o.totalHarga + (o.ongkosKirim || 0);
      const sisaPiutang = totalTagihan - o.dp;
      let ket = sisaPiutang > 0 ? 'Pembayaran DP Nota / Order' : 'Pelunasan Nota / Order';

      transactions.push({
        id: `AUTO-ORD-${o.id}`, isAuto: true, tipe: 'PEMASUKAN', nama: o.customer?.nama || 'Pelanggan',
        nominal: o.dp, tanggal: o.tanggal, metode: o.metodeBayar || 'TF', keterangan: ket, buktiLink: o.buktiLunas || o.buktiDp || ''
      });
    });

    purchases.forEach(p => {
      transactions.push({
        id: `AUTO-PUR-${p.id}`, isAuto: true, tipe: 'PENGELUARAN', nama: p.supplier?.nama || 'Supplier',
        nominal: p.totalBayar, tanggal: p.tanggal, metode: 'TF', keterangan: `Pembayaran ke Pabrik`, buktiLink: p.buktiBayar || p.buktiNota || ''
      });
    });

    manuals.forEach(m => {
      transactions.push({
        id: `MAN-${m.id}`, dbId: m.id, isAuto: false, tipe: m.tipe, nama: m.nama,
        nominal: m.nominal, tanggal: m.tanggal, metode: m.metode, keterangan: m.keterangan || '', buktiLink: m.buktiLink || ''
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
        userId: req.user.userId, // KUNCI
        tipe, nama, nominal: parseFloat(nominal), tanggal: tanggal ? new Date(tanggal) : new Date(),
        metode: metode || 'CASH', keterangan: keterangan || '', buktiLink: buktiLink || ''
      }
    });
    res.status(201).json(newTx);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateManualTransaction = async (req, res) => {
  const { id } = req.params;
  try {
    const cek = await prisma.manualTransaction.findFirst({ where: { id: parseInt(id), userId: req.user.userId }});
    if (!cek) return res.status(403).json({ error: "Akses ditolak" });

    const updatedTx = await prisma.manualTransaction.update({
      where: { id: parseInt(id) },
      data: {
        tipe: req.body.tipe, nama: req.body.nama, nominal: parseFloat(req.body.nominal),
        tanggal: req.body.tanggal ? new Date(req.body.tanggal) : new Date(),
        metode: req.body.metode || 'CASH', keterangan: req.body.keterangan || '', buktiLink: req.body.buktiLink || ''
      }
    });
    res.json(updatedTx);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteManualTransaction = async (req, res) => {
  try {
    await prisma.manualTransaction.deleteMany({ where: { id: parseInt(req.params.id), userId: req.user.userId } });
    res.json({ message: "Transaksi manual dihapus" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};