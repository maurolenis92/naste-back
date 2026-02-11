import { prisma } from '../utils/prisma';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  UpdateInvoiceStatusInput,
  ListInvoicesQuery,
  InvoiceItemInput,
} from '../schemas/invoice.schema';
import { AppError } from '../middlewares/errorHandler';
import { productService } from './product.service';
import { InvoiceStatus } from '@prisma/client';
import { PaginatedResponse, calculatePagination } from '../types/pagination';

export class InvoiceService {
  // Calcular subtotal de un item
  private calculateItemSubtotal(item: InvoiceItemInput): number {
    return item.quantity * item.unitPrice;
  }

  // Calcular total de la factura
  private calculateTotal(items: InvoiceItemInput[]): number {
    return items.reduce(
      (total, item) => total + this.calculateItemSubtotal(item),
      0
    );
  }

  // Listar facturas con filtros y paginación
  async listInvoices(
    filters?: ListInvoicesQuery
  ): Promise<PaginatedResponse<any>> {
    const page = Number(filters?.page) || 1;
    const pageSize = Number(filters?.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    // Filtro por estado
    if (filters?.status) {
      where.status = filters.status;
    }

    // Filtro por fechas
    if (filters?.startDate || filters?.endDate) {
      where.invoiceDate = {};
      if (filters?.startDate) {
        where.invoiceDate.gte = new Date(filters.startDate);
      }
      if (filters?.endDate) {
        where.invoiceDate.lte = new Date(filters.endDate);
      }
    }

    // Filtro por usuario creador
    if (filters?.createdById) {
      where.createdById = filters.createdById;
    }

    // Filtro por origen
    if (filters?.origin) {
      where.origin = filters.origin;
    }

    // Filtro por método de pago
    if (filters?.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    // Filtro por ciudad
    if (filters?.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    // Búsqueda general
    if (filters?.search) {
      where.OR = [
        { customerName: { contains: filters.search, mode: 'insensitive' } },
        { customerIdDoc: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
        { neighborhood: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Obtener total de items
    const totalItems = await prisma.invoice.count({ where });

    // Obtener items paginados
    const data = await prisma.invoice.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { invoiceDate: 'desc' },
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

  // Obtener factura por ID
  async getInvoiceById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    return invoice;
  }

  // Crear factura
  async createInvoice(data: CreateInvoiceInput, cognitoId: string) {
    // Obtener usuario por cognitoId
    const user = await prisma.user.findUnique({
      where: { cognitoId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Preparar items y validar productos
    const itemsData = await Promise.all(
      data.items.map(async item => {
        // Si tiene productId, validar que existe y obtener datos
        if (item.productId) {
          const product = await productService.getProductById(item.productId);

          // Verificar stock disponible
          if (product.stock < item.quantity) {
            throw new AppError(
              `Insufficient stock for product ${product.code}. Available: ${product.stock}, Requested: ${item.quantity}`,
              400
            );
          }
        }

        return {
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: this.calculateItemSubtotal(item),
        };
      })
    );

    // Calcular total
    const total = this.calculateTotal(data.items);

    // Crear factura con items
    const invoice = await prisma.invoice.create({
      data: {
        createdById: user.id,
        status: data.status,
        origin: data.origin,
        paymentMethod: data.paymentMethod,
        customerName: data.customerName,
        customerIdDoc: data.customerIdDoc,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        city: data.city,
        neighborhood: data.neighborhood,
        address: data.address,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        total,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Descontar stock de productos
    await Promise.all(
      data.items.map(async item => {
        if (item.productId) {
          await productService.decreaseStock(item.productId, item.quantity);
        }
      })
    );

    return invoice;
  }

  // Actualizar factura
  async updateInvoice(id: string, data: UpdateInvoiceInput) {
    const existingInvoice = await this.getInvoiceById(id);

    // Si se actualizan los items, manejar stock
    if (data.items) {
      // Restaurar stock de items anteriores que tenían productId
      await Promise.all(
        existingInvoice.items.map(async item => {
          if (item.productId) {
            await productService.increaseStock(item.productId, item.quantity);
          }
        })
      );

      // Validar y preparar nuevos items
      const itemsData = await Promise.all(
        data.items.map(async item => {
          if (item.productId) {
            const product = await productService.getProductById(item.productId);

            if (product.stock < item.quantity) {
              throw new AppError(
                `Insufficient stock for product ${product.code}. Available: ${product.stock}, Requested: ${item.quantity}`,
                400
              );
            }
          }

          return {
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: this.calculateItemSubtotal(item),
          };
        })
      );

      const total = this.calculateTotal(data.items);

      // Eliminar items anteriores y crear nuevos
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      const invoice = await prisma.invoice.update({
        where: { id },
        data: {
          status: data.status,
          origin: data.origin,
          paymentMethod: data.paymentMethod,
          customerName: data.customerName,
          customerIdDoc: data.customerIdDoc,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          city: data.city,
          neighborhood: data.neighborhood,
          address: data.address,
          deliveryDate: data.deliveryDate
            ? new Date(data.deliveryDate)
            : undefined,
          total,
          items: {
            create: itemsData,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Descontar stock de nuevos items
      await Promise.all(
        data.items.map(async item => {
          if (item.productId) {
            await productService.decreaseStock(item.productId, item.quantity);
          }
        })
      );

      return invoice;
    }

    // Actualizar solo campos sin items
    return prisma.invoice.update({
      where: { id },
      data: {
        status: data.status,
        origin: data.origin,
        paymentMethod: data.paymentMethod,
        customerName: data.customerName,
        customerIdDoc: data.customerIdDoc,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        city: data.city,
        neighborhood: data.neighborhood,
        address: data.address,
        deliveryDate: data.deliveryDate
          ? new Date(data.deliveryDate)
          : undefined,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Actualizar solo el estado
  async updateInvoiceStatus(id: string, data: UpdateInvoiceStatusInput) {
    const existingInvoice = await this.getInvoiceById(id);

    // Si se cancela una factura que no estaba cancelada, restaurar stock
    if (
      data.status === InvoiceStatus.CANCELLED &&
      existingInvoice.status !== InvoiceStatus.CANCELLED
    ) {
      await Promise.all(
        existingInvoice.items.map(async item => {
          if (item.productId) {
            await productService.increaseStock(item.productId, item.quantity);
          }
        })
      );
    }

    return prisma.invoice.update({
      where: { id },
      data: {
        status: data.status,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Eliminar factura
  async deleteInvoice(id: string) {
    const invoice = await this.getInvoiceById(id);

    // Restaurar stock antes de eliminar
    await Promise.all(
      invoice.items.map(async item => {
        if (item.productId) {
          await productService.increaseStock(item.productId, item.quantity);
        }
      })
    );

    return prisma.invoice.delete({
      where: { id },
    });
  }
}

export const invoiceService = new InvoiceService();
