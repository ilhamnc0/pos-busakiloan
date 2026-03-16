import prisma from '../lib/prisma.js';

export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { nama: 'asc' } });
    res.json(suppliers);
  } catch (error) { 
    res.status(500).json({ error: error.message }); 
  }
};

export const upsertSupplier = async (req, res) => {
  const { id, nama, kontak, alamat } = req.body;
  try {
    if (id) {
      const updated = await prisma.supplier.update({ 
        where: { id: parseInt(id) }, 
        data: { nama, kontak, alamat } 
      });
      res.json(updated);
    } else {
      const created = await prisma.supplier.create({ 
        data: { nama, kontak: kontak || '', alamat: alamat || '' } 
      });
      res.json(created);
    }
  } catch (error) { 
    res.status(400).json({ error: error.message }); 
  }
};

export const deleteSupplier = async (req, res) => {
  try {
    await prisma.supplier.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Supplier berhasil dihapus" });
  } catch (error) {
    res.status(400).json({ error: "Gagal dihapus. Pastikan supplier ini tidak memiliki riwayat transaksi." });
  }
};