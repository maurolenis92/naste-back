import { prisma } from '../utils/prisma';

export class UserService {
  // Obtener o crear usuario automáticamente
  async getOrCreateUser(cognitoId: string, email: string, name?: string) {
    // Intentar encontrar usuario existente
    let user = await prisma.user.findUnique({
      where: { cognitoId },
    });

    // Si no existe, crearlo
    if (!user) {
      user = await prisma.user.create({
        data: {
          cognitoId,
          email,
          name,
        },
      });
    }

    return user;
  }

  // Obtener usuario por ID
  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  // Obtener usuario por cognitoId
  async getUserByCognitoId(cognitoId: string) {
    return prisma.user.findUnique({
      where: { cognitoId },
    });
  }

  // Actualizar información del usuario
  async updateUser(id: string, data: { name?: string; email?: string }) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }
}

export const userService = new UserService();
