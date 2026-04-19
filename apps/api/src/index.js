import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Middleware Satpam
import { verifyToken } from './middleware/authMiddleware.js';

// Import Routes
import dashboardRoutes from './routes/dashboardRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import profitRoutes from './routes/profitRoutes.js';
import sopirRoutes from './routes/sopirRoutes.js'; 
import authRoutes from './routes/authRoutes.js';
import exportRoutes from './routes/exportRoutes.js';

dotenv.config();
const app = express();

app.use(cors());

// Limit dinaikkan ke 50mb agar aman untuk upload gambar Base64 resolusi tinggi
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' })); 

// ==========================================
// RUTE TERBUKA (PUBLIC) - Bebas Akses
// ==========================================
app.use('/api/auth', authRoutes);

// ==========================================
// RUTE TERTUTUP (PRIVATE) - Wajib Bawa Token
// ==========================================
app.use('/api/dashboard', verifyToken, dashboardRoutes);
app.use('/api/customers', verifyToken, customerRoutes);
app.use('/api/products', verifyToken, productRoutes);
app.use('/api/orders', verifyToken, orderRoutes);
app.use('/api/suppliers', verifyToken, supplierRoutes); 
app.use('/api/purchases', verifyToken, purchaseRoutes);
app.use('/api/finance', verifyToken, financeRoutes);
app.use('/api/profit', verifyToken, profitRoutes);
app.use('/api/sopir', verifyToken, sopirRoutes);
app.use('/api/export', verifyToken, exportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server BE jalan di port ${PORT} dengan Keamanan Multi-Tenant`);
});

export default app;