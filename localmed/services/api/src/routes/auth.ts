import { Router } from 'express';
import { authController } from '../controllers/index.js';

const router = Router();

router.post('/register', authController.register.bind(authController));
router.post('/verify-otp', authController.verifyOtp.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));
router.post('/logout', authController.logout.bind(authController));

export default router;
