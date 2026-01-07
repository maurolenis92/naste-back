import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/product.routes';
import invoiceRoutes from './routes/invoice.routes';
import { errorHandler } from './middlewares/errorHandler';
import { authMiddleware } from './middlewares/auth.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check (sin autenticación)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'naste-api',
    timestamp: new Date().toISOString(),
  });
});

// Root
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🕯️ Naste API funcionando!',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      invoices: '/api/invoices',
    },
  });
});

// API Routes (protegidas con autenticación)
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/invoices', authMiddleware, invoiceRoutes);

// Error handler (debe ir al final)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
