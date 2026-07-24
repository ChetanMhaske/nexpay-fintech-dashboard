import express from 'express';
import { getWallets, getWalletById } from '../controllers/wallet.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getWallets);
router.get('/:id', getWalletById);

export default router;
