import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { prescriptionController } from '../controllers/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, '/tmp/prescriptions');
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuid()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDF are allowed'));
    }
  },
});

router.post(
  '/upload',
  authenticate,
  upload.single('image'),
  prescriptionController.upload.bind(prescriptionController)
);
router.get('/:id', authenticate, prescriptionController.getById.bind(prescriptionController));
router.get('/:id/medicines', authenticate, prescriptionController.getMedicines.bind(prescriptionController));
router.put('/:id/verify-medicine', authenticate, prescriptionController.verifyMedicine.bind(prescriptionController));

export default router;
