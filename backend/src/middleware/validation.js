const { body, param, query, validationResult } = require('express-validator');

// Validation result checker
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// User registration validation
const validateRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName').notEmpty().trim().withMessage('Last name is required'),
  body('role')
    .isIn(['volunteer', 'charity', 'moderator'])
    .withMessage('Invalid role'),
  body('consentGiven')
    .isBoolean()
    .custom(value => value === true)
    .withMessage('You must consent to data processing'),
  // Charity specific validations
  body('organizationName')
    .if(body('role').equals('charity'))
    .notEmpty().trim().withMessage('Organization name is required for charity registration'),
  body('registrationNumber')
    .if(body('role').equals('charity'))
    .notEmpty().trim().withMessage('Registration number is required for charity registration'),
  validate
];

// Login validation
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// Charity profile validation
const validateCharity = [
  body('organizationName').notEmpty().trim().withMessage('Organization name is required'),
  body('registrationNumber').notEmpty().trim().withMessage('Registration number is required'),
  body('contactEmail').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('description').optional().trim(),
  body('areasOfFocus').optional().isArray(),
  validate
];

// Volunteer profile validation
const validateVolunteer = [
  body('skills').optional().isArray(),
  body('interests').optional().isArray(),
  body('maxTravelDistance').optional().isInt({ min: 0 }),
  validate
];

// Opportunity validation
const validateOpportunity = [
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('description').notEmpty().trim().withMessage('Description is required'),
  body('numberOfVolunteers')
    .isInt({ min: 1 })
    .withMessage('Number of volunteers must be at least 1'),
  body('locationType')
    .isIn(['in-person', 'virtual', 'hybrid'])
    .withMessage('Invalid location type'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('requiredSkills').optional().isArray(),
  validate
];

// Application validation
const validateApplication = [
  body('opportunityId').isUUID().withMessage('Invalid opportunity ID'),
  body('applicationMessage').optional().trim(),
  validate
];

// UUID param validation
const validateUUID = [
  param('id').isUUID().withMessage('Invalid ID format'),
  validate
];

// UUID param validation for opportunityId
const validateOpportunityUUID = [
  param('opportunityId').isUUID().withMessage('Invalid opportunity ID format'),
  validate
];

module.exports = {
  validate,
  validateRegister,
  validateLogin,
  validateCharity,
  validateVolunteer,
  validateOpportunity,
  validateApplication,
  validateUUID,
  validateOpportunityUUID
};
