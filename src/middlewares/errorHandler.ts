import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError, ZodIssue } from 'zod';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Errores de validación de Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.issues.map((e: ZodIssue) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Errores personalizados de la aplicación
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Errores de Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Registro duplicado
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate entry',
        field: err.meta?.target,
      });
    }

    // Registro no encontrado
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Record not found',
      });
    }

    // Violación de foreign key
    if (err.code === 'P2003') {
      return res.status(400).json({
        error: 'Invalid reference',
      });
    }
  }

  // Error genérico
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
