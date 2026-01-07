import { Router } from 'express';
import { healthCheck, livenessProbe, readinessProbe } from '../controllers/healthController.js';

const router = Router();

// Comprehensive health check
router.get('/health', healthCheck);

// Kubernetes liveness probe
router.get('/live', livenessProbe);

// Kubernetes readiness probe
router.get('/ready', readinessProbe);

export default router;
