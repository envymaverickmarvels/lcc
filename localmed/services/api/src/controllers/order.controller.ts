import type { Response, NextFunction } from 'express';
import {
  orderService,
  pharmacyOrderService,
  inventoryService,
  analyticsService,
} from '../services/index.js';
import type { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';

const getParam = (param: string | string[] | undefined): string => param as string;

export class OrderController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        pharmacyId: z.string().uuid(),
        type: z.enum(['pickup', 'delivery']),
        items: z.array(
          z.object({
            medicineId: z.string().uuid(),
            quantity: z.number().int().positive(),
          })
        ).min(1),
        prescriptionId: z.string().uuid().optional(),
        notes: z.string().max(500).optional(),
        deliveryAddress: z
          .object({
            fullName: z.string(),
            phone: z.string(),
            addressLine1: z.string(),
            city: z.string(),
            state: z.string(),
            postalCode: z.string(),
            lat: z.number().optional(),
            lng: z.number().optional(),
          })
          .optional(),
      });

      const data = schema.parse(req.body);
      const order = await orderService.create(req.user!.id, data);

      res.status(201).json({
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          type: order.type,
          estimatedPickupTime: order.estimatedPickupTime,
          pharmacy: order.pharmacy,
          items: order.items,
          totalAmount: order.totalAmount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const order = await orderService.getById(id, req.user!.id);

      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  async getUserOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, page = '1', limit = '20' } = req.query;

      const result = await orderService.getUserOrders(req.user!.id, {
        status: status as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const schema = z.object({
        reason: z.enum(['found_elsewhere', 'no_longer_needed', 'wrong_items', 'other']).default('other'),
      });

      const { reason } = schema.parse(req.body);
      const reasonMap = {
        found_elsewhere: 'Found medicine elsewhere',
        no_longer_needed: 'No longer needed',
        wrong_items: 'Wrong items selected',
        other: 'Other',
      };

      const result = await orderService.cancel(id, req.user!.id, reasonMap[reason]);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async reorder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const result = await orderService.reorder(id, req.user!.id);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getDeliveryProviders(req: Request, res: Response, next: NextFunction) {
    try {
      const providers = [
        { id: '1', name: 'LocalMed Delivery', eta: '30-45 mins', fee: 50 },
        { id: '2', name: 'Partner Express', eta: '45-60 mins', fee: 35 },
      ];

      res.json({
        success: true,
        data: { providers },
      });
    } catch (error) {
      next(error);
    }
  }
}

export class PharmacyOrderController {
  async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, page = '1', limit = '20' } = req.query;

      const result = await pharmacyOrderService.getOrders(req.user!.id, {
        status: status as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await pharmacyOrderService.getStats(req.user!.id);

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const schema = z.object({
        status: z.enum(['confirmed', 'preparing', 'ready', 'completed', 'cancelled']),
      });

      const { status } = schema.parse(req.body);
      const updated = await pharmacyOrderService.updateStatus(req.user!.id, id, status);

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }
}

export class InventoryController {
  async getStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, category, lowStock, page = '1', limit = '20' } = req.query;

      const result = await inventoryService.getStock(req.user!.id, {
        search: search as string,
        category: category as string,
        lowStock: lowStock === 'true',
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async addStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        medicineId: z.string().uuid(),
        stockQuantity: z.number().int().min(0),
        sellingPrice: z.number().positive(),
        mrp: z.number().positive().optional(),
        costPrice: z.number().positive().optional(),
        batchNumber: z.string().optional(),
        expiryDate: z.string().optional(),
        reorderLevel: z.number().int().min(0).default(10),
      });

      const data = schema.parse(req.body);
      const stock = await inventoryService.addStock(req.user!.id, data);

      res.status(201).json({ success: true, data: stock });
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const schema = z.object({
        stockQuantity: z.number().int().min(0).optional(),
        sellingPrice: z.number().positive().optional(),
        isAvailable: z.boolean().optional(),
        reorderLevel: z.number().int().min(0).optional(),
      });

      const data = schema.parse(req.body);
      const stock = await inventoryService.updateStock(req.user!.id, id, data);

      res.json({ success: true, data: stock });
    } catch (error) {
      next(error);
    }
  }

  async deleteStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      await inventoryService.deleteStock(req.user!.id, id);

      res.json({ success: true, message: 'Stock item deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export class AnalyticsController {
  async getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { period = '7d' } = req.query;

      const analytics = await analyticsService.getAnalytics(
        req.user!.id,
        (period as '7d' | '30d' | '90d') || '7d'
      );

      res.json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  async getRevenue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { period = '30d' } = req.query;

      const result = await analyticsService.getRevenue(
        req.user!.id,
        (period as '7d' | '30d' | '90d' | '1y') || '30d'
      );

      res.json({
        success: true,
        data: { pharmacyId: result.pharmacyId, period: result.period, startDate: result.startDate },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
export const pharmacyOrderController = new PharmacyOrderController();
export const inventoryController = new InventoryController();
export const analyticsController = new AnalyticsController();
