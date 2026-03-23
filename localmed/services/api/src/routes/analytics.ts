import { Router } from 'express';
import { analyticsController } from '../controllers/index.js';

const router = Router();

router.get('/', analyticsController.getAnalytics.bind(analyticsController));
router.get('/revenue', analyticsController.getRevenue.bind(analyticsController));

export default router;
