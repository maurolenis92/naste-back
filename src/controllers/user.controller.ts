import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { userService } from '../services/user.service';

export class UserController {
  // GET /api/user - Obtener información del usuario autenticado
  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      const cognitoId = req.user?.cognitoId;

      if (!cognitoId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Usuario no autenticado',
        });
      }

      // Obtener información completa del usuario
      const user = await userService.getUserByCognitoId(cognitoId);

      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Usuario no encontrado',
        });
      }

      return res.json({
        id: user.id,
        cognitoId: user.cognitoId,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (error) {
      console.error('Error getting current user:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error al obtener información del usuario',
      });
    }
  }
}

export const userController = new UserController();
