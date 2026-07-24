import express from 'express';
import { getAllUsers, getUserById, updateUserRole, freezeUser, getAllTransactions } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateRoleSchema, freezeUserSchema } from '../validators/user.validators.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin'), getAllUsers);
router.get('/all-transactions', authorize('admin'), getAllTransactions);
router.get('/:id', authorize('admin'), getUserById);
router.patch('/:id/role', authorize('admin'), validate(updateRoleSchema), updateUserRole);
router.patch('/:id/freeze', authorize('admin'), validate(freezeUserSchema), freezeUser);

export default router;
