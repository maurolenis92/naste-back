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
    isActive: z
      .string()
      .optional()
      .transform(val => val === 'true'),
  }),
});

// Tipos inferidos
export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ListProductsQuery = z.infer<typeof listProductsSchema>['query'];
