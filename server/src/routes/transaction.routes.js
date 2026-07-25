import express from 'express';
import { createTransaction, getMyTransactions, getTransactionById, reverseTransaction } from '../controllers/transaction.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTransactionSchema } from '../validators/transaction.validators.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticate);
router.use(apiLimiter);

router.post('/', validate(createTransactionSchema), createTransaction);
router.get('/', getMyTransactions);
router.get('/:id', getTransactionById);
router.post('/:id/reverse', authorize('admin'), reverseTransaction);

export default router;
