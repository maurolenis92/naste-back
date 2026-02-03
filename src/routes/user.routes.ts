import { Router } from 'express';
import { userController } from '../controllers/user.controller';

const router = Router();

// GET /api/user - Obtener información del usuario autenticado
router.get('/', (req, res) => userController.getCurrentUser(req, res));

export default router;
