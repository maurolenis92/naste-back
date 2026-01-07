import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { validateRequest } from '../middlewares/validateRequest';
import {
  createProductSchema,
  updateProductSchema,
  getProductByIdSchema,
  deleteProductSchema,
  listProductsSchema,
} from '../schemas/product.schema';

const router = Router();

router.get('/', validateRequest(listProductsSchema), (req, res, next) =>
  productController.listProducts(req, res, next)
);

router.get('/:id', validateRequest(getProductByIdSchema), (req, res, next) =>
  productController.getProductById(req, res, next)
);

router.post('/', validateRequest(createProductSchema), (req, res, next) =>
  productController.createProduct(req, res, next)
);

router.put('/:id', validateRequest(updateProductSchema), (req, res, next) =>
  productController.updateProduct(req, res, next)
);

router.delete('/:id', validateRequest(deleteProductSchema), (req, res, next) =>
  productController.deleteProduct(req, res, next)
);

export default router;
