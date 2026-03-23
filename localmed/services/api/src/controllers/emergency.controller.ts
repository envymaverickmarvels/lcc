import type { Request, Response, NextFunction } from 'express';
import { emergencyService } from '../services/index.js';
import { z } from 'zod';

export class EmergencyController {
  async emergencySearch(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        q: z.string().min(1),
        lat: z.coerce.number(),
        lng: z.coerce.number(),
        radius: z.coerce.number().default(10),
        emergency: z.coerce.boolean().default(false),
      });

      const params = schema.parse(req.query);
      const result = await emergencyService.emergencySearch(
        params.q,
        params.lat,
        params.lng,
        params.radius,
        params.emergency
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async get24hPharmacies(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng, radius = '10' } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'lat and lng are required' },
        });
      }

      const pharmacies = await emergencyService.get24hPharmacies(
        parseFloat(lat as string),
        parseFloat(lng as string),
        parseFloat(radius as string)
      );

      res.json({
        success: true,
        data: {
          pharmacies: pharmacies.map((p) => ({
            id: p.id,
            name: p.name,
            address: p.address,
            phone: p.phone,
            rating: Number(p.rating),
            distance: Number(p.distance.toFixed(2)),
          })),
          total: pharmacies.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getNearbyHospitals(req: Request, res: Response, next: NextFunction) {
    try {
      const { lat, lng, radius = '10' } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'lat and lng are required' },
        });
      }

      const hospitals = await emergencyService.getNearbyHospitals(
        parseFloat(lat as string),
        parseFloat(lng as string),
        parseFloat(radius as string)
      );

      res.json({
        success: true,
        data: { hospitals },
      });
    } catch (error) {
      next(error);
    }
  }

  async getLifeSavingMedicines(_req: Request, res: Response, next: NextFunction) {
    try {
      const medicines = await emergencyService.getLifeSavingMedicines();

      res.json({
        success: true,
        data: { medicines },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const emergencyController = new EmergencyController();
