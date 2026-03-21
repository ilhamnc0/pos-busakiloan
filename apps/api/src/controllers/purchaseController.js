import prisma from '../lib/prisma.js';

export const getPurchases = async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { tanggal: 'desc' }
    });
    res.json(purchases);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const createPurchase = async (req, res) => {
  try {
    const { supplierId, items, tanggal, tanggalJatuhTempo, totalBayar, metodeBayar, buktiTf, keterangan, buktiNota } = req.body;
    
    // Hitung tagihan pakai QTY PABRIK (qtyBeli)
    const totalTagihan = items.reduce((sum, item) => sum + (parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli)), 0);
    const sisaTagihan = totalTagihan - parseFloat(totalBayar || 0);
    const status = sisaTagihan <= 0 ? 'LUNAS' : 'BELUM LUNAS';

    // Sisipkan informasi Metode Bayar ke dalam Catatan
    const infoMetode = (parseFloat(totalBayar) > 0 && metodeBayar) ? ` [Via: ${metodeBayar}]` : "";

    const newPurchase = await prisma.purchase.create({
      data: {
        supplierId: parseInt(supplierId), 
        tanggal: new Date(tanggal || new Date()),
        tanggalJatuhTempo: tanggalJatuhTempo ? new Date(tanggalJatuhTempo) : null,
        totalTagihan, 
        totalBayar: parseFloat(totalBayar || 0), 
        sisaTagihan, 
        status,
        keterangan: (keterangan || "") + infoMetode, 
        buktiNota: buktiNota || null,
        buktiBayar: buktiTf || null, 
        items: {
          create: items.map(item => ({
            productId: parseInt(item.productId),
            qtyBeli: parseFloat(item.qtyBeli), 
            qty: parseFloat(item.qty),         
            hargaBeli: parseFloat(item.hargaBeli),
            subtotal: parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli)
          }))
        }
      }
    });

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: parseInt(item.productId) } });
      const targetProductId = product.parentId ? product.parentId : product.id;

      // 1. Tambah Stok Gudang
      await prisma.product.update({
        where: { id: targetProductId },
        data: { stok: { increment: parseFloat(item.qty) } }
      });

      // 2. Kalkulasi HPP Per Satuan Jual
      const subtotalBarang = parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli);
      const hppPerSatuanJual = parseFloat(item.qty) > 0 ? (subtotalBarang / parseFloat(item.qty)) : 0;

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
  } catch (error) { 
    res.status(400).json({ error: error.message }); 
  }
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
  } catch (error) { 
    res.status(400).json({ error: error.message }); 
  }
};

export const updatePurchaseDueDate = async (req, res) => {
  try {
    const { tanggalJatuhTempo } = req.body;
    const updated = await prisma.purchase.update({
      where: { id: parseInt(req.params.id) },
      data: { tanggalJatuhTempo: tanggalJatuhTempo ? new Date(tanggalJatuhTempo) : null }
    });
    res.json(updated);
  } catch (error) { 
    res.status(400).json({ error: error.message }); 
  }
};

export const updatePurchase = async (req, res) => {
  const purchaseId = parseInt(req.params.id);
  const { supplierId, items, tanggal, tanggalJatuhTempo, totalBayar, metodeBayar, buktiTf, keterangan, buktiNota } = req.body;

  try {
    // 1. Cek data pembelian lama
    const oldPurchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: true }
    });

    if (!oldPurchase) return res.status(404).json({ error: "Data transaksi tidak ditemukan" });

    // 2. KEMBALIKAN STOK LAMA (Revert / Undo)
    for (const oldItem of oldPurchase.items) {
      const product = await prisma.product.findUnique({ where: { id: oldItem.productId } });
      if (product) {
        const targetProductId = product.parentId ? product.parentId : product.id;
        await prisma.product.update({
          where: { id: targetProductId },
          data: { stok: { decrement: parseFloat(oldItem.qty) } } // Tarik kembali stoknya
        });
      }
    }

    // 3. Hapus rincian item yang lama
    await prisma.purchaseItem.deleteMany({ where: { purchaseId } });

    // 4. Hitung ulang total tagihan baru
    const totalTagihan = items.reduce((sum, item) => sum + (parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli)), 0);
    const sisaTagihan = totalTagihan - parseFloat(totalBayar || 0);
    const status = sisaTagihan <= 0 ? 'LUNAS' : 'BELUM LUNAS';

    const infoMetode = (parseFloat(totalBayar) > 0 && metodeBayar && !keterangan?.includes(metodeBayar)) ? ` [Via: ${metodeBayar}]` : "";

    // 5. Simpan pembaruan Purchase utama & masukkan rincian baru
    const updatedPurchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        supplierId: parseInt(supplierId),
        tanggal: new Date(tanggal || new Date()),
        tanggalJatuhTempo: tanggalJatuhTempo ? new Date(tanggalJatuhTempo) : null,
        totalTagihan,
        totalBayar: parseFloat(totalBayar || 0),
        sisaTagihan,
        status,
        keterangan: (keterangan || "") + infoMetode,
        buktiNota: buktiNota || null,
        buktiBayar: buktiTf || oldPurchase.buktiBayar,
        items: {
          create: items.map(item => ({
            productId: parseInt(item.productId),
            qtyBeli: parseFloat(item.qtyBeli),
            qty: parseFloat(item.qty),
            hargaBeli: parseFloat(item.hargaBeli),
            subtotal: parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli)
          }))
        }
      }
    });

    // 6. MASUKKAN STOK BARU & HITUNG ULANG HPP
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: parseInt(item.productId) } });
      if (product) {
        const targetProductId = product.parentId ? product.parentId : product.id;
        
        // Tambah stok baru
        await prisma.product.update({
          where: { id: targetProductId },
          data: { stok: { increment: parseFloat(item.qty) } }
        });

        // Hitung ulang HPP
        const subtotalBarang = parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli);
        const hppPerSatuanJual = parseFloat(item.qty) > 0 ? (subtotalBarang / parseFloat(item.qty)) : 0;

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
    }
    res.json(updatedPurchase);
  } catch (error) { 
    res.status(400).json({ error: error.message }); 
  }
};