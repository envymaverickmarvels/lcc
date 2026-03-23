import { Router } from 'express';
import { emergencyController } from '../controllers/index.js';

const router = Router();

router.get('/emergency-search', emergencyController.emergencySearch.bind(emergencyController));
router.get('/24h-pharmacies', emergencyController.get24hPharmacies.bind(emergencyController));
router.get('/nearby-hospitals', emergencyController.getNearbyHospitals.bind(emergencyController));
router.get('/life-saving-medicines', emergencyController.getLifeSavingMedicines.bind(emergencyController));

export default router;
