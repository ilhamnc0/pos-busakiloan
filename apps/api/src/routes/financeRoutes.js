import express from 'express';
import { getCashFlow, createManualTransaction, updateManualTransaction, deleteManualTransaction } from '../controllers/financeController.js';

const router = express.Router();

router.get('/', getCashFlow);
router.post('/manual', createManualTransaction);
router.put('/manual/:id', updateManualTransaction); // <-- RUTE BARU UNTUK EDIT
router.delete('/manual/:id', deleteManualTransaction);

export default router;