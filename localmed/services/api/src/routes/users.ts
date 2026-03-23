import { Router } from 'express';
import { userController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/profile', authenticate, userController.getProfile.bind(userController));
router.put('/profile', authenticate, userController.updateProfile.bind(userController));
router.get('/addresses', authenticate, userController.getAddresses.bind(userController));
router.post('/addresses', authenticate, userController.addAddress.bind(userController));
router.put('/addresses/:id', authenticate, userController.updateAddress.bind(userController));
router.delete('/addresses/:id', authenticate, userController.deleteAddress.bind(userController));
router.post('/addresses/:id/default', authenticate, userController.setDefaultAddress.bind(userController));

export default router;
