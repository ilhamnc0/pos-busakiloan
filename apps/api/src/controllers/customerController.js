import prisma from '../lib/prisma.js';

export const getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: { 
        hargaKhusus: { include: { product: true } },
        // TARIK DATA ORDER UNTUK MENCARI TANGGAL TERAKHIR (Hanya yang sah)
        orders: {
          where: {
            status: { in: ['TERKIRIM', 'SELESAI'] }
          },
          orderBy: { tanggal: 'desc' },
          take: 1 // Ambil 1 yang paling baru saja agar hemat memori
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
            const updated = await prisma.customer.update({ where: { id: parseInt(id) }, data });
            res.json(updated);
        } else {
            const created = await prisma.customer.create({ data });
            res.json(created);
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteCustomer = async (req, res) => {
    try {
        await prisma.customer.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: "Berhasil dihapus" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const addSpecialPrice = async (req, res) => {
  const { customerId, productId, harga } = req.body;
  try {
    const result = await prisma.hargaKhusus.upsert({
      where: {
        customerId_productId: {
          customerId: parseInt(customerId),
          productId: parseInt(productId)
        }
      },
      update: { harga: parseFloat(harga) },
      create: {
        customerId: parseInt(customerId),
        productId: parseInt(productId),
        harga: parseFloat(harga)
      }
    });
    res.json(result);
  } catch (error) {
    console.error("Gagal set harga khusus:", error);
    res.status(400).json({ error: error.message });
  }
};

export const removeSpecialPrice = async (req, res) => {
  const { id } = req.params; 
  try {
    await prisma.hargaKhusus.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Harga khusus dihapus, kembali ke harga normal." });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};