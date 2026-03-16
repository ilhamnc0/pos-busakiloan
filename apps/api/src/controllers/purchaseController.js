import prisma from '../lib/prisma.js';

export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { nama: 'asc' } });
    res.json(suppliers);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const upsertSupplier = async (req, res) => {
  const { id, nama, kontak, alamat } = req.body;
  try {
    if (id) {
      const updated = await prisma.supplier.update({ where: { id: parseInt(id) }, data: { nama, kontak, alamat } });
      res.json(updated);
    } else {
      const created = await prisma.supplier.create({ data: { nama, kontak: kontak || '', alamat: alamat || '' } });
      res.json(created);
    }
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const deleteSupplier = async (req, res) => {
  try {
    await prisma.supplier.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Supplier berhasil dihapus" });
  } catch (error) {
    res.status(400).json({ error: "Gagal dihapus. Pastikan supplier ini tidak memiliki riwayat transaksi." });
  }
};

export const getPurchases = async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { tanggal: 'desc' }
    });
    res.json(purchases);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const createPurchase = async (req, res) => {
  try {
    const { supplierId, items, tanggal, tanggalJatuhTempo, totalBayar, keterangan, buktiNota } = req.body;
    
    // Hitung tagihan pakai QTY PABRIK (qtyBeli)
    const totalTagihan = items.reduce((sum, item) => sum + (parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli)), 0);
    const sisaTagihan = totalTagihan - parseFloat(totalBayar || 0);
    const status = sisaTagihan <= 0 ? 'LUNAS' : 'BELUM LUNAS';

    const newPurchase = await prisma.purchase.create({
      data: {
        supplierId: parseInt(supplierId), tanggal: new Date(tanggal || new Date()),
        tanggalJatuhTempo: tanggalJatuhTempo ? new Date(tanggalJatuhTempo) : null,
        totalTagihan, totalBayar: parseFloat(totalBayar || 0), sisaTagihan, status,
        keterangan: keterangan || "", buktiNota: buktiNota || null,
        items: {
          create: items.map(item => ({
            productId: parseInt(item.productId),
            qtyBeli: parseFloat(item.qtyBeli), // Qty Pabrik (Kg)
            qty: parseFloat(item.qty),         // Qty Gudang (Meter)
            hargaBeli: parseFloat(item.hargaBeli),
            subtotal: parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli)
          }))
        }
      }
    });

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: parseInt(item.productId) } });
      const targetProductId = product.parentId ? product.parentId : product.id;

      // 1. Tambah Stok Gudang (Pakai Qty Jual / Meter)
      await prisma.product.update({
        where: { id: targetProductId },
        data: { stok: { increment: parseFloat(item.qty) } }
      });

      // 2. Kalkulasi HPP Per Satuan Jual = (Total Beli Rp / Qty Gudang Masuk)
      const subtotalBarang = parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli);
      const hppPerSatuanJual = subtotalBarang / parseFloat(item.qty);

      await prisma.product.update({
        where: { id: product.id },
        data: { hpp: hppPerSatuanJual }
      });

      if (product.parentId) {
        const parent = await prisma.product.findUnique({ where: { id: product.parentId }, include: { children: true } });
        if (parent && !parent.isHppManual && parent.children.length > 0) {
          const avgHpp = parent.children.reduce((sum, child) => sum + child.hpp, 0) / parent.children.length;
          await prisma.product.update({ where: { id: parent.id }, data: { hpp: avgHpp } });
        }
      }
    }
    res.status(201).json(newPurchase);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const updatePayment = async (req, res) => {
  const { id } = req.params;
  const { totalBayar, buktiBayar } = req.body;

  try {
    const purchase = await prisma.purchase.findUnique({ where: { id: parseInt(id) } });
    const sisaTagihan = purchase.totalTagihan - parseFloat(totalBayar);
    
    let updateData = {
      totalBayar: parseFloat(totalBayar),
      sisaTagihan: sisaTagihan,
      status: sisaTagihan <= 0 ? 'LUNAS' : 'BELUM LUNAS'
    };

    if (buktiBayar !== undefined) updateData.buktiBayar = buktiBayar;

    const updated = await prisma.purchase.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    res.json(updated);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const updatePurchaseDueDate = async (req, res) => {
  try {
    const { tanggalJatuhTempo } = req.body;
    const updated = await prisma.purchase.update({
      where: { id: parseInt(req.params.id) },
      data: { tanggalJatuhTempo: tanggalJatuhTempo ? new Date(tanggalJatuhTempo) : null }
    });
    res.json(updated);
  } catch (error) { res.status(400).json({ error: error.message }); }
};