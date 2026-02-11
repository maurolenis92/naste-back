import { z } from 'zod';
import { InvoiceStatus, InvoiceOrigin, PaymentMethod } from '@prisma/client';

// Schema para items de factura
const invoiceItemSchema = z.object({
  productId: z.uuid().optional().nullable(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
});

// Schema para crear factura
export const createInvoiceSchema = z.object({
  body: z.object({
    status: z.enum(InvoiceStatus).default(InvoiceStatus.PENDING),
    origin: z.enum(InvoiceOrigin),
    paymentMethod: z.enum(PaymentMethod),

    customerName: z.string().min(1, 'Customer name is required'),
    customerIdDoc: z.string().min(1, 'Customer ID document is required'),
    customerPhone: z.string().min(1, 'Customer phone is required'),
    customerEmail: z.email().optional().nullable(),

    city: z.string().min(1, 'City is required'),
    neighborhood: z.string().min(1, 'Neighborhood is required'),
    address: z.string().min(1, 'Address is required'),

    deliveryDate: z.iso.datetime().optional().nullable(),

    items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  }),
});

// Schema para actualizar factura
export const updateInvoiceSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid invoice ID'),
  }),
  body: z.object({
    status: z.enum(InvoiceStatus).optional(),
    origin: z.enum(InvoiceOrigin).optional(),
    paymentMethod: z.enum(PaymentMethod).optional(),

    customerName: z.string().min(1).optional(),
    customerIdDoc: z.string().min(1).optional(),
    customerPhone: z.string().min(1).optional(),
    customerEmail: z.email().optional().nullable(),

    city: z.string().min(1).optional(),
    neighborhood: z.string().min(1).optional(),
    address: z.string().min(1).optional(),

    deliveryDate: z.iso.datetime().optional().nullable(),

    items: z.array(invoiceItemSchema).min(1).optional(),
  }),
});

// Schema para actualizar solo el estado
export const updateInvoiceStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid invoice ID'),
  }),
  body: z.object({
    status: z.nativeEnum(InvoiceStatus),
  }),
});

// Schema para obtener factura por ID
export const getInvoiceByIdSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid invoice ID'),
  }),
});

// Schema para eliminar factura
export const deleteInvoiceSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid invoice ID'),
  }),
});

// Schema para query de listado
export const listInvoicesSchema = z.object({
  query: z.object({
    // Filtros
    status: z.nativeEnum(InvoiceStatus).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    createdById: z.string().uuid().optional(),
    search: z.string().optional(), // Búsqueda por cliente, documento o dirección
    origin: z.nativeEnum(InvoiceOrigin).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    city: z.string().optional(),

    // Paginación
    page: z
      .string()
      .optional()
      .transform(val => (val ? parseInt(val) : 1)),
    pageSize: z
      .string()
      .optional()
      .transform(val => (val ? parseInt(val) : 10)),
  }),
});

// Tipos inferidos
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>['body'];
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>['body'];
export type UpdateInvoiceStatusInput = z.infer<
  typeof updateInvoiceStatusSchema
>['body'];
export type ListInvoicesQuery = z.infer<typeof listInvoicesSchema>['query'];
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
