import express from 'express';
import {
  getAllLoans,
  getMyLoans,
  getOverdueLoans,
  getLoanStats,
  createLoan,
  returnLoan,
  getLoanById
} from '../controllers/loanController.js';
import { authenticate, isEditor } from '../middleware/auth.js';
import {
  createLoanValidation,
  uuidParamValidation,
  paginationValidation
} from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User routes
router.get('/my', paginationValidation, getMyLoans);

// Editor/Admin routes
router.get('/', isEditor, paginationValidation, getAllLoans);
router.get('/overdue', isEditor, getOverdueLoans);
router.get('/stats', isEditor, getLoanStats);
router.get('/:id', uuidParamValidation, getLoanById);
router.post('/', isEditor, createLoanValidation, createLoan);
router.put('/:id/return', isEditor, uuidParamValidation, returnLoan);

export default router;
