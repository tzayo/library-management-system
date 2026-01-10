import { body, param, query, validationResult } from 'express-validator';

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors in submitted data',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }

  next();
};

// Validation rules for authentication
export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('כתובת אימייל לא תקינה')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('הסיסמה חייבת להכיל לפחות 8 תווים')
    .matches(/\d/)
    .withMessage('הסיסמה חייבת להכיל לפחות ספרה אחת'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('שם מלא הוא שדה חובה')
    .isLength({ min: 2 })
    .withMessage('שם מלא חייב להכיל לפחות 2 תווים'),
  body('phone')
    .optional()
    .matches(/^[\d\-\+\(\)\s]*$/)
    .withMessage('מספר טלפון לא תקין'),
  handleValidationErrors
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('כתובת אימייל לא תקינה')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('סיסמה היא שדה חובה'),
  handleValidationErrors
];

// Validation rules for books
export const createBookValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('כותרת הספר היא שדה חובה')
    .isLength({ min: 1, max: 255 })
    .withMessage('כותרת הספר חייבת להיות בין 1 ל-255 תווים'),
  body('author')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('שם הסופר חייב להיות עד 255 תווים'),
  body('isbn')
    .optional()
    .trim()
    .matches(/^(?:\d{10}|\d{13})$/)
    .withMessage('ISBN חייב להיות 10 או 13 ספרות'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('שם הקטגוריה חייב להיות עד 100 תווים'),
  body('description')
    .optional()
    .trim(),
  body('coverImage')
    .optional()
    .isURL()
    .withMessage('כתובת התמונה חייבת להיות URL תקין'),
  body('quantityTotal')
    .optional()
    .isInt({ min: 1 })
    .withMessage('כמות כוללת חייבת להיות מספר שלם חיובי'),
  handleValidationErrors
];

export const updateBookValidation = [
  param('id')
    .isUUID()
    .withMessage('מזהה ספר לא תקין'),
  ...createBookValidation
];

// Validation rules for loans
export const createLoanValidation = [
  body('bookId')
    .isUUID()
    .withMessage('מזהה ספר לא תקין'),
  body('userId')
    .isUUID()
    .withMessage('מזהה משתמש לא תקין'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('תאריך החזרה לא תקין'),
  handleValidationErrors
];

// Validation rules for users (admin operations)
export const updateUserValidation = [
  param('id')
    .isUUID()
    .withMessage('מזהה משתמש לא תקין'),
  body('fullName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('שם מלא לא יכול להיות ריק'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('כתובת אימייל לא תקינה')
    .normalizeEmail(),
  body('phone')
    .optional()
    .matches(/^[\d\-\+\(\)\s]*$/)
    .withMessage('מספר טלפון לא תקין'),
  body('role')
    .optional()
    .isIn(['user', 'editor', 'admin'])
    .withMessage('תפקיד לא תקין'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('סטטוס פעיל חייב להיות true או false'),
  handleValidationErrors
];

// UUID parameter validation
export const uuidParamValidation = [
  param('id')
    .isUUID()
    .withMessage('מזהה לא תקין'),
  handleValidationErrors
];

// Query parameter validation for pagination
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('מספר עמוד חייב להיות מספר שלם חיובי'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('מגבלת פריטים בעמוד חייבת להיות בין 1 ל-100'),
  handleValidationErrors
];
