import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserActive,
  changeUserRole,
  getUserStats
} from '../controllers/userController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import {
  updateUserValidation,
  uuidParamValidation,
  paginationValidation
} from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Admin routes
router.get('/', paginationValidation, getAllUsers);
router.get('/stats', getUserStats);
router.get('/:id', uuidParamValidation, getUserById);
router.put('/:id', updateUserValidation, updateUser);
router.put('/:id/toggle-active', uuidParamValidation, toggleUserActive);
router.put('/:id/role', uuidParamValidation, changeUserRole);
router.delete('/:id', uuidParamValidation, deleteUser);

export default router;
