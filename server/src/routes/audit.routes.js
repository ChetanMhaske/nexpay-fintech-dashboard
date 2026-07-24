import express from 'express';
import { getAuditLogs, getTransactionsAudit } from '../controllers/audit.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'auditor'), getAuditLogs);
router.get('/transactions', authorize('auditor'), getTransactionsAudit);

export default router;
