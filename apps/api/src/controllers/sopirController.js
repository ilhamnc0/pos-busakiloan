import prisma from '../lib/prisma.js';

export const getSopir = async (req, res) => {
  try {
    const sopir = await prisma.sopir.findMany({
      include: { ongkir: true },
      orderBy: { nama: 'asc' }
    });
    res.json(sopir);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const upsertSopir = async (req, res) => {
  const { id, nama, kontak, ongkir } = req.body; // ongkir adalah array of { daerah, tarif }
  try {
    if (id) {
      // Hapus ongkir lama, timpa dengan yang baru
      await prisma.ongkirSopir.deleteMany({ where: { sopirId: parseInt(id) } });
      const updated = await prisma.sopir.update({
        where: { id: parseInt(id) },
        data: {
          nama, kontak,
          ongkir: { create: ongkir.map(o => ({ daerah: o.daerah, tarif: parseFloat(o.tarif) })) }
        },
        include: { ongkir: true }
      });
      res.json(updated);
    } else {
      const created = await prisma.sopir.create({
        data: {
          nama, kontak,
          ongkir: { create: ongkir.map(o => ({ daerah: o.daerah, tarif: parseFloat(o.tarif) })) }
        },
        include: { ongkir: true }
      });
      res.json(created);
    }
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const deleteSopir = async (req, res) => {
  try {
    await prisma.sopir.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Sopir dihapus" });
  } catch (error) { res.status(400).json({ error: error.message }); }
};