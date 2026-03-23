import type { Response, NextFunction } from 'express';
import { notificationService } from '../services/index.js';
import { notificationRepository } from '../repositories/index.js';
import type { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';
import prisma from '../config/database.js';

export class NotificationController {
  async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '20' } = req.query;

      const result = await notificationService.getUserNotifications(req.user!.id, {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(id, req.user!.id);

      res.json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllAsRead(req.user!.id);

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async subscribe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schema = z.object({
        deviceId: z.string(),
        deviceType: z.enum(['ios', 'android', 'web']),
        deviceName: z.string().optional(),
        deviceModel: z.string().optional(),
        osVersion: z.string().optional(),
        notificationToken: z.string(),
      });

      const data = schema.parse(req.body);

      await prisma.userDevice.upsert({
        where: {
          userId_deviceId: {
            userId: req.user!.id,
            deviceId: data.deviceId,
          },
        },
        create: {
          userId: req.user!.id,
          ...data,
        },
        update: {
          notificationToken: data.notificationToken,
          deviceName: data.deviceName,
          deviceModel: data.deviceModel,
          osVersion: data.osVersion,
          isActive: true,
          lastActiveAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'Device subscribed for notifications',
      });
    } catch (error) {
      next(error);
    }
  }

  async unsubscribe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { deviceId } = req.body;

      await prisma.userDevice.updateMany({
        where: { userId: req.user!.id, deviceId },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: 'Device unsubscribed',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
