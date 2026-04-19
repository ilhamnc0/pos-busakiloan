import prisma from '../lib/prisma.js';

export const getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { userId: req.user.userId }, // KUNCI MULTI-TENANT
      include: { 
        hargaKhusus: { include: { product: true } },
        orders: {
          where: { status: { in: ['TERKIRIM', 'SELESAI'] } },
          orderBy: { tanggal: 'desc' },
          take: 1 
        }
      }, 
      orderBy: { nama: 'asc' }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const upsertCustomer = async (req, res) => {
    const { id, nama, alamat, kontak, ongkirDefault, ongkirPerusahaanDefault, catatan } = req.body;
    try {
        const data = {
            nama,
            alamat: alamat || "",
            kontak: kontak || "",
            ongkirDefault: parseFloat(ongkirDefault || 0),
            ongkirPerusahaanDefault: parseFloat(ongkirPerusahaanDefault || 0),
            catatan: catatan || "" 
        };
        
        if (id) {
            // Cek kepemilikan sebelum update
            const cek = await prisma.customer.findFirst({ where: { id: parseInt(id), userId: req.user.userId }});
            if (!cek) return res.status(403).json({ error: "Akses ditolak" });
            const updated = await prisma.customer.update({ where: { id: parseInt(id) }, data });
            res.json(updated);
        } else {
            // Sisipkan userId saat create
            const created = await prisma.customer.create({ data: { ...data, userId: req.user.userId } });
            res.json(created);
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteCustomer = async (req, res) => {
    try {
        const deleted = await prisma.customer.deleteMany({ where: { id: parseInt(req.params.id), userId: req.user.userId } });
        if (deleted.count === 0) return res.status(404).json({ error: "Data tidak ditemukan" });
        res.json({ message: "Berhasil dihapus" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const addSpecialPrice = async (req, res) => {
  const { customerId, productId, harga } = req.body;
  try {
    // Validasi apakah pelanggan ini milik user yang login
    const cek = await prisma.customer.findFirst({ where: { id: parseInt(customerId), userId: req.user.userId }});
    if(!cek) return res.status(403).json({ error: "Akses ditolak" });

    const result = await prisma.hargaKhusus.upsert({
      where: { customerId_productId: { customerId: parseInt(customerId), productId: parseInt(productId) } },
      update: { harga: parseFloat(harga) },
      create: { customerId: parseInt(customerId), productId: parseInt(productId), harga: parseFloat(harga) }
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const removeSpecialPrice = async (req, res) => {
  try {
    await prisma.hargaKhusus.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Harga khusus dihapus" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};