import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { BrakeController, brakeMeasurementSchema } from '../controllers/brakeController.js';
import { validateBody } from '../middleware/validate.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', BrakeController.getMeasurements);
router.post('/', validateBody(brakeMeasurementSchema), BrakeController.createMeasurement);
router.delete('/:id', BrakeController.deleteMeasurement);

export default router;
