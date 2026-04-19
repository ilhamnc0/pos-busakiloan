import prisma from '../lib/prisma.js';

export const getPurchases = async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { userId: req.user.userId },
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { tanggal: 'desc' }
    });
    res.json(purchases);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const createPurchase = async (req, res) => {
  try {
    const { supplierId, items, tanggal, tanggalJatuhTempo, totalBayar, metodeBayar, buktiTf, keterangan, buktiNota } = req.body;
    const totalTagihan = items.reduce((sum, item) => sum + (parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli)), 0);
    const sisaTagihan = totalTagihan - parseFloat(totalBayar || 0);
    const status = sisaTagihan <= 0 ? 'LUNAS' : 'BELUM LUNAS';
    const infoMetode = (parseFloat(totalBayar) > 0 && metodeBayar) ? ` [Via: ${metodeBayar}]` : "";

    const newPurchase = await prisma.purchase.create({
      data: {
        userId: req.user.userId, // KUNCI
        supplierId: parseInt(supplierId), 
        tanggal: new Date(tanggal || new Date()), tanggalJatuhTempo: tanggalJatuhTempo ? new Date(tanggalJatuhTempo) : null,
        totalTagihan, totalBayar: parseFloat(totalBayar || 0), sisaTagihan, status,
        keterangan: (keterangan || "") + infoMetode, buktiNota: buktiNota || null, buktiBayar: buktiTf || null, 
        items: {
          create: items.map(item => ({
            productId: parseInt(item.productId), qtyBeli: parseFloat(item.qtyBeli), qty: parseFloat(item.qty),         
            hargaBeli: parseFloat(item.hargaBeli), subtotal: parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli)
          }))
        }
      }
    });

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: parseInt(item.productId) } });
      const targetProductId = product.parentId ? product.parentId : product.id;

      await prisma.product.update({ where: { id: targetProductId }, data: { stok: { increment: parseFloat(item.qty) } } });

      const subtotalBarang = parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli);
      const hppPerSatuanJual = parseFloat(item.qty) > 0 ? (subtotalBarang / parseFloat(item.qty)) : 0;
      await prisma.product.update({ where: { id: product.id }, data: { hpp: hppPerSatuanJual } });

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
  try {
    const purchase = await prisma.purchase.findFirst({ where: { id: parseInt(req.params.id), userId: req.user.userId } });
    if (!purchase) return res.status(403).json({ error: "Akses ditolak" });
    const sisaTagihan = purchase.totalTagihan - parseFloat(req.body.totalBayar);
    
    let updateData = { totalBayar: parseFloat(req.body.totalBayar), sisaTagihan, status: sisaTagihan <= 0 ? 'LUNAS' : 'BELUM LUNAS' };
    if (req.body.buktiBayar !== undefined) updateData.buktiBayar = req.body.buktiBayar;

    const updated = await prisma.purchase.update({ where: { id: purchase.id }, data: updateData });
    res.json(updated);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const updatePurchaseDueDate = async (req, res) => {
  try {
    const cek = await prisma.purchase.findFirst({ where: { id: parseInt(req.params.id), userId: req.user.userId } });
    if(!cek) return res.status(403).json({error: "Akses ditolak"});
    const updated = await prisma.purchase.update({ where: { id: cek.id }, data: { tanggalJatuhTempo: req.body.tanggalJatuhTempo ? new Date(req.body.tanggalJatuhTempo) : null } });
    res.json(updated);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const updatePurchase = async (req, res) => {
  const purchaseId = parseInt(req.params.id);
  const { supplierId, items, tanggal, tanggalJatuhTempo, totalBayar, metodeBayar, buktiTf, keterangan, buktiNota } = req.body;

  try {
    const oldPurchase = await prisma.purchase.findFirst({ where: { id: purchaseId, userId: req.user.userId }, include: { items: true } });
    if (!oldPurchase) return res.status(404).json({ error: "Data transaksi tidak ditemukan / Akses ditolak" });

    for (const oldItem of oldPurchase.items) {
      const product = await prisma.product.findUnique({ where: { id: oldItem.productId } });
      if (product) {
        const targetProductId = product.parentId ? product.parentId : product.id;
        await prisma.product.update({ where: { id: targetProductId }, data: { stok: { decrement: parseFloat(oldItem.qty) } } });
      }
    }

    await prisma.purchaseItem.deleteMany({ where: { purchaseId } });

    const totalTagihan = items.reduce((sum, item) => sum + (parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli)), 0);
    const sisaTagihan = totalTagihan - parseFloat(totalBayar || 0);
    const status = sisaTagihan <= 0 ? 'LUNAS' : 'BELUM LUNAS';
    const infoMetode = (parseFloat(totalBayar) > 0 && metodeBayar && !keterangan?.includes(metodeBayar)) ? ` [Via: ${metodeBayar}]` : "";

    const updatedPurchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        supplierId: parseInt(supplierId), tanggal: new Date(tanggal || new Date()), tanggalJatuhTempo: tanggalJatuhTempo ? new Date(tanggalJatuhTempo) : null,
        totalTagihan, totalBayar: parseFloat(totalBayar || 0), sisaTagihan, status, keterangan: (keterangan || "") + infoMetode, buktiNota: buktiNota || null,
        buktiBayar: buktiTf || oldPurchase.buktiBayar,
        items: { create: items.map(item => ({ productId: parseInt(item.productId), qtyBeli: parseFloat(item.qtyBeli), qty: parseFloat(item.qty), hargaBeli: parseFloat(item.hargaBeli), subtotal: parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli) })) }
      }
    });

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: parseInt(item.productId) } });
      if (product) {
        const targetProductId = product.parentId ? product.parentId : product.id;
        await prisma.product.update({ where: { id: targetProductId }, data: { stok: { increment: parseFloat(item.qty) } } });
        const subtotalBarang = parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli);
        const hppPerSatuanJual = parseFloat(item.qty) > 0 ? (subtotalBarang / parseFloat(item.qty)) : 0;
        await prisma.product.update({ where: { id: product.id }, data: { hpp: hppPerSatuanJual } });
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
  } catch (error) { res.status(400).json({ error: error.message }); }
};