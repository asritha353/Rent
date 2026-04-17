// middleware/validator.js — express-validator schemas + middleware runner
const { body, validationResult } = require('express-validator');

/**
 * handleValidation — must be last in a validation chain.
 * Returns 400 with array of field-level errors if validation fails.
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success : false,
      message : 'Validation failed',
      errors  : errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth validators ─────────────────────────────────────────────────────────

const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2–100 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['tenant', 'owner'])
    .withMessage('Role must be tenant or owner (admin accounts are created separately)'),
  handleValidation,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidation,
];

const validateChangePassword = [
  body('oldPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidation,
];

// ── Property validator ──────────────────────────────────────────────────────

const validateProperty = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be 5–200 characters'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('price')
    .isFloat({ min: 1 })
    .withMessage('Price must be a positive number'),
  body('bhk')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('BHK must be a number between 1 and 20'),
  body('type')
    .optional()
    .isIn(['Apartment', 'Villa', 'House', 'Plot', 'Office', 'Shop', 'PG'])
    .withMessage('Invalid property type'),
  body('purpose')
    .optional()
    .isIn(['rent', 'sale', 'pg'])
    .withMessage('Purpose must be rent, sale, or pg'),
  body('furnishing')
    .optional()
    .isIn(['furnished', 'semi-furnished', 'unfurnished'])
    .withMessage('Invalid furnishing value'),
  handleValidation,
];

// ── Review validator ────────────────────────────────────────────────────────

const validateReview = [
  body('property_id').notEmpty().withMessage('Property ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 1000 }).withMessage('Comment must be under 1000 characters'),
  handleValidation,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateProperty,
  validateReview,
  handleValidation,
};
