import express from 'express';
import { getSopir, upsertSopir, deleteSopir } from '../controllers/sopirController.js';

const router = express.Router();

// Route untuk mengambil semua data sopir beserta ongkirnya
router.get('/', getSopir);

// Route untuk membuat baru atau mengupdate data sopir (termasuk list ongkir)
router.post('/upsert', upsertSopir);

// Route untuk menghapus data sopir berdasarkan ID
router.delete('/:id', deleteSopir);

export default router;