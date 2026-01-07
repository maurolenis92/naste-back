import { Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AuthenticatedRequest } from '../types/express';
import { userService } from '../services/user.service';

// Configurar el verificador de JWT de Cognito
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID || '',
  tokenUse: 'id',
  clientId: process.env.COGNITO_CLIENT_ID || '',
});

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    // Extraer el token
    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar el token con Cognito
    const payload = await verifier.verify(token);

    // Extraer información del usuario del token
    const cognitoId = payload.sub;
    const email = payload.email as string;
    const name = payload.name as string | undefined;

    // Auto-provisioning: crear usuario si no existe
    const user = await userService.getOrCreateUser(cognitoId, email, name);

    // Agregar información del usuario al request
    req.user = {
      cognitoId: user.cognitoId,
      email: user.email,
      name: user.name || undefined,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};
