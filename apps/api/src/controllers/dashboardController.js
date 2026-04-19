import prisma from '../lib/prisma.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${currentYear}-12-31T23:59:59.999Z`);
    const userId = req.user.userId; // KUNCI MULTI-TENANT

    const orders = await prisma.order.findMany({
      where: { userId, tanggal: { gte: startDate, lte: endDate } },
      include: { items: { include: { product: true } } }
    });

    const purchases = await prisma.purchase.findMany({
      where: { userId, tanggal: { gte: startDate, lte: endDate } },
      include: { items: true } 
    });

    const allManuals = await prisma.manualTransaction.findMany({ where: { userId } });
    const allOrders = await prisma.order.findMany({ where: { userId, dp: { gt: 0 } } });
    const allPurchases = await prisma.purchase.findMany({ where: { userId, totalBayar: { gt: 0 } } });

    // KAS AKTIF
    let totalKasMasuk = allOrders.reduce((sum, o) => o.status !== 'DIBATALKAN' ? sum + o.dp : sum, 0) + 
                        allManuals.filter(m => m.tipe === 'PEMASUKAN').reduce((sum, m) => sum + m.nominal, 0);
    let totalKasKeluar = allPurchases.reduce((sum, p) => sum + p.totalBayar, 0) + 
                         allManuals.filter(m => m.tipe === 'PENGELUARAN').reduce((sum, m) => sum + m.nominal, 0);
    const saldoKas = totalKasMasuk - totalKasKeluar;

    let omsetTahunIni = 0;
    let profitTahunIni = 0;
    let piutangBeredar = 0;

    orders.forEach(o => {
      if (o.status !== 'DIBATALKAN') {
        omsetTahunIni += o.dp;
        piutangBeredar += ((o.totalHarga + (o.ongkosKirim || 0)) - o.dp);
        if (o.status === 'TERKIRIM' || o.status === 'SELESAI') {
          let hppTahunIni = 0;
          o.items.forEach(i => { hppTahunIni += (i.qty * (i.product?.hpp || 0)); });
          profitTahunIni += (o.totalHarga - hppTahunIni);
        }
      }
    });

    let hutangPabrik = purchases.reduce((sum, p) => sum + (p.totalBayar < p.items.reduce((s, i)=>s+i.subtotal,0) ? p.items.reduce((s, i)=>s+i.subtotal,0) - p.totalBayar : 0), 0);

    res.json({
      tahun: currentYear,
      saldoKas,
      omsetTahunIni,
      profitTahunIni,
      piutangBeredar,
      hutangPabrik,
      totalTransaksi: orders.filter(o => o.status !== 'DIBATALKAN').length
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};