import { Router } from 'express';
import { invoiceController } from '../controllers/invoice.controller';
import { validateRequest } from '../middlewares/validateRequest';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema,
  getInvoiceByIdSchema,
  deleteInvoiceSchema,
  listInvoicesSchema,
} from '../schemas/invoice.schema';

const router = Router();

router.get('/', validateRequest(listInvoicesSchema), (req, res, next) =>
  invoiceController.listInvoices(req, res, next)
);

router.get('/:id', validateRequest(getInvoiceByIdSchema), (req, res, next) =>
  invoiceController.getInvoiceById(req, res, next)
);

router.post('/', validateRequest(createInvoiceSchema), (req, res, next) =>
  invoiceController.createInvoice(req, res, next)
);

router.put('/:id', validateRequest(updateInvoiceSchema), (req, res, next) =>
  invoiceController.updateInvoice(req, res, next)
);

router.patch(
  '/:id/status',
  validateRequest(updateInvoiceStatusSchema),
  (req, res, next) => invoiceController.updateInvoiceStatus(req, res, next)
);

router.delete('/:id', validateRequest(deleteInvoiceSchema), (req, res, next) =>
  invoiceController.deleteInvoice(req, res, next)
);

export default router;
