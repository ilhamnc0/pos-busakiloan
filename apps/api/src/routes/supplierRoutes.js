import express from 'express';
import { getSuppliers, upsertSupplier, deleteSupplier } from '../controllers/purchaseController.js';

const router = express.Router();

router.get('/', getSuppliers);
router.post('/upsert', upsertSupplier);
router.delete('/:id', deleteSupplier); // <--- TAMBAHAN BARU

export default router;