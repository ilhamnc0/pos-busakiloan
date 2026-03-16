import prisma from '../lib/prisma.js';

export const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({ 
      include: { parent: true, category: true }, // Pastikan category di-include
      orderBy: { nama: 'asc' } 
    });
    res.json(products);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const upsertProduct = async (req, res) => {
  // PERBAIKAN: Tangkap satuanBeli dan satuanJual dari frontend
  const { id, nama, kategori, categoryId, hargaJual, hpp, stok, parentId, isHppManual, satuanBeli, satuanJual } = req.body;
  
  try {
    const data = {
      nama,
      kategori: kategori || 'UMUM',
      categoryId: categoryId ? parseInt(categoryId) : null,
      hargaJual: parseFloat(hargaJual || 0),
      hpp: parseFloat(hpp || 0),
      stok: parseFloat(stok || 0),
      parentId: parentId ? parseInt(parentId) : null,
      isHppManual: isHppManual === true,
      
      // TANGKAP DATA SATUAN BARU
      satuanBeli: satuanBeli || "kg",    
      satuanJual: satuanJual || "pcs"    
    };

    let savedProduct;
    if (id) {
      savedProduct = await prisma.product.update({ where: { id: parseInt(id) }, data });
    } else {
      savedProduct = await prisma.product.create({ data });
    }

    // LOGIKA HPP NILAI TENGAH (AVERAGE) - TETAP DIPERTAHANKAN AMAN
    if (data.parentId) {
      const parent = await prisma.product.findUnique({ where: { id: data.parentId }, include: { children: true } });
      if (parent && !parent.isHppManual && parent.children.length > 0) {
        const avgHpp = parent.children.reduce((sum, child) => sum + child.hpp, 0) / parent.children.length;
        await prisma.product.update({ where: { id: parent.id }, data: { hpp: avgHpp } });
      }
    }
    
    if (!data.parentId && !data.isHppManual && id) {
      const children = await prisma.product.findMany({ where: { parentId: parseInt(id) } });
      if (children.length > 0) {
        const avgHpp = children.reduce((sum, child) => sum + child.hpp, 0) / children.length;
        await prisma.product.update({ where: { id: parseInt(id) }, data: { hpp: avgHpp } });
      }
    }

    res.json(savedProduct);
  } catch (error) { 
    res.status(400).json({ error: error.message }); 
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Produk dihapus" });
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const createProduct = upsertProduct;

export const getStockHistory = async (req, res) => {
  const productId = parseInt(req.params.id);
  try {
    const purchases = await prisma.purchaseItem.findMany({
      where: { productId },
      include: { purchase: { include: { supplier: true } } }
    });

    const sales = await prisma.orderItem.findMany({
      where: { productId },
      include: { order: { include: { customer: true } } }
    });

    let history = [];
    purchases.forEach(p => {
      history.push({
        id: `IN-${p.id}`,
        tanggal: p.purchase.tanggal,
        tipe: 'MASUK',
        qty: p.qty,
        keterangan: `Restock dari Supplier: ${p.purchase.supplier?.nama || 'Unknown'}`,
        ref: `Nota Masuk #${p.purchase.id}`
      });
    });

    sales.forEach(s => {
      history.push({
        id: `OUT-${s.id}`,
        tanggal: s.order.tanggal,
        tipe: 'KELUAR',
        qty: s.qty,
        keterangan: `Terjual ke: ${s.order.customer?.nama || 'Pelanggan'}`,
        ref: `Order #${s.order.id}`
      });
    });

    history.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    res.json(history);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const getCategories = async (req, res) => {
  try {
    const cats = await prisma.category.findMany({ orderBy: { nama: 'asc' } });
    res.json(cats);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const createCategory = async (req, res) => {
  try {
    const cat = await prisma.category.create({ data: { nama: req.body.nama } });
    res.json(cat);
  } catch (error) { res.status(400).json({ error: "Gagal/Kategori sudah ada" }); }
};

export const getGlobalHistory = async (req, res) => {
  try {
    const purchases = await prisma.purchaseItem.findMany({
      include: { purchase: { include: { supplier: true } }, product: true }
    });
    const sales = await prisma.orderItem.findMany({
      include: { order: { include: { customer: true } }, product: true }
    });

    let history = [];
    purchases.forEach(p => history.push({
      id: `IN-${p.id}`, tanggal: p.purchase.tanggal, tipe: 'MASUK', qty: p.qty,
      productName: p.product.nama, keterangan: p.purchase.supplier?.nama || 'Unknown', ref: `Nota #${p.purchase.id}`
    }));
    sales.forEach(s => history.push({
      id: `OUT-${s.id}`, tanggal: s.order.tanggal, tipe: 'KELUAR', qty: s.qty,
      productName: s.product.nama, keterangan: s.order.customer?.nama || 'Unknown', ref: `Order #${s.order.id}`
    }));

    history.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    res.json(history);
  } catch (error) { res.status(500).json({ error: error.message }); }
};