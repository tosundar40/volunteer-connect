const { Volunteer, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// @desc    Get all volunteers
// @route   GET /api/volunteers
// @access  Private (Charity, Moderator)
exports.getVolunteers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, skills, interests, city } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (skills) {
      where.skills = { [Op.contains]: [skills] };
    }

    if (interests) {
      where.interests = { [Op.contains]: [interests] };
    }

    if (city) {
      where.city = { [Op.iLike]: `%${city}%` };
    }

    const { count, rows: volunteers } = await Volunteer.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      },
      data: volunteers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's volunteer profile
// @route   GET /api/volunteers/me
// @access  Private (Volunteer role)
exports.getMyVolunteerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const volunteer = await Volunteer.findOne({
      where: { userId },
      include: [
        { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'phoneNumber', 'profileImage'] }
      ]
    });

    if (!volunteer) {
      return next(new AppError('Volunteer profile not found. Please complete your profile first.', 404));
    }

    res.status(200).json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single volunteer by volunteer ID
// @route   GET /api/volunteers/:id
// @access  Private
exports.getVolunteer = async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'phoneNumber', 'profileImage'] }
      ]
    });

    if (!volunteer) {
      return next(new AppError('Volunteer not found', 404));
    }

    res.status(200).json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create/Update volunteer profile
// @route   POST /api/volunteers
// @access  Private (Volunteer role)
exports.createOrUpdateVolunteer = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if volunteer profile exists
    let volunteer = await Volunteer.findOne({ where: { userId } });

    if (volunteer) {
      // Update existing profile
      await volunteer.update(req.body);
    } else {
      // Create new profile
      volunteer = await Volunteer.create({
        userId,
        ...req.body
      });
    }

    res.status(volunteer ? 200 : 201).json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update volunteer profile
// @route   PUT /api/volunteers/:id
// @access  Private (Volunteer role - own profile)
exports.updateVolunteer = async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findByPk(req.params.id);

    if (!volunteer) {
      return next(new AppError('Volunteer not found', 404));
    }

    // Check ownership
    if (volunteer.userId !== req.user.id && req.user.role !== 'moderator') {
      return next(new AppError('Not authorized to update this volunteer', 403));
    }

    await volunteer.update(req.body);

    res.status(200).json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get volunteer statistics
// @route   GET /api/volunteers/:id/stats
// @access  Private
exports.getVolunteerStats = async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findByPk(req.params.id, {
      include: [
        { association: 'applications' },
        { association: 'attendanceRecords' }
      ]
    });

    if (!volunteer) {
      return next(new AppError('Volunteer not found', 404));
    }

    const stats = {
      totalApplications: volunteer.applications.length,
      confirmedApplications: volunteer.applications.filter(a => a.status === 'confirmed').length,
      totalHoursVolunteered: volunteer.totalHoursVolunteered,
      totalOpportunitiesCompleted: volunteer.totalOpportunitiesCompleted,
      rating: volunteer.rating
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommended opportunities for volunteer
// @route   GET /api/volunteers/:id/recommendations
// @access  Private (Volunteer - own profile)
exports.getRecommendations = async (req, res, next) => {
  try {
    const volunteer = await Volunteer.findByPk(req.params.id);

    if (!volunteer) {
      return next(new AppError('Volunteer not found', 404));
    }

    // Check ownership
    if (volunteer.userId !== req.user.id && req.user.role !== 'moderator') {
      return next(new AppError('Not authorized', 403));
    }

    // Use matching service to get recommendations
    const matchingService = require('../services/matching.service');
    const recommendations = await matchingService.getRecommendationsForVolunteer(volunteer.id);

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};
