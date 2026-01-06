import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    service: 'naste-api',
    timestamp: new Date().toISOString() 
  });
});

// Root
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: '🕯️ Naste API funcionando!',
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});