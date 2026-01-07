import { prisma } from '../utils/prisma';
import {
  CreateProductInput,
  UpdateProductInput,
  ListProductsQuery,
} from '../schemas/product.schema';
import { AppError } from '../middlewares/errorHandler';

export class ProductService {
  // Listar productos
  async listProducts(filters?: ListProductsQuery) {
    const where =
      filters?.isActive !== undefined 
        ? { isActive: (filters.isActive as any) === 'true' || filters.isActive === true } 
        : {};

    return prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Obtener producto por ID
  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  // Obtener producto por código
  async getProductByCode(code: string) {
    return prisma.product.findUnique({
      where: { code },
    });
  }

  // Crear producto
  async createProduct(data: CreateProductInput) {
    // Verificar si el código ya existe
    const existing = await this.getProductByCode(data.code);
    if (existing) {
      throw new AppError('Product with this code already exists', 409);
    }

    return prisma.product.create({
      data,
    });
  }

  // Actualizar producto
  async updateProduct(id: string, data: UpdateProductInput) {
    // Verificar que el producto existe
    await this.getProductById(id);

    // Si se actualiza el código, verificar que no esté duplicado
    if (data.code) {
      const existing = await this.getProductByCode(data.code);
      if (existing && existing.id !== id) {
        throw new AppError('Product with this code already exists', 409);
      }
    }

    return prisma.product.update({
      where: { id },
      data,
    });
  }

  // Eliminar producto (soft delete)
  async deleteProduct(id: string) {
    await this.getProductById(id);

    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Descontar stock (usado al crear factura)
  async decreaseStock(productId: string, quantity: number) {
    const product = await this.getProductById(productId);

    if (product.stock < quantity) {
      throw new AppError(
        `Insufficient stock for product ${product.code}. Available: ${product.stock}`,
        400
      );
    }

    return prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });
  }

  // Aumentar stock (usado al cancelar factura)
  async increaseStock(productId: string, quantity: number) {
    return prisma.product.update({
      where: { id: productId },
      data: {
        stock: {
          increment: quantity,
        },
      },
    });
  }
}

export const productService = new ProductService();
