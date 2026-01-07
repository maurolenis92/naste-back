import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { invoiceService } from '../services/invoice.service';
import { ListInvoicesQuery } from '../schemas/invoice.schema';

export class InvoiceController {
  // GET /api/invoices
  async listInvoices(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const filters = req.query as unknown as ListInvoicesQuery;
      const invoices = await invoiceService.listInvoices(filters);
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/invoices/:id
  async getInvoiceById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const invoice = await invoiceService.getInvoiceById(req.params.id);
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/invoices
  async createInvoice(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // El usuario ya fue autenticado y existe en la DB (auto-provisioning)
      const cognitoId = req.user!.cognitoId;
      const invoice = await invoiceService.createInvoice(req.body, cognitoId);
      res.status(201).json(invoice);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/invoices/:id
  async updateInvoice(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const invoice = await invoiceService.updateInvoice(
        req.params.id,
        req.body
      );
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/invoices/:id/status
  async updateInvoiceStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const invoice = await invoiceService.updateInvoiceStatus(
        req.params.id,
        req.body
      );
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/invoices/:id
  async deleteInvoice(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      await invoiceService.deleteInvoice(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const invoiceController = new InvoiceController();
