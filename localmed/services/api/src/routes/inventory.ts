import { Router } from 'express';
import { inventoryController } from '../controllers/index.js';

const router = Router();

router.get('/', inventoryController.getStock.bind(inventoryController));
router.post('/', inventoryController.addStock.bind(inventoryController));
router.put('/:id', inventoryController.updateStock.bind(inventoryController));
router.delete('/:id', inventoryController.deleteStock.bind(inventoryController));

export default router;
