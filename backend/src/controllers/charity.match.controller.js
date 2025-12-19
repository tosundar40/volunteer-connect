const { Charity, Opportunity, Application, Volunteer, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const matchingService = require('../services/matching.service');

// @desc    Get suggested matches for charity review
// @route   GET /api/charity/matches
// @access  Private (Charity role)
exports.getSuggestedMatches = async (req, res, next) => {
  try {
    const { opportunityId } = req.query;

    // Get charity profile
    const charity = await Charity.findOne({ where: { userId: req.user.id } });
    if (!charity) {
      return next(new AppError('Charity profile not found', 404));
    }

    // Get suggested matches for review
    const suggestedMatches = await matchingService.getSuggestedMatchesForReview(
      charity.id,
      opportunityId || null
    );

    res.status(200).json({
      success: true,
      count: suggestedMatches.length,
      data: suggestedMatches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review a suggested match
// @route   POST /api/charity/matches/:applicationId/review
// @access  Private (Charity role)
exports.reviewSuggestedMatch = async (req, res, next) => {
  try {
    const { decision, notes } = req.body;

    if (!['accept', 'decline'].includes(decision)) {
      return next(new AppError('Decision must be either "accept" or "decline"', 400));
    }

    // Review the match through the matching service
    const updatedApplication = await matchingService.reviewSuggestedMatch(
      req.params.applicationId,
      req.user.id,
      decision,
      notes
    );

    res.status(200).json({
      success: true,
      data: updatedApplication
    });
  } catch (error) {
    if (error.message.includes('Not authorized') || error.message.includes('not found')) {
      return next(new AppError(error.message, error.message.includes('Not authorized') ? 403 : 404));
    }
    next(error);
  }
};

// @desc    Generate new match suggestions for an opportunity
// @route   POST /api/charity/opportunities/:opportunityId/generate-matches
// @access  Private (Charity role)
exports.generateMatches = async (req, res, next) => {
  try {
    const { maxMatches = 10 } = req.body;

    // Verify charity owns the opportunity
    const charity = await Charity.findOne({ where: { userId: req.user.id } });
    if (!charity) {
      return next(new AppError('Charity profile not found', 404));
    }

    const opportunity = await Opportunity.findOne({
      where: {
        id: req.params.opportunityId,
        charityId: charity.id
      }
    });

    if (!opportunity) {
      return next(new AppError('Opportunity not found or not owned by charity', 404));
    }

    // Generate new matches
    const suggestedMatches = await matchingService.createSystemMatches(
      req.params.opportunityId,
      maxMatches
    );

    res.status(200).json({
      success: true,
      count: suggestedMatches.length,
      message: `Generated ${suggestedMatches.length} new match suggestions`,
      data: suggestedMatches
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get match details for a specific volunteer
// @route   GET /api/charity/matches/:applicationId/details
// @access  Private (Charity role)
exports.getMatchDetails = async (req, res, next) => {
  try {
    const application = await Application.findByPk(req.params.applicationId, {
      include: [
        {
          model: Opportunity,
          as: 'opportunity',
          include: [{ model: Charity, as: 'charity' }]
        },
        {
          model: Volunteer,
          as: 'volunteer',
          include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'phone', 'createdAt'] }]
        }
      ]
    });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Verify charity ownership
    const charity = await Charity.findOne({ where: { userId: req.user.id } });
    if (!charity || application.opportunity.charityId !== charity.id) {
      return next(new AppError('Not authorized to view this match details', 403));
    }

    // Get detailed match analysis
    const matchAnalysis = matchingService.calculateMatchScore(
      application.volunteer,
      application.opportunity
    );

    // Get volunteer's application history (limited)
    const applicationHistory = await Application.findAll({
      where: { volunteerId: application.volunteerId },
      attributes: ['status', 'createdAt', 'confirmedAt', 'vettingScore'],
      include: [
        {
          model: Opportunity,
          as: 'opportunity',
          attributes: ['title', 'category'],
          include: [{ model: Charity, as: 'charity', attributes: ['name'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        application,
        matchAnalysis,
        applicationHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get charity's opportunities needing matches
// @route   GET /api/charity/opportunities/needing-matches
// @access  Private (Charity role)
exports.getOpportunitiesNeedingMatches = async (req, res, next) => {
  try {
    // Get charity profile
    const charity = await Charity.findOne({ where: { userId: req.user.id } });
    if (!charity) {
      return next(new AppError('Charity profile not found', 404));
    }

    // Get published opportunities that need more volunteers
    const opportunities = await Opportunity.findAll({
      where: {
        charityId: charity.id,
        status: 'published',
        volunteersConfirmed: {
          [require('sequelize').Op.lt]: require('sequelize').col('numberOfVolunteers')
        }
      },
      attributes: [
        'id', 'title', 'numberOfVolunteers', 'volunteersConfirmed', 
        'applicationDeadline', 'startDate', 'category'
      ],
      order: [['applicationDeadline', 'ASC']]
    });

    // Get count of pending matches for each opportunity
    const opportunitiesWithMatchCounts = await Promise.all(
      opportunities.map(async (opp) => {
        const pendingMatches = await Application.count({
          where: {
            opportunityId: opp.id,
            isSystemMatched: true,
            status: 'pending'
          }
        });

        return {
          ...opp.toJSON(),
          pendingMatches,
          volunteersRemaining: opp.numberOfVolunteers - opp.volunteersConfirmed
        };
      })
    );

    res.status(200).json({
      success: true,
      count: opportunitiesWithMatchCounts.length,
      data: opportunitiesWithMatchCounts
    });
  } catch (error) {
    next(error);
  }
};