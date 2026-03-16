import express from 'express';
import { getSuppliers, upsertSupplier, deleteSupplier } from '../controllers/supplierController.js';

const router = express.Router();

router.get('/', getSuppliers);
router.post('/upsert', upsertSupplier);
router.delete('/:id', deleteSupplier);

export default router;