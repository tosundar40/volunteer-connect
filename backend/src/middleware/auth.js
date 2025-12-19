const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError } = require('./errorHandler');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!req.user) {
      return next(new AppError('User not found', 404));
    }

    if (!req.user.isActive) {
      return next(new AppError('User account is deactivated', 403));
    }

    next();
  } catch (error) {
    return next(new AppError('Not authorized to access this route', 401));
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// Check if user has completed profile based on role
const requireCompleteProfile = async (req, res, next) => {
  try {
    if (req.user.role === 'charity') {
      const charity = await req.user.getCharity();
      if (!charity) {
        return next(new AppError('Please complete your charity profile', 403));
      }
      if (charity.verificationStatus !== 'approved') {
        return next(new AppError('Your charity profile is pending approval', 403));
      }
    } else if (req.user.role === 'volunteer') {
      const volunteer = await req.user.getVolunteer();
      if (!volunteer) {
        return next(new AppError('Please complete your volunteer profile', 403));
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { protect, authorize, requireCompleteProfile };
