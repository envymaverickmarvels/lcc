import { Router } from 'express';
import { orderController } from '../controllers/index.js';

const router = Router();

router.post('/', orderController.create.bind(orderController) as never);
router.get('/delivery-providers', orderController.getDeliveryProviders.bind(orderController) as never);
router.get('/:id', orderController.getById.bind(orderController) as never);
router.post('/:id/cancel', orderController.cancel.bind(orderController) as never);
router.post('/:id/reorder', orderController.reorder.bind(orderController) as never);

export default router;
