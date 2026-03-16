import express from 'express';
import { getProfitData } from '../controllers/profitController.js';

const router = express.Router();
router.get('/', getProfitData);

export default router;