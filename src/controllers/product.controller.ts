import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { ListProductsQuery } from '../schemas/product.schema';

export class ProductController {
  // GET /api/products
  async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = req.query as unknown as ListProductsQuery;
      const products = await productService.listProducts(filters);
      res.json(products);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/products/:id
  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getProductById(req.params.id);
      res.json(product);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/products
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/products/:id
  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.updateProduct(
        req.params.id,
        req.body
      );
      res.json(product);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/products/:id
  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.deleteProduct(req.params.id);
      res.json(product);
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
