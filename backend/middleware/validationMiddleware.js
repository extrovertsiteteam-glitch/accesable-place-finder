const { body, query, param, validationResult } = require('express-validator');
const { placeCategories } = require('../models/Place');
const { issueTypes, reportStatuses } = require('../models/Report');

/**
 * Handle validation errors and return structured 400 response
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));
    return res.status(400).json({
      success: false,
      message: formattedErrors[0].message,
      errors: formattedErrors
    });
  }
  next();
};

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validate
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

/**
 * Validation rules for creating or editing a Place
 */
const placeValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Place name is required')
    .isLength({ max: 150 })
    .withMessage('Place name cannot exceed 150 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Place description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(placeCategories)
    .withMessage(`Category must be one of: ${placeCategories.join(', ')}`),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Full address is required'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('wheelchairAccessible')
    .optional()
    .isBoolean()
    .withMessage('wheelchairAccessible must be a boolean')
    .toBoolean(),
  body('rampAvailable')
    .optional()
    .isBoolean()
    .withMessage('rampAvailable must be a boolean')
    .toBoolean(),
  body('accessibleWashroom')
    .optional()
    .isBoolean()
    .withMessage('accessibleWashroom must be a boolean')
    .toBoolean(),
  body('elevatorAvailable')
    .optional()
    .isBoolean()
    .withMessage('elevatorAvailable must be a boolean')
    .toBoolean(),
  body('accessibleParking')
    .optional()
    .isBoolean()
    .withMessage('accessibleParking must be a boolean')
    .toBoolean(),
  body('contactEmail')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid contact email')
    .normalizeEmail(),
  body('website')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Please provide a valid website URL'),
  validate
];

/**
 * Validation rules for review creation
 */
const reviewValidation = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5')
    .toInt(),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Comment must be between 5 and 1000 characters'),
  validate
];

/**
 * Validation rules for submitting an accessibility report
 */
const reportValidation = [
  body('issueType')
    .trim()
    .notEmpty()
    .withMessage('Issue type is required')
    .isIn(issueTypes)
    .withMessage(`Issue type must be one of: ${issueTypes.join(', ')}`),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description of the issue is required')
    .isLength({ min: 10, max: 1500 })
    .withMessage('Description must be between 10 and 1500 characters'),
  body('reporterEmail')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  validate
];

/**
 * Validation rules for updating report status by admin
 */
const reportStatusValidation = [
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(reportStatuses)
    .withMessage(`Status must be one of: ${reportStatuses.join(', ')}`),
  body('adminNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin notes cannot exceed 1000 characters'),
  validate
];

module.exports = {
  validate,
  body,
  query,
  param,
  registerValidation,
  loginValidation,
  placeValidation,
  reviewValidation,
  reportValidation,
  reportStatusValidation
};
