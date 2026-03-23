import type { Request, Response, NextFunction } from 'express';
import { medicineService, pharmacyService } from '../services/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

export class MedicineController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        q: z.string().min(1),
        lat: z.coerce.number(),
        lng: z.coerce.number(),
        radius: z.coerce.number().default(5),
        category: z.string().optional(),
        requiresRx: z.coerce.boolean().optional(),
        genericOnly: z.coerce.boolean().optional(),
        openNow: z.coerce.boolean().optional(),
        is24h: z.coerce.boolean().optional(),
        sortBy: z.enum(['distance', 'price', 'rating']).default('distance'),
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(20),
      });

      const params = schema.parse(req.query);
      const result = await medicineService.search(params);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, limit = '10' } = req.query;

      if (!q) {
        throw new AppError(400, 'Query parameter q is required', 'VALIDATION_ERROR');
      }

      const suggestions = await medicineService.getSuggestions(
        q as string,
        parseInt(limit as string, 10)
      );

      res.json({
        success: true,
        data: { suggestions },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await medicineService.getCategories();

      res.json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const medicine = await medicineService.getById(id);

      if (!medicine) {
        throw new AppError(404, 'Medicine not found', 'NOT_FOUND');
      }

      res.json({
        success: true,
        data: medicine,
      });
    } catch (error) {
      next(error);
    }
  }
}

export class PharmacyController {
  async getNearby(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng, radius = '5', is24h, sortBy = 'distance', page = '1', limit = '20' } = req.query;

      if (!lat || !lng) {
        throw new AppError(400, 'Missing required parameters: lat, lng', 'VALIDATION_ERROR');
      }

      const result = await pharmacyService.getNearby(
        parseFloat(lat as string),
        parseFloat(lng as string),
        parseFloat(radius as string),
        {
          is24h: is24h === 'true',
          sortBy: sortBy as string,
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
        }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const pharmacy = await pharmacyService.getById(id);

      if (!pharmacy) {
        throw new AppError(404, 'Pharmacy not found', 'NOT_FOUND');
      }

      res.json({
        success: true,
        data: pharmacy,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMedicines(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { search, category, page = '1', limit = '20' } = req.query;

      const result = await pharmacyService.getMedicines(id, {
        search: search as string,
        category: category as string,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { medicineId } = req.query;

      if (!medicineId) {
        throw new AppError(400, 'medicineId is required', 'VALIDATION_ERROR');
      }

      const stock = await pharmacyService.getStock(id, medicineId as string);

      if (!stock) {
        throw new AppError(404, 'Stock not found', 'NOT_FOUND');
      }

      res.json({
        success: true,
        data: stock,
      });
    } catch (error) {
      next(error);
    }
  }

  async get24hPharmacies(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng, radius = '10' } = req.query;

      if (!lat || !lng) {
        throw new AppError(400, 'Missing required parameters: lat, lng', 'VALIDATION_ERROR');
      }

      const pharmacies = await pharmacyService.get24hPharmacies(
        parseFloat(lat as string),
        parseFloat(lng as string),
        parseFloat(radius as string)
      );

      res.json({
        success: true,
        data: pharmacies,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const medicineController = new MedicineController();
export const pharmacyController = new PharmacyController();
