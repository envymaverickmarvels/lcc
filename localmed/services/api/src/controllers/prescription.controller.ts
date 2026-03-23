import type { Response, NextFunction } from 'express';
import { prescriptionService } from '../services/index.js';
import type { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const getParam = (param: string | string[] | undefined): string => param as string;

export class PrescriptionController {
  async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const file = req.file;

      if (!file) {
        throw new Error('Image is required');
      }

      const imageUrl = `https://storage.localmed.com/prescriptions/${file.filename}`;
      const thumbnailUrl = `https://storage.localmed.com/prescriptions/thumbnails/${file.filename}`;

      const result = await prescriptionService.upload(req.user!.id, imageUrl, thumbnailUrl);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const prescription = await prescriptionService.getById(id, req.user!.id);

      res.json({ success: true, data: prescription });
    } catch (error) {
      next(error);
    }
  }

  async getMedicines(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const medicines = await prescriptionService.getMedicines(id, req.user!.id);

      res.json({ success: true, data: medicines });
    } catch (error) {
      next(error);
    }
  }

  async verifyMedicine(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = getParam(req.params.id);
      const schema = z.object({
        medicineId: z.string().uuid(),
        matchedMedicineId: z.string().uuid().optional(),
      });

      const { medicineId, matchedMedicineId } = schema.parse(req.body);
      const result = await prescriptionService.verifyMedicine(
        id,
        medicineId,
        req.user!.id,
        matchedMedicineId
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const prescriptionController = new PrescriptionController();
