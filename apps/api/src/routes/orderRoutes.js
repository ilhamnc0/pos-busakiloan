import express from 'express';
import { 
  getOrders, 
  createOrder, 
  updateOrder, 
  deleteOrder, 
  updateOrderDueDate,
  updateOrderPayment // Import fungsi baru
} from '../controllers/orderController.js';

const router = express.Router();

router.get('/', getOrders);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);
router.put('/:id/duedate', updateOrderDueDate);

// Rute baru untuk update pembayaran dari halaman Piutang
router.put('/:id/payment', updateOrderPayment);

export default router;