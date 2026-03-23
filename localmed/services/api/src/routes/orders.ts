import { Router } from 'express';
import { orderController } from '../controllers/index.js';

const router = Router();

router.post('/', orderController.create.bind(orderController));
router.get('/delivery-providers', orderController.getDeliveryProviders.bind(orderController));
router.get('/:id', orderController.getById.bind(orderController));
router.post('/:id/cancel', orderController.cancel.bind(orderController));
router.post('/:id/reorder', orderController.reorder.bind(orderController));

export default router;
