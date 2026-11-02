import { Router } from 'express';
import { HaController } from '../controllers/haController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Universal Telemetry & Odometer Sync Webhook API
// Accepts x-api-key: vkv_... or Bearer token for Home Assistant, Apple Shortcuts, Android Tasker, OBD2
router.post('/odometer', requireAuth, HaController.updateOdometer);

export default router;
