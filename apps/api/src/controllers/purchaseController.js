import prisma from '../lib/prisma.js';

export const getPurchases = async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { userId: req.user.userId },
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { tanggal: 'desc' }
    });

    const manuals = await prisma.manualTransaction.findMany({
      where: { userId: req.user.userId, keterangan: { contains: 'SYS_PELUNASAN_PUR_' } }
    });

    const processed = purchases.map(p => {
      const txs = manuals.filter(m => m.keterangan === `SYS_PELUNASAN_PUR_${p.id}` || m.keterangan.includes(`SYS_PELUNASAN_PUR_${p.id})`));
      const lastTx = txs.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal))[0];
      const lastPaymentDate = lastTx ? lastTx.tanggal : (p.totalBayar > 0 ? p.tanggal : null);
      return { ...p, lastPaymentDate }; 
    });

    res.json(processed);
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
        userId: req.user.userId,
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

export const updatePurchaseDueDate = async (req, res) => {
  try {
    const cek = await prisma.purchase.findFirst({ where: { id: parseInt(req.params.id), userId: req.user.userId } });
    if(!cek) return res.status(403).json({error: "Akses ditolak"});
    const updated = await prisma.purchase.update({ where: { id: cek.id }, data: { tanggalJatuhTempo: req.body.tanggalJatuhTempo ? new Date(req.body.tanggalJatuhTempo) : null } });
    res.json(updated);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const updatePayment = async (req, res) => {
  try {
    const purchase = await prisma.purchase.findFirst({ where: { id: parseInt(req.params.id), userId: req.user.userId }, include: { supplier: true } });
    if (!purchase) return res.status(403).json({ error: "Akses ditolak" });
    
    const oldBayar = purchase.totalBayar || 0;
    const newBayar = parseFloat(req.body.totalBayar);
    const selisihPembayaran = newBayar - oldBayar;

    const txs = await prisma.manualTransaction.findMany({
      where: { userId: req.user.userId, keterangan: { contains: `SYS_PELUNASAN_PUR_${purchase.id}` } }
    });
    const toDeleteIds = txs.filter(tx => tx.keterangan === `SYS_PELUNASAN_PUR_${purchase.id}` || tx.keterangan.includes(`SYS_PELUNASAN_PUR_${purchase.id})`)).map(tx => tx.id);

    if (newBayar === 0 || selisihPembayaran < 0) {
      await prisma.manualTransaction.deleteMany({ where: { id: { in: toDeleteIds } } });
    } else if (selisihPembayaran > 0) {
      await prisma.manualTransaction.create({
        data: {
          userId: req.user.userId, tipe: 'PENGELUARAN', nama: purchase.supplier?.nama || 'Supplier Pabrik',
          nominal: selisihPembayaran, tanggal: req.body.tanggal ? new Date(req.body.tanggal) : new Date(),
          metode: 'TF', keterangan: `Bayar Hutang (SYS_PELUNASAN_PUR_${purchase.id})`, buktiLink: req.body.buktiBayar || ''
        }
      });
    }

    const sisaTagihan = purchase.totalTagihan - newBayar;
    let updateData = { totalBayar: newBayar, sisaTagihan, status: sisaTagihan <= 0 ? 'LUNAS' : 'BELUM LUNAS' };
    if (req.body.buktiBayar !== undefined) updateData.buktiBayar = req.body.buktiBayar;

    const updated = await prisma.purchase.update({ where: { id: purchase.id }, data: updateData });
    res.json(updated);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const updatePurchase = async (req, res) => {
  const purchaseId = parseInt(req.params.id);
  const { supplierId, items, tanggal, tanggalJatuhTempo, totalBayar, metodeBayar, buktiTf, keterangan, buktiNota } = req.body;

  try {
    const oldPurchase = await prisma.purchase.findFirst({ where: { id: purchaseId, userId: req.user.userId }, include: { items: true } });
    if (!oldPurchase) return res.status(404).json({ error: "Data transaksi tidak ditemukan" });

    // 1. KEMBALIKAN STOK LAMA
    for (const oldItem of oldPurchase.items) {
      const product = await prisma.product.findUnique({ where: { id: oldItem.productId } });
      if (product) {
        const targetProductId = product.parentId ? product.parentId : product.id;
        await prisma.product.update({ where: { id: targetProductId }, data: { stok: { decrement: parseFloat(oldItem.qty) } } });
      }
    }

    // 2. HAPUS ITEMS LAMA
    await prisma.purchaseItem.deleteMany({ where: { purchaseId } });

    // 3. HITUNG TAGIHAN DAN UPDATE RECORD
    const totalTagihan = items.reduce((sum, item) => sum + (parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli)), 0);
    const sisaTagihan = totalTagihan - parseFloat(totalBayar || 0);
    const status = sisaTagihan <= 0 ? 'LUNAS' : 'BELUM LUNAS';
    const infoMetode = (parseFloat(totalBayar) > 0 && metodeBayar && !keterangan?.includes(metodeBayar)) ? ` [Via: ${metodeBayar}]` : "";

    const updatedPurchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        supplierId: parseInt(supplierId), tanggal: new Date(tanggal || new Date()), tanggalJatuhTempo: tanggalJatuhTempo ? new Date(tanggalJatuhTempo) : null,
        totalTagihan, totalBayar: parseFloat(totalBayar || 0), sisaTagihan, status, keterangan: (keterangan || "") + infoMetode, buktiNota: buktiNota || null,
        buktiBayar: buktiTf !== undefined ? buktiTf : oldPurchase.buktiBayar,
        items: { create: items.map(item => ({ productId: parseInt(item.productId), qtyBeli: parseFloat(item.qtyBeli), qty: parseFloat(item.qty), hargaBeli: parseFloat(item.hargaBeli), subtotal: parseFloat(item.hargaBeli) * parseFloat(item.qtyBeli) })) }
      }
    });

    // 4. MASUKKAN STOK BARU
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

export const deletePurchase = async (req, res) => {
  const purchaseId = parseInt(req.params.id);
  try {
    const oldPurchase = await prisma.purchase.findFirst({ 
      where: { id: purchaseId, userId: req.user.userId }, 
      include: { items: true } 
    });
    
    if (!oldPurchase) return res.status(404).json({ error: "Data transaksi tidak ditemukan" });

    // 1. Tarik Kembali (Kurangi) Stok Gudang yang sudah terlanjur ditambah
    for (const oldItem of oldPurchase.items) {
      const product = await prisma.product.findUnique({ where: { id: oldItem.productId } });
      if (product) {
        const targetProductId = product.parentId ? product.parentId : product.id;
        await prisma.product.update({ 
          where: { id: targetProductId }, 
          data: { stok: { decrement: parseFloat(oldItem.qty) } } 
        });
      }
    }
    
    // 2. Hapus catatan pembayaran manual yang berelasi
    const txs = await prisma.manualTransaction.findMany({
      where: { userId: req.user.userId, keterangan: { contains: `SYS_PELUNASAN_PUR_${purchaseId}` } }
    });
    const toDeleteIds = txs.filter(tx => tx.keterangan === `SYS_PELUNASAN_PUR_${purchaseId}` || tx.keterangan.includes(`SYS_PELUNASAN_PUR_${purchaseId})`)).map(tx => tx.id);
    if (toDeleteIds.length > 0) {
        await prisma.manualTransaction.deleteMany({ where: { id: { in: toDeleteIds } } });
    }

    // 3. Hapus Data
    await prisma.purchaseItem.deleteMany({ where: { purchaseId } });
    await prisma.purchase.delete({ where: { id: purchaseId } });
    
    res.json({ message: "Data Nota berhasil dihapus dan stok dikembalikan" });
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const getCashFlow = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await prisma.order.findMany({ where: { userId, dp: { gt: 0 } }, include: { customer: true } });
    const purchases = await prisma.purchase.findMany({ where: { userId, totalBayar: { gt: 0 } }, include: { supplier: true } });
    const manuals = await prisma.manualTransaction.findMany({ where: { userId } });

    let transactions = [];

    orders.forEach(o => {
      const pembayaranSusulan = manuals.filter(m => m.keterangan === `SYS_PELUNASAN_ORD_${o.id}` || m.keterangan.includes(`SYS_PELUNASAN_ORD_${o.id})`));
      const totalUangSusulan = pembayaranSusulan.reduce((sum, m) => sum + m.nominal, 0);
      const uangMasukAwal = o.dp - totalUangSusulan;
      if (uangMasukAwal > 0) {
        transactions.push({ id: `AUTO-ORD-${o.id}`, isAuto: true, tipe: 'PEMASUKAN', nama: o.customer?.nama || 'Pelanggan', nominal: uangMasukAwal, tanggal: o.tanggal, metode: o.metodeBayar || 'TF', keterangan: 'Uang Muka (DP) Awal / Pembayaran Pertama', buktiLink: o.buktiLunas || o.buktiDp || '' });
      }
    });

    purchases.forEach(p => {
      const pembayaranSusulan = manuals.filter(m => m.keterangan === `SYS_PELUNASAN_PUR_${p.id}` || m.keterangan.includes(`SYS_PELUNASAN_PUR_${p.id})`));
      const totalUangSusulan = pembayaranSusulan.reduce((sum, m) => sum + m.nominal, 0);
      const uangKeluarAwal = p.totalBayar - totalUangSusulan;
      if (uangKeluarAwal > 0) {
        transactions.push({ id: `AUTO-PUR-${p.id}`, isAuto: true, tipe: 'PENGELUARAN', nama: p.supplier?.nama || 'Supplier', nominal: uangKeluarAwal, tanggal: p.tanggal, metode: 'TF', keterangan: `Uang Muka (DP) Awal ke Pabrik`, buktiLink: p.buktiBayar || p.buktiNota || '' });
      }
    });

    manuals.forEach(m => {
      transactions.push({ id: `MAN-${m.id}`, dbId: m.id, isAuto: false, tipe: m.tipe, nama: m.nama, nominal: m.nominal, tanggal: m.tanggal, metode: m.metode, keterangan: m.keterangan || '', buktiLink: m.buktiLink || '' });
    });

    transactions.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    res.json(transactions);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const createManualTransaction = async (req, res) => {
  const { tipe, nama, nominal, tanggal, metode, keterangan, buktiLink } = req.body;
  try {
    const newTx = await prisma.manualTransaction.create({
      data: { userId: req.user.userId, tipe, nama, nominal: parseFloat(nominal), tanggal: tanggal ? new Date(tanggal) : new Date(), metode: metode || 'CASH', keterangan: keterangan || '', buktiLink: buktiLink || '' }
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

    if (tx.keterangan.includes('SYS_PELUNASAN_ORD_')) {
        const match = tx.keterangan.match(/SYS_PELUNASAN_ORD_(\d+)/);
        if (match) { await prisma.order.update({ where: { id: parseInt(match[1]) }, data: { dp: { increment: selisih } } }); }
    } else if (tx.keterangan.includes('SYS_PELUNASAN_PUR_')) {
        const match = tx.keterangan.match(/SYS_PELUNASAN_PUR_(\d+)/);
        if (match) { await prisma.purchase.update({ where: { id: parseInt(match[1]) }, data: { totalBayar: { increment: selisih } } }); }
    }

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
      data: { tipe: req.body.tipe, nama: req.body.nama, nominal: parseFloat(req.body.nominal), tanggal: req.body.tanggal ? new Date(req.body.tanggal) : new Date(), metode: req.body.metode || 'CASH', keterangan: newKet, buktiLink: req.body.buktiLink || '' }
    });
    res.json(updatedTx);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const deleteManualTransaction = async (req, res) => {
  try {
    const tx = await prisma.manualTransaction.findFirst({ where: { id: parseInt(req.params.id), userId: req.user.userId } });
    if (!tx) return res.status(404).json({ error: "Not found" });

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