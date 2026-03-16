import express from 'express';
import { getPurchases, createPurchase, updatePayment, updatePurchaseDueDate } from '../controllers/purchaseController.js';

const router = express.Router();

router.get('/', getPurchases);
router.post('/', createPurchase);
router.put('/:id/payment', updatePayment);
router.put('/:id/duedate', updatePurchaseDueDate);

export default router;