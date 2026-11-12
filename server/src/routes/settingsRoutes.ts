import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/ai', requireAuth, SettingsController.getAiSettings);
router.get('/ai/gemini-models', requireAuth, SettingsController.getGeminiModels);
router.put('/ai', requireAuth, requireAdmin, SettingsController.updateAiSettings);
router.post('/ai/test', requireAuth, requireAdmin, SettingsController.testAiConnection);

router.get('/security', requireAuth, requireAdmin, SettingsController.getSecuritySettings);
router.put('/security', requireAuth, requireAdmin, SettingsController.updateSecuritySettings);

router.get('/modules', SettingsController.getModuleSettings);
router.put('/modules', requireAuth, requireAdmin, SettingsController.updateModuleSettings);

export default router;

