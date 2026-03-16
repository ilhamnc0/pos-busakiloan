import prisma from '../lib/prisma.js';

export const getOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { customer: true, sopir: true, items: { include: { product: true } } },
      orderBy: { tanggal: 'desc' }
    });
    
    const processed = orders.map(o => ({
      ...o,
      grandTotal: (o.totalHarga || 0) + (o.ongkosKirim || 0),
      kekurangan: ((o.totalHarga || 0) + (o.ongkosKirim || 0)) - (o.dp || 0)
    }));
    res.json(processed);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

export const createOrder = async (req, res) => {
  const { customerId, sopirId, items, tanggal, dp, totalHarga, keterangan, ongkosKirim, ongkosKirimModal, metodeBayar, status, buktiLunas } = req.body;
  try {
    const newOrder = await prisma.order.create({
      data: {
        customerId: parseInt(customerId),
        sopirId: sopirId ? parseInt(sopirId) : null,
        tanggal: new Date(tanggal || new Date()),
        status: status || 'MENUNGGU',
        dp: parseFloat(dp || 0),
        totalHarga: parseFloat(totalHarga), 
        ongkosKirim: parseFloat(ongkosKirim || 0), 
        ongkosKirimModal: parseFloat(ongkosKirimModal || 0), 
        metodeBayar: metodeBayar || 'TF', 
        keterangan: keterangan || "",
        buktiLunas: buktiLunas || null, // MENYIMPAN LINK BUKTI TF
        items: {
          create: items.map(item => ({
            productId: parseInt(item.productId),
            qty: parseFloat(item.qty),
            hargaSatuan: parseFloat(item.hargaJual),
            hppSatuan: parseFloat(item.hppSatuan || 0), 
            subtotal: parseFloat(item.qty) * parseFloat(item.hargaJual)
          }))
        }
      }
    });

    for (const item of items) {
      await prisma.product.update({
        where: { id: parseInt(item.productId) },
        data: { stok: { decrement: parseFloat(item.qty) } }
      });
    }
    res.status(201).json(newOrder);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { status, dp, tanggal, keterangan, items, ongkosKirim, ongkosKirimModal, metodeBayar, sopirId, buktiLunas } = req.body;

  try {
    const orderId = parseInt(id);
    const oldOrder = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });

    if (!oldOrder) return res.status(404).json({ error: "Order tidak ditemukan" });

    if (oldOrder.status !== 'DIBATALKAN') {
      for (const oldItem of oldOrder.items) {
        await prisma.product.update({ where: { id: oldItem.productId }, data: { stok: { increment: oldItem.qty } } });
      }
    }

    if (status === 'DIBATALKAN') {
      const canceledOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'DIBATALKAN', dp: 0, keterangan: keterangan || oldOrder.keterangan }
      });
      return res.json(canceledOrder); 
    }

    await prisma.orderItem.deleteMany({ where: { orderId } });
    let newTotalHarga = 0;
    const newItemsData = [];

    for (const item of items) {
      const qty = parseFloat(item.qty);
      const hargaSatuan = parseFloat(item.hargaJual);
      const subtotal = qty * hargaSatuan;
      newTotalHarga += subtotal;

      newItemsData.push({
        productId: parseInt(item.productId), 
        qty: qty, 
        hargaSatuan: hargaSatuan, 
        hppSatuan: parseFloat(item.hppSatuan || 0), 
        subtotal: subtotal
      });
      await prisma.product.update({ where: { id: parseInt(item.productId) }, data: { stok: { decrement: qty } } });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status || oldOrder.status, 
        sopirId: sopirId ? parseInt(sopirId) : null,
        dp: parseFloat(dp || 0), 
        ongkosKirim: parseFloat(ongkosKirim || 0), 
        ongkosKirimModal: parseFloat(ongkosKirimModal || 0), 
        metodeBayar: metodeBayar || 'TF', 
        tanggal: new Date(tanggal),
        keterangan: keterangan || "", 
        totalHarga: newTotalHarga, 
        items: { create: newItemsData },
        buktiLunas: buktiLunas !== undefined ? buktiLunas : oldOrder.buktiLunas // UPDATE LINK BUKTI TF
      }
    });

    res.json(updatedOrder);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const orderId = parseInt(id);
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    
    if (order && order.status !== 'DIBATALKAN') {
      for (const item of order.items) {
        await prisma.product.update({ where: { id: item.productId }, data: { stok: { increment: item.qty } } });
      }
    }

    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: orderId } });
    res.json({ message: "Order dihapus" });
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const updateOrderDueDate = async (req, res) => {
  try {
    const updated = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { tanggalJatuhTempo: req.body.tanggalJatuhTempo ? new Date(req.body.tanggalJatuhTempo) : null }
    });
    res.json(updated);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

export const updateOrderPayment = async (req, res) => {
  const { id } = req.params;
  const { dp, status, buktiLunas } = req.body;

  try {
    const updated = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        dp: parseFloat(dp),
        status: status,
        buktiLunas: buktiLunas || null
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};