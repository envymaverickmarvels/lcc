import { Router } from 'express';
import { medicineController } from '../controllers/index.js';

const router = Router();

router.get('/search', medicineController.search.bind(medicineController));
router.get('/suggestions', medicineController.getSuggestions.bind(medicineController));
router.get('/categories', medicineController.getCategories.bind(medicineController));
router.get('/:id', medicineController.getById.bind(medicineController));

export default router;
