import { prisma } from '../utils/prisma';
import {
  CreateProductInput,
  UpdateProductInput,
  ListProductsQuery,
} from '../schemas/product.schema';
import { AppError } from '../middlewares/errorHandler';
import { PaginatedResponse, calculatePagination } from '../types/pagination';

export class ProductService {
  // Listar productos con paginación y filtros
  async listProducts(
    filters?: ListProductsQuery
  ): Promise<PaginatedResponse<any>> {
    const page = Number(filters?.page) || 1;
    const pageSize = Number(filters?.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    // Filtro por estado activo
    if (filters?.isActive !== undefined) {
      where.isActive = Boolean(filters.isActive);
    }

    // Búsqueda por código o descripción
    if (filters?.search) {
      where.OR = [
        { code: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Filtros por rango de precio
    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = Number(filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = Number(filters.maxPrice);
      }
    }

    // Obtener total de items
    const totalItems = await prisma.product.count({ where });

    // Obtener items paginados
    const data = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });

    // Calcular metadata de paginación
    const pagination = calculatePagination(totalItems, page, pageSize);

    return {
      data,
      pagination,
    };
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
