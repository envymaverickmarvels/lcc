import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/pharmacy/:pharmacyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pharmacyId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const reviews = await prisma.pharmacyReview.findMany({
      where: { pharmacyId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limitNum,
      skip: (pageNum - 1) * limitNum,
    });

    const total = await prisma.pharmacyReview.count({ where: { pharmacyId } });

    res.json({
      success: true,
      data: {
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: Number(r.rating),
          comment: r.comment,
          isVerified: r.isVerified,
          createdAt: r.createdAt,
          user: r.user,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/pharmacy/:pharmacyId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pharmacyId } = req.params;
    const schema = z.object({
      rating: z.number().min(1).max(5),
      comment: z.string().max(500).optional(),
    });

    const { rating, comment } = schema.parse(req.body);

    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
    if (!pharmacy) {
      throw new AppError(404, 'Pharmacy not found', 'PHARMACY_NOT_FOUND');
    }

    const existingReview = await prisma.pharmacyReview.findFirst({
      where: { pharmacyId, userId: req.user!.id },
    });

    if (existingReview) {
      throw new AppError(400, 'You have already reviewed this pharmacy', 'ALREADY_REVIEWED');
    }

    const review = await prisma.pharmacyReview.create({
      data: {
        pharmacyId,
        userId: req.user!.id,
        rating,
        comment,
      },
    });

    const allReviews = await prisma.pharmacyReview.findMany({
      where: { pharmacyId },
      select: { rating: true },
    });

    const avgRating = allReviews.reduce((acc, r) => acc + Number(r.rating), 0) / allReviews.length;

    await prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: {
        rating: avgRating,
        totalReviews: allReviews.length,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: review.id,
        rating: Number(review.rating),
        comment: review.comment,
        createdAt: review.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      rating: z.number().min(1).max(5).optional(),
      comment: z.string().max(500).optional(),
    });

    const { rating, comment } = schema.parse(req.body);

    const review = await prisma.pharmacyReview.findUnique({ where: { id } });

    if (!review) {
      throw new AppError(404, 'Review not found', 'NOT_FOUND');
    }

    if (review.userId !== req.user!.id) {
      throw new AppError(403, 'Access denied', 'ACCESS_DENIED');
    }

    const updated = await prisma.pharmacyReview.update({
      where: { id },
      data: { rating, comment },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        rating: Number(updated.rating),
        comment: updated.comment,
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const review = await prisma.pharmacyReview.findUnique({ where: { id } });

    if (!review) {
      throw new AppError(404, 'Review not found', 'NOT_FOUND');
    }

    if (review.userId !== req.user!.id) {
      throw new AppError(403, 'Access denied', 'ACCESS_DENIED');
    }

    await prisma.pharmacyReview.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Review deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
