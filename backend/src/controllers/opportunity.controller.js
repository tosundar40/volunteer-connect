const { Opportunity, Charity, Application, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const asyncHandler = require('express-async-handler');

const recentViews = new Map();

// @desc    Get all opportunities
// @route   GET /api/opportunities
// @access  Public
exports.getOpportunities = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, 
      locationType, 
      skills, 
      city,
      startDate,
      status = 'published'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const where = { status };

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }  
      ];
    }

    if (category) {
      where.category = category;
    }

    if (locationType) {
      where.locationType = locationType;
    }

    if (skills) {
      where.requiredSkills = { [Op.contains]: [skills] };
    }

    if (city) {
      where.city = { [Op.iLike]: `%${city}%` };
    }

    if (startDate) {
      where.startDate = { [Op.gte]: new Date(startDate) };
    }

    // Only show approved opportunities to non-moderators
    // if (req.user?.role !== 'moderator') {
    //   where.moderationStatus = 'approved';
    // }

    const { count, rows: opportunities } = await Opportunity.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      include: [
        { 
          model: Charity, 
          as: 'charity',
          include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
        }
      ],
      order: [['startDate', 'ASC']]
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
      data: opportunities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get charity's own opportunities
// @route   GET /api/opportunities/charity/my-opportunities
// @access  Private (Charity role)
exports.getMyOpportunities = async (req, res, next) => {
  try {
    // Get charity profile
    const charity = await Charity.findOne({ where: { userId: req.user.id } });

    if (!charity) {
      return next(new AppError('Charity profile not found', 404));
    }

    const opportunities = await Opportunity.findAll({
      where: { charityId: charity.id },
      include: [
        { 
          model: Charity, 
          as: 'charity',
          include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: opportunities.length,
      data: opportunities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single opportunity
// @route   GET /api/opportunities/:id
// @access  Public
exports.getOpportunity = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findByPk(req.params.id, {
      include: [
        { 
          model: Charity, 
          as: 'charity',
          include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email'] }]
        }
      ]
    });

    if (!opportunity) {
      return next(new AppError('Opportunity not found', 404));
    }

    // Increment views but avoid double-counting rapid repeated requests from same IP
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = `${opportunity.id}:${ip}`;
    const last = recentViews.get(key) || 0;
    const now = Date.now();
    const DEBOUNCE_MS = 30 * 1000; // 30 seconds
    if (now - last > DEBOUNCE_MS) {
      await opportunity.increment('views');
      recentViews.set(key, now);
    }

    res.status(200).json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create opportunity
// @route   POST /api/opportunities
// @access  Private (Charity role)
exports.createOpportunity = async (req, res, next) => {
  try {
    // Get charity profile
    const charity = await Charity.findOne({ where: { userId: req.user.id } });

    if (!charity) {
      return next(new AppError('Please complete your charity profile first', 403));
    }

    if (charity.verificationStatus !== 'approved') {
      return next(new AppError('Your charity application is pending admin approval. You will be able to create opportunities once approved.', 403));
    }

    const opportunity = await Opportunity.create({
      charityId: charity.id,
      ...req.body
    });

    res.status(201).json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update opportunity
// @route   PUT /api/opportunities/:id
// @access  Private (Charity role - own opportunity)
exports.updateOpportunity = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findByPk(req.params.id, {
      include: [{ model: Charity, as: 'charity' }]
    });

    if (!opportunity) {
      return next(new AppError('Opportunity not found', 404));
    }

    // Check ownership
    if (opportunity.charity.userId !== req.user.id && req.user.role !== 'moderator') {
      return next(new AppError('Not authorized to update this opportunity', 403));
    }

    await opportunity.update(req.body);

    res.status(200).json({
      success: true,
      data: opportunity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete opportunity
// @route   DELETE /api/opportunities/:id
// @access  Private (Charity role - own opportunity or Moderator)
exports.deleteOpportunity = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findByPk(req.params.id, {
      include: [{ model: Charity, as: 'charity' }]
    });

    if (!opportunity) {
      return next(new AppError('Opportunity not found', 404));
    }

    // Check ownership
    if (opportunity.charity.userId !== req.user.id && req.user.role !== 'moderator') {
      return next(new AppError('Not authorized to delete this opportunity', 403));
    }

    await opportunity.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get matched volunteers for opportunity
// @route   GET /api/opportunities/:id/matched-volunteers
// @access  Private (Charity role)
exports.getMatchedVolunteers = async (req, res, next) => {
  try {
    const { limit = 20, minScore = 30 } = req.query;
    
    const opportunity = await Opportunity.findByPk(req.params.id, {
      include: [{ model: Charity, as: 'charity' }]
    });

    if (!opportunity) {
      return next(new AppError('Opportunity not found', 404));
    }

    // Check ownership
    if (opportunity.charity.userId !== req.user.id && req.user.role !== 'moderator') {
      return next(new AppError('Not authorized to view matches for this opportunity', 403));
    }

    // Use matching service to find suitable volunteers
    const matchingService = require('../services/matching.service');
    const matchResults = await matchingService.findMatchesForOpportunity(
      opportunity.id, 
      parseInt(limit), 
      parseInt(minScore)
    );

    res.status(200).json({
      success: true,
      data: matchResults
    });
  } catch (error) {
    console.error('Error fetching matched volunteers:', error);
    next(error);
  }
};

// @desc    Get applications for opportunity
// @route   GET /api/opportunities/:id/applications
// @access  Private (Charity role - own opportunity)
exports.getOpportunityApplications = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findByPk(req.params.id, {
      include: [
        { model: Charity, as: 'charity' },
        { 
          model: Application, 
          as: 'applications',
          include: [
            { 
              model: require('../models').Volunteer, 
              as: 'volunteer',
              include: [{ 
                model: User, 
                as: 'user', 
                attributes: ['id', 'firstName', 'lastName', 'email'] 
              }]
            }
          ]
        }
      ]
    });

    if (!opportunity) {
      return next(new AppError('Opportunity not found', 404));
    }

    // Check ownership
    if (opportunity.charity.userId !== req.user.id && req.user.role !== 'moderator') {
      return next(new AppError('Not authorized', 403));
    }

    // Transform the applications to ensure we have the user data at the top level for easier access
    const transformedApplications = opportunity.applications.map(app => ({
      id: app.id,
      status: app.status,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      hoursCommitted: app.hoursCommitted || 0,
      hoursWorked: app.hoursWorked || 0,
      volunteer: app.volunteer,
      // Also add user data at top level for easier frontend access
      user: app.volunteer?.user || null
    }));

    res.status(200).json({
      success: true,
      data: transformedApplications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close/Complete opportunity
// @route   PUT /api/opportunities/:id/close
// @access  Private (Charity role - own opportunity)
exports.closeOpportunity = asyncHandler(async (req, res, next) => {
  try {
    const { status = 'completed', notes } = req.body;
    
    const opportunity = await Opportunity.findByPk(req.params.id, {
      include: [{ model: Charity, as: 'charity' }]
    });

    if (!opportunity) {
      return next(new AppError('Opportunity not found', 404));
    }

    // Check ownership
    if (opportunity.charity.userId !== req.user.id && req.user.role !== 'moderator') {
      return next(new AppError('Not authorized to close this opportunity', 403));
    }

    // Validate status
    const validClosureStatuses = ['completed', 'cancelled'];
    if (!validClosureStatuses.includes(status)) {
      return next(new AppError('Invalid closure status. Must be "completed" or "cancelled"', 400));
    }

    // Update opportunity
    await opportunity.update({
      status,
      closureNotes: notes || null,
      closedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: `Opportunity ${status} successfully`,
      data: opportunity
    });
  } catch (error) {
    next(error);
  }
});

module.exports = exports;
