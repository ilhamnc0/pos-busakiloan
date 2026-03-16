import express from 'express';
import { 
  getCustomers, 
  upsertCustomer, 
  deleteCustomer, 
  addSpecialPrice,   // Import baru
  removeSpecialPrice // Import baru
} from '../controllers/customerController.js';

const router = express.Router();

router.get('/', getCustomers);
router.post('/upsert', upsertCustomer);
router.delete('/:id', deleteCustomer);

// Route Baru untuk Harga Khusus
router.post('/special-price', addSpecialPrice);
router.delete('/special-price/:id', removeSpecialPrice);

export default router;