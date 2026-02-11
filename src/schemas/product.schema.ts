import { z } from 'zod';

// Schema para crear producto
export const createProductSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Code is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.number().positive('Price must be positive'),
    stock: z
      .number()
      .int()
      .nonnegative('Stock must be non-negative')
      .default(0),
    imageBase64: z.base64().optional(),
  }),
});

// Schema para actualizar producto
export const updateProductSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid product ID'),
  }),
  body: z.object({
    code: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().nonnegative().optional(),
    imageBase64: z.base64().optional(),
    isActive: z.boolean().optional(),
  }),
});

// Schema para obtener producto por ID
export const getProductByIdSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid product ID'),
  }),
});

// Schema para eliminar producto
export const deleteProductSchema = z.object({
  params: z.object({
    id: z.uuid('Invalid product ID'),
  }),
});

// Schema para query de listado
export const listProductsSchema = z.object({
  query: z.object({
    // Filtros
    isActive: z
      .string()
      .optional()
      .transform(val => val === 'true'),
    search: z.string().optional(), // Búsqueda por código o descripción
    minPrice: z
      .string()
      .optional()
      .transform(val => (val ? parseFloat(val) : undefined)),
    maxPrice: z
      .string()
      .optional()
      .transform(val => (val ? parseFloat(val) : undefined)),

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
export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ListProductsQuery = z.infer<typeof listProductsSchema>['query'];
