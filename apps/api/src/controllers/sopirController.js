import prisma from '../lib/prisma.js';

export const getSopir = async (req, res) => {
  try {
    const sopir = await prisma.sopir.findMany({
      where: { userId: req.user.userId },
      include: { ongkir: true },
      orderBy: { nama: 'asc' }
    });
    res.json(sopir);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const upsertSopir = async (req, res) => {
  const { id, nama, kontak, ongkir } = req.body; 
  try {
    if (id) {
      const cek = await prisma.sopir.findFirst({ where: { id: parseInt(id), userId: req.user.userId }});
      if(!cek) return res.status(403).json({ error: "Akses ditolak" });

      await prisma.ongkirSopir.deleteMany({ where: { sopirId: parseInt(id) } });
      const updated = await prisma.sopir.update({
        where: { id: parseInt(id) },
        data: { nama, kontak, ongkir: { create: ongkir.map(o => ({ daerah: o.daerah, tarif: parseFloat(o.tarif) })) } },
        include: { ongkir: true }
      });
      res.json(updated);
    } else {
      const created = await prisma.sopir.create({
        data: { userId: req.user.userId, nama, kontak, ongkir: { create: ongkir.map(o => ({ daerah: o.daerah, tarif: parseFloat(o.tarif) })) } },
        include: { ongkir: true }
      });
      res.json(created);
    }
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const deleteSopir = async (req, res) => {
  try {
    await prisma.sopir.deleteMany({ where: { id: parseInt(req.params.id), userId: req.user.userId } });
    res.json({ message: "Sopir dihapus" });
  } catch (error) { res.status(400).json({ error: error.message }); }
};