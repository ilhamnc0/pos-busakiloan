import prisma from '../lib/prisma.js';

export const getProfitData = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.userId, status: { in: ['TERKIRIM', 'SELESAI'] } },
      include: { customer: true, sopir: true, items: { include: { product: { include: { category: true } } } } },
      orderBy: { tanggal: 'desc' }
    });

    const profitData = orders.map(order => {
      let totalHpp = 0; let totalPenjualanItem = 0;
      const rincianItems = order.items.map(item => {
        const itemHpp = item.hppSatuan || 0; 
        const itemTotalHpp = itemHpp * item.qty; 
        const itemRevenue = item.hargaSatuan * item.qty;
        
        totalHpp += itemTotalHpp; totalPenjualanItem += itemRevenue;

        return {
          namaProduk: item.product?.nama || 'Produk Dihapus',
          kategori: item.product?.category?.nama || 'UMUM',
          qty: item.qty, hargaJual: item.hargaSatuan, hppSatuan: itemHpp, profitKotorItem: itemRevenue - itemTotalHpp
        };
      });

      const ongkirTagihan = order.ongkosKirim || 0; 
      const ongkirKeluar = order.ongkosKirimModal || 0; 
      const marginOngkir = ongkirTagihan - ongkirKeluar;
      const netProfit = (totalPenjualanItem - totalHpp) + marginOngkir;

      return {
        id: order.id, tanggal: order.tanggal, customer: order.customer?.nama || 'Pelanggan Umum',
        sopir: order.sopir?.nama || 'Tanpa Sopir', keterangan: order.keterangan || '-', rincian: rincianItems,
        totalPenjualan: totalPenjualanItem, totalHpp, ongkirMasuk: ongkirTagihan, ongkirKeluar, marginOngkir, netProfit
      };
    });

    res.json(profitData);
  } catch (error) { res.status(500).json({ error: error.message }); }
};