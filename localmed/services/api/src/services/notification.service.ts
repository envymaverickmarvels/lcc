import { notificationRepository, userRepository } from '../repositories/index.js';
import { AppError } from '../middleware/errorHandler.js';

export class NotificationService {
  async getUserNotifications(userId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      notificationRepository.findByUser(userId, { limit, offset }),
      notificationRepository.countUnread(userId),
      notificationRepository.countUnread(userId),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notifications = await notificationRepository.findByUser(userId);
    const notification = notifications.find((n) => n.id === notificationId);

    if (!notification) {
      throw new AppError(404, 'Notification not found', 'NOTIFICATION_NOT_FOUND');
    }

    return notificationRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId: string) {
    return notificationRepository.markAllAsRead(userId);
  }

  async subscribe(
    userId: string,
    deviceData: {
      deviceId: string;
      deviceType: 'ios' | 'android' | 'web';
      deviceName?: string;
      deviceModel?: string;
      osVersion?: string;
      notificationToken: string;
    }
  ) {
    return userRepository.update(userId, {});
  }

  async unsubscribe(userId: string, deviceId: string) {
    return { success: true };
  }

  async sendPushNotification(
    userId: string,
    notification: { title: string; body: string; data?: Record<string, unknown> }
  ) {
    console.log(`Push notification to user ${userId}:`, notification);
    return { success: true };
  }

  async createNotification(
    userId: string,
    data: { type: string; title: string; message: string; notificationData?: Record<string, unknown> }
  ) {
    return notificationRepository.create({
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.notificationData as Record<string, unknown> as undefined,
    });
  }
}

export const notificationService = new NotificationService();
