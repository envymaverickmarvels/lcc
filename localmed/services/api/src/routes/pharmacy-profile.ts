import { Router } from 'express';
import { pharmacyService } from '../services/index.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const pharmacy = await pharmacyService
      .getById('')
      .then(() => pharmacyService.getById(''));

    if (!pharmacy) {
      throw new AppError(404, 'Pharmacy not found', 'PHARMACY_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: pharmacy.id,
        name: pharmacy.name,
        address: pharmacy.address,
        phone: pharmacy.phone,
        email: pharmacy.email,
        openingTime: pharmacy.openingTime,
        closingTime: pharmacy.closingTime,
        is24h: pharmacy.is24h,
        isDelivery: pharmacy.isDelivery,
        rating: pharmacy.rating,
        totalReviews: pharmacy.totalReviews,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(255).optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      address: z.string().optional(),
      openingTime: z.string().optional(),
      closingTime: z.string().optional(),
      is24h: z.boolean().optional(),
      isDelivery: z.boolean().optional(),
      deliveryRadiusKm: z.number().positive().optional(),
    });

    const data = schema.parse(req.body);
    const pharmacy = await pharmacyService.updateProfile('', data);

    res.json({
      success: true,
      data: pharmacy,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
