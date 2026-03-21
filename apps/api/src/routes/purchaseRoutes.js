import express from 'express';
import { getPurchases, createPurchase, updatePayment, updatePurchaseDueDate, updatePurchase } from '../controllers/purchaseController.js';

const router = express.Router();

router.get('/', getPurchases);
router.post('/', createPurchase);
router.put('/:id/payment', updatePayment);
router.put('/:id/duedate', updatePurchaseDueDate);
router.put('/:id', updatePurchase);

export default router;