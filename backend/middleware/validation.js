const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const profileUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  handleValidationErrors
];

const tvSubscriptionValidation = [
  body('smartcardNumber')
    .trim()
    .notEmpty().withMessage('Smart card number is required')
    .isLength({ min: 10, max: 15 }).withMessage('Invalid smart card number'),
  body('variation_code')
    .trim()
    .notEmpty().withMessage('Variation code is required'),
  body('serviceID')
    .trim()
    .notEmpty().withMessage('Service ID is required'),
  handleValidationErrors
];

const dataPurchaseValidation = [
  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{11}$/).withMessage('Phone number must be 11 digits'),
  body('variation_code')
    .trim()
    .notEmpty().withMessage('Variation code is required'),
  body('serviceID')
    .trim()
    .notEmpty().withMessage('Service ID is required'),
  handleValidationErrors
];

const walletFundValidation = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 100 }).withMessage('Minimum funding amount is ₦100')
    .toFloat(),
  body('paymentMethod')
    .optional()
    .trim()
    .isIn(['card', 'bank_transfer', 'ussd']).withMessage('Invalid payment method'),
  handleValidationErrors
];

const transactionQueryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be at least 1')
    .toInt(),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  profileUpdateValidation,
  tvSubscriptionValidation,
  dataPurchaseValidation,
  walletFundValidation,
  transactionQueryValidation,
  handleValidationErrors
};
