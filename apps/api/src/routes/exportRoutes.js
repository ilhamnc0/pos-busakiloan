import express from 'express';
import { exportData, bulkDeleteData } from '../controllers/exportController.js';

const router = express.Router();

router.get('/', exportData);
router.post('/delete', bulkDeleteData);

export default router;