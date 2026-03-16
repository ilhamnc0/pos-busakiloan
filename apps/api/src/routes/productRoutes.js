import express from 'express';
import { getProducts, upsertProduct, deleteProduct, getStockHistory, getCategories, createCategory, getGlobalHistory } from '../controllers/productController.js';

const router = express.Router();

// Rute Spesial (Harus diletakkan di atas rute '/:id')
router.get('/categories/all', getCategories);
router.post('/categories', createCategory);
router.get('/history/global', getGlobalHistory); 

// Rute Standar
router.get('/', getProducts);
router.post('/upsert', upsertProduct);
router.delete('/:id', deleteProduct);
router.get('/:id/history', getStockHistory);

export default router;