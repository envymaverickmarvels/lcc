import { Router } from 'express';
import { notificationController } from '../controllers/index.js';

const router = Router();

router.get('/', notificationController.getNotifications.bind(notificationController));
router.put('/:id/read', notificationController.markAsRead.bind(notificationController));
router.put('/read-all', notificationController.markAllAsRead.bind(notificationController));
router.post('/subscribe', notificationController.subscribe.bind(notificationController));
router.delete('/unsubscribe', notificationController.unsubscribe.bind(notificationController));

export default router;
