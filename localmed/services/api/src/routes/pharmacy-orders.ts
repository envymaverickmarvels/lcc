import { Router } from 'express';
import { pharmacyOrderController } from '../controllers/index.js';

const router = Router();

router.get('/', pharmacyOrderController.getOrders.bind(pharmacyOrderController));
router.get('/stats', pharmacyOrderController.getStats.bind(pharmacyOrderController));
router.put('/:id/status', pharmacyOrderController.updateStatus.bind(pharmacyOrderController));

export default router;
