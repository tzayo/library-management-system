import express from 'express';
import {
  getAllBooks,
  getBookById,
  getCategories,
  createBook,
  updateBook,
  deleteBook,
  addCopiesToBook
} from '../controllers/bookController.js';
import { authenticate, isEditor, isAdmin } from '../middleware/auth.js';
import {
  createBookValidation,
  updateBookValidation,
  uuidParamValidation,
  paginationValidation
} from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Public (authenticated) routes
router.get('/', paginationValidation, getAllBooks);
router.get('/categories', getCategories);
router.get('/:id', uuidParamValidation, getBookById);

// Editor/Admin routes
router.post('/', isEditor, createBookValidation, createBook);
router.put('/:id', isEditor, updateBookValidation, updateBook);
router.post('/:id/add-copies', isEditor, uuidParamValidation, addCopiesToBook);

// Admin only routes
router.delete('/:id', isAdmin, uuidParamValidation, deleteBook);

export default router;
