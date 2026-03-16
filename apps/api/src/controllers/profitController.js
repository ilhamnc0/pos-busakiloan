import prisma from '../lib/prisma.js';

export const getProfitData = async (req, res) => {
  try {
    // Ambil order yang sudah sah (Terkirim / Selesai)
    const orders = await prisma.order.findMany({
      where: { status: { in: ['TERKIRIM', 'SELESAI'] } },
      include: {
        customer: true,
        sopir: true, // MENARIK DATA SOPIR
        items: {
          include: { 
            product: { include: { category: true } } 
          }
        }
      },
      orderBy: { tanggal: 'desc' }
    });

    const profitData = orders.map(order => {
      let totalHpp = 0;
      let totalPenjualanItem = 0;

      // Hitung profit per item
      const rincianItems = order.items.map(item => {
        const itemHpp = item.hppSatuan || 0; 
        const itemTotalHpp = itemHpp * item.qty; 
        const itemRevenue = item.hargaSatuan * item.qty;
        
        totalHpp += itemTotalHpp;
        totalPenjualanItem += itemRevenue;

        return {
          namaProduk: item.product?.nama || 'Produk Dihapus',
          kategori: item.product?.category?.nama || 'UMUM',
          qty: item.qty,
          hargaJual: item.hargaSatuan,
          hppSatuan: itemHpp,
          profitKotorItem: itemRevenue - itemTotalHpp
        };
      });

      // =========================================================================
      // MENGAMBIL ONGKIR OUT (MODAL) LANGSUNG DARI DATA ORDER YANG TERSIMPAN
      // =========================================================================
      const ongkirTagihan = order.ongkosKirim || 0; 
      
      // Menggunakan ongkosKirimModal yang sudah kita simpan saat order dibuat
      const ongkirKeluar = order.ongkosKirimModal || 0; 

      const marginOngkir = ongkirTagihan - ongkirKeluar;
      
      // Profit Bersih = (Penjualan Barang - HPP Barang) + Margin Ongkir
      const grossProfit = totalPenjualanItem - totalHpp;
      const netProfit = grossProfit + marginOngkir;

      return {
        id: order.id,
        tanggal: order.tanggal,
        customer: order.customer?.nama || 'Pelanggan Umum',
        sopir: order.sopir?.nama || 'Tanpa Sopir', // Ditambahkan agar frontend bisa baca
        keterangan: order.keterangan || '-',
        rincian: rincianItems,
        totalPenjualan: totalPenjualanItem,
        totalHpp: totalHpp,
        ongkirMasuk: ongkirTagihan,
        ongkirKeluar: ongkirKeluar,
        marginOngkir: marginOngkir,
        netProfit: netProfit
      };
    });

    res.json(profitData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};