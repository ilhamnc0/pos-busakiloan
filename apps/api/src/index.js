import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

dotenv.config();
const app = express();

app.use(cors());

// Limit dinaikkan ke 50mb agar aman untuk upload gambar Base64 resolusi tinggi
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' })); 

// Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/suppliers', supplierRoutes); 
app.use('/api/purchases', purchaseRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/profit', profitRoutes);
app.use('/api/sopir', sopirRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server BE jalan di port ${PORT}`);
});