import { Router } from 'express';
import { pharmacyController } from '../controllers/index.js';

const router = Router();

router.get('/', pharmacyController.getNearby.bind(pharmacyController));
router.get('/:id', pharmacyController.getById.bind(pharmacyController));
router.get('/:id/medicines', pharmacyController.getMedicines.bind(pharmacyController));
router.get('/:id/stock', pharmacyController.getStock.bind(pharmacyController));

export default router;
