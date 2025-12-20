const { Charity, Volunteer, User, Application, Opportunity } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// @desc    Get all charities for moderator review
// @route   GET /api/moderator/charities
// @access  Private (Moderator role)
exports.getCharitiesForReview = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const { page = 1, limit = 10, search, verificationStatus, status } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    // Search functionality - search in organization name, registration number, and user email
    console.log('Search query:', search);
    if (search) {
      where[Op.or] = [
        { organizationName: { [Op.iLike]: `%${search}%` } },
        { registrationNumber: { [Op.iLike]: `%${search}%` } },
        { contactEmail: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by verification status
    if (verificationStatus && verificationStatus !== 'all') {
      where.verificationStatus = verificationStatus;
    }

    // Filter by status
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filter by active/inactive
    // expected query param: active=all|active|inactive
    const { active } = req.query;
    if (active === 'active') {
      where.isActive = true;
    } else if (active === 'inactive') {
      where.isActive = false;
    }

    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: charities } = await Charity.findAndCountAll({
      where,
      // include soft-deleted records so moderators can manage inactive accounts
      paranoid: false,

      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'phoneNumber', 'createdAt'],
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          required: Object.keys(userWhere).length > 0
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count,
      total: count,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      },
      data: charities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all volunteers for moderator review
// @route   GET /api/moderator/volunteers
// @access  Private (Moderator role)
exports.getVolunteersForReview = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const { page = 1, limit = 10, search, status, approvalStatus, backgroundCheckStatus } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    // Filter by approval status
    if (status && status !== 'all') {
      where.approvalStatus = status;
    }
    if (approvalStatus && approvalStatus !== 'all') {
      where.approvalStatus = approvalStatus;
    }

    // Filter by background check status
    if (backgroundCheckStatus && backgroundCheckStatus !== 'all') {
      where.backgroundCheckStatus = backgroundCheckStatus;
    }

    const userWhere = {};
    // Search functionality - search in user's name, email
    console.log('vol Search query:', search);

    if (search) {
      where[Op.or] = [
        { '$user.first_name$': { [Op.iLike]: `%${search}%` } },
        { '$user.last_name$': { [Op.iLike]: `%${search}%` } },
        { '$user.email$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    // active filter for volunteers
    const { active: volActive } = req.query;
    if (volActive === 'active') {
      where.isActive = true;
    } else if (volActive === 'inactive') {
      where.isActive = false;
    }

    const { count, rows: volunteers } = await Volunteer.findAndCountAll({
      where,
      // include soft-deleted records so moderators can manage inactive volunteers
      paranoid: false,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'phoneNumber', 'createdAt']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      // optional but helps correct counts with include
      subQuery: false
    });

    res.status(200).json({
      success: true,
      count,
      total: count,
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

// @desc    Review charity verification
// @route   POST /api/moderator/charities/:id/review
// @access  Private (Moderator role)
exports.reviewCharity = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const { verificationStatus, reviewNotes, requiresDocumentation } = req.body;

    const charity = await Charity.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }]
    });

    if (!charity) {
      return next(new AppError('Charity not found', 404));
    }

    // Update charity verification status
    await charity.update({
      verificationStatus,
      verificationNotes: reviewNotes,
      verificationDate: verificationStatus === 'verified' ? new Date() : null,
      documentationRequired: requiresDocumentation || false,
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    });

    // Send notification to charity
    await require('../services/notification.service').createNotification(
      charity.userId,
      'verification_update',
      'Verification Status Update',
      `Your charity verification status has been updated to: ${verificationStatus}`,
      { charityId: charity.id, verificationStatus },
      '/charity/profile'
    );

    res.status(200).json({
      success: true,
      data: charity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review volunteer verification
// @route   POST /api/moderator/volunteers/:id/review
// @access  Private (Moderator role)
exports.reviewVolunteer = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const { approvalStatus, backgroundCheckStatus, reviewNotes } = req.body;

    const volunteer = await Volunteer.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }]
    });

    if (!volunteer) {
      return next(new AppError('Volunteer not found', 404));
    }

    const updateData = {
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    };

    if (approvalStatus) {
      updateData.approvalStatus = approvalStatus;
      updateData.approvalNotes = reviewNotes;
    }

    if (backgroundCheckStatus) {
      updateData.backgroundCheckStatus = backgroundCheckStatus;
      if (backgroundCheckStatus === 'approved') {
        updateData.backgroundCheckDate = new Date();
      }
    }

    // Update volunteer verification status
    await volunteer.update(updateData);

    // Send notification to volunteer
    const notifType = approvalStatus === 'approved' ? 'volunteer_verified' : 'system_announcement';
    await require('../services/notification.service').createNotification(
      volunteer.userId,
      notifType,
      'Verification Status Update',
      `Your verification status has been updated.`,
      { volunteerId: volunteer.id, approvalStatus, backgroundCheckStatus },
      '/volunteer/profile'
    );

    res.status(200).json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get charity details for review
// @route   GET /api/moderator/charities/:id/details
// @access  Private (Moderator role)
exports.getCharityDetails = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const charity = await Charity.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'phoneNumber', 'createdAt']
        }
      ]
    });

    if (!charity) {
      return next(new AppError('Charity not found', 404));
    }

    // Get charity's opportunities
    const opportunities = await Opportunity.findAll({
      where: { charityId: charity.id },
      attributes: ['id', 'title', 'status', 'createdAt', 'numberOfVolunteers', 'volunteersConfirmed'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Get recent applications to charity's opportunities
    const recentApplications = await Application.findAll({
      include: [
        {
          model: Opportunity,
          as: 'opportunity',
          where: { charityId: charity.id },
          attributes: ['title']
        },
        {
          model: Volunteer,
          as: 'volunteer',
          include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }]
        }
      ],
      attributes: ['status', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        charity,
        opportunities,
        recentApplications
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get volunteer details for review
// @route   GET /api/moderator/volunteers/:id/details
// @access  Private (Moderator role)
exports.getVolunteerDetails = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const volunteer = await Volunteer.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'phoneNumber', 'createdAt']
        }
      ]
    });

    if (!volunteer) {
      return next(new AppError('Volunteer not found', 404));
    }

    // Get volunteer's application history
    const applicationHistory = await Application.findAll({
      where: { volunteerId: volunteer.id },
      include: [
        {
          model: Opportunity,
          as: 'opportunity',
          attributes: ['title', 'category'],
          include: [{ model: Charity, as: 'charity', attributes: ['organizationName'] }]
        }
      ],
      attributes: ['status', 'createdAt', 'confirmedAt', 'vettingScore', 'vettingNotes'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.status(200).json({
      success: true,
      data: {
        volunteer,
        applicationHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get volunteer applications with hours worked
// @route   GET /api/moderator/volunteers/:id/applications
// @access  Private (Moderator role)
exports.getVolunteerApplications = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const volunteer = await Volunteer.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    if (!volunteer) {
      return next(new AppError('Volunteer not found', 404));
    }

    // Get all applications by this volunteer with detailed information
    const applications = await Application.findAll({
      where: { volunteerId: volunteer.id },
      include: [
        {
          model: Opportunity,
          as: 'opportunity',
          attributes: ['id', 'title', 'description', 'category', 'startDate', 'endDate', 'numberOfVolunteers'],
          include: [
            {
              model: Charity,
              as: 'charity',
              attributes: ['id', 'organizationName']
            }
          ]
        }
      ],
      attributes: [
        'id',
        'status',
        'createdAt',
        'confirmedAt',
        'vettingScore',
        'vettingNotes',
        'hoursCommitted',
        'hoursWorked'
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics for moderator
// @route   GET /api/moderator/dashboard/stats
// @access  Private (Moderator role)
exports.getModeratorDashboardStats = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    // Get counts for various review items
    const stats = await Promise.all([
      // Pending charity verifications
      Charity.count({
        where: { verificationStatus: 'pending' }
      }),
      // Pending volunteer approvals
      Volunteer.count({
        where: { approvalStatus: 'pending' }
      }),
      // Applications flagged for moderation
      Application.count({
        where: { status: 'moderator_review' }
      }),
      // Background checks pending
      Volunteer.count({
        where: { backgroundCheckStatus: 'pending' }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        pendingCharityVerifications: stats[0],
        pendingVolunteerVerifications: stats[1],
        flaggedApplications: stats[2],
        pendingBackgroundChecks: stats[3]
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get charity opportunities for moderator review
// @route   GET /api/moderator/charities/:id/opportunities
// @access  Private (Moderator role)
exports.getCharityOpportunities = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const { page = 1, limit = 10, search, status, category } = req.query;
    const { id: charityId } = req.params;
    const offset = (page - 1) * limit;
    const where = { charityId };

    // Search functionality
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by status
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filter by category
    if (category && category !== 'all') {
      where.category = category;
    }

    const { count, rows: opportunities } = await Opportunity.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Charity,
          as: 'charity',
          attributes: ['organizationName']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count,
      total: count,
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

// @desc    Delete charity (soft delete)
// @route   DELETE /api/moderator/charities/:id
// @access  Private (Moderator role)
exports.deleteCharity = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const charity = await Charity.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }]
    });

    if (!charity) {
      return next(new AppError('Charity not found', 404));
    }

    // Check if charity has active opportunities
    const activeOpportunities = await Opportunity.count({
      where: {
        charityId: charity.id,
        status: { [Op.in]: ['published', 'active'] }
      }
    });

    if (activeOpportunities > 0) {
      return next(new AppError(
        `Cannot delete charity. There are ${activeOpportunities} active opportunities. Please close them first.`,
        400
      ));
    }

    const hard = req.query.hard === 'true';

    if (hard) {
      // Permanent delete
      await charity.destroy({ force: true });
      // Also attempt to permanently remove associated user
      if (charity.user) {
        try {
          await charity.user.destroy({ force: true });
        } catch (e) {
          // ignore user deletion errors but log
          console.error('Failed to hard-delete associated user:', e.message || e);
        }
      }

      return res.status(200).json({ success: true, message: 'Charity permanently deleted' });
    }

    // Soft-delete (deactivate)
    await charity.update({ isActive: false });
    // Also deactivate the associated user account before soft-delete
    if (charity.user) {
      await charity.user.update({ isActive: false, deactivatedAt: new Date(), deactivatedBy: req.user.id });
    }
    await charity.destroy();

    // Send notification to charity
    await require('../services/notification.service').createNotification(
      charity.userId,
      'account_deactivated',
      'Account Deactivated',
      'Your charity account has been deactivated by a moderator. Please contact support if you believe this is an error.',
      { charityId: charity.id, moderatorId: req.user.id },
      null
    );

    res.status(200).json({ success: true, message: 'Charity deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete volunteer (soft delete)
// @route   DELETE /api/moderator/volunteers/:id
// @access  Private (Moderator role)
exports.deleteVolunteer = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const volunteer = await Volunteer.findByPk(req.params.id, {
      paranoid: false,
      include: [{ model: User, as: 'user' }]
    });

    if (!volunteer) {
      return next(new AppError('Volunteer not found', 404));
    }

    // Check if volunteer has pending or confirmed applications
    const activeApplications = await Application.count({
      where: {
        volunteerId: volunteer.id,
        status: { [Op.in]: ['pending', 'under_review', 'approved', 'confirmed'] }
      }
    });

    if (activeApplications > 0) {
      return next(new AppError(
        `Cannot delete volunteer. There are ${activeApplications} active applications. Please handle them first.`,
        400
      ));
    }

    const hard = req.query.hard === 'true';

    if (hard) {
      // Permanent delete
      await volunteer.destroy({ force: true });
      if (volunteer.user) {
        try {
          await volunteer.user.destroy({ force: true });
        } catch (e) {
          console.error('Failed to hard-delete associated user:', e.message || e);
        }
      }
      return res.status(200).json({ success: true, message: 'Volunteer permanently deleted' });
    }

    // Soft-delete (deactivate)
    await volunteer.update({ isActive: false });
    // Also deactivate the associated user account before soft-delete
    if (volunteer.user) {
      await volunteer.user.update({ isActive: false, deactivatedAt: new Date(), deactivatedBy: req.user.id });
    }
    await volunteer.destroy();

    // Send notification to volunteer
    await require('../services/notification.service').createNotification(
      volunteer.userId,
      'account_deactivated',
      'Account Deactivated',
      'Your volunteer account has been deactivated by a moderator. Please contact support if you believe this is an error.',
      { volunteerId: volunteer.id, moderatorId: req.user.id },
      null
    );

    res.status(200).json({ success: true, message: 'Volunteer deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a volunteer
// @route   PUT /api/moderator/volunteers/:id/approve
// @access  Private (Moderator role)
exports.approveVolunteer = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const { id } = req.params;
    const { notes } = req.body;

    const volunteer = await Volunteer.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    if (!volunteer) {
      return next(new AppError('Volunteer not found', 404));
    }

    // Update volunteer approval status
    await volunteer.update({
      approvalStatus: 'approved',
      approvalDate: new Date(),
      approvedBy: req.user.id,
      approvalNotes: notes || 'Approved by moderator'
    });

    // Send notification to volunteer
    await require('../services/notification.service').createNotification(
      volunteer.userId,
      'volunteer_verified',
      'Volunteer Application Approved',
      'Congratulations! Your volunteer application has been approved. You can now apply for opportunities posted by charities.',
      { volunteerId: volunteer.id, moderatorId: req.user.id },
      null
    );

    // Send email notification
    // await require('../services/email.service').sendVolunteerApprovalEmail(
    //   volunteer.user.email,
    //   volunteer.user.firstName,
    //   notes
    // );

    res.status(200).json({
      success: true,
      message: 'Volunteer approved successfully',
      data: volunteer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a volunteer
// @route   PUT /api/moderator/volunteers/:id/reject
// @access  Private (Moderator role)
exports.rejectVolunteer = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const { id } = req.params;
    const { notes } = req.body;

    if (!notes || notes.trim().length === 0) {
      return next(new AppError('Rejection notes are required', 400));
    }

    const volunteer = await Volunteer.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    if (!volunteer) {
      return next(new AppError('Volunteer not found', 404));
    }

    // Update volunteer approval status
    await volunteer.update({
      approvalStatus: 'rejected',
      approvalDate: new Date(),
      approvedBy: req.user.id,
      approvalNotes: notes
    });

    // Send notification to volunteer
    await require('../services/notification.service').createNotification(
      volunteer.userId,
      'system_announcement',
      'Volunteer Application Rejected',
      'Your volunteer application has been rejected. Please review the notes from the moderator for more details.',
      { volunteerId: volunteer.id, moderatorId: req.user.id, notes },
      null
    );

    // Send email notification
    await require('../services/email.service').sendVolunteerRejectionEmail(
      volunteer.user.email,
      volunteer.user.firstName,
      notes
    );

    res.status(200).json({
      success: true,
      message: 'Volunteer rejected successfully',
      data: volunteer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate/reactivate charity
// @route   PUT /api/moderator/charities/:id/activate
// @access  Private (Moderator role)
exports.activateCharity = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const charity = await Charity.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }]
    });

    if (!charity) {
      return next(new AppError('Charity not found', 404));
    }

    if (charity.isActive) {
      return res.status(200).json({ success: true, message: 'Charity is already active', data: charity });
    }

    // Restore soft-deleted record if paranoid, then mark active
    if (charity.deletedAt) {
      await charity.restore?.();
    }

    await charity.update({ isActive: true });

    if (charity.user) {
      await charity.user.update({ isActive: true, deactivatedAt: null, deactivatedBy: null });
    }

    // Send notification to charity
    await require('../services/notification.service').createNotification(
      charity.userId,
      'account_reactivated',
      'Account Reactivated',
      'Your charity account has been reactivated by a moderator.',
      { charityId: charity.id, moderatorId: req.user.id },
      '/charity/profile'
    );

    res.status(200).json({ success: true, message: 'Charity reactivated successfully', data: charity });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate/reactivate volunteer
// @route   PUT /api/moderator/volunteers/:id/activate
// @access  Private (Moderator role)
exports.activateVolunteer = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const volunteer = await Volunteer.findByPk(req.params.id, {
      paranoid: false,
      include: [{ model: User, as: 'user' }]
    });

    if (!volunteer) {
      return next(new AppError('Volunteer not found', 404));
    }

    if (volunteer.isActive) {
      return res.status(200).json({ success: true, message: 'Volunteer is already active', data: volunteer });
    }

    if (volunteer.deletedAt) {
      await volunteer.restore?.();
    }

    await volunteer.update({ isActive: true });

    if (volunteer.user) {
      await volunteer.user.update({ isActive: true, deactivatedAt: null, deactivatedBy: null });
    }

    // Send notification to volunteer
    await require('../services/notification.service').createNotification(
      volunteer.userId,
      'account_reactivated',
      'Account Reactivated',
      'Your volunteer account has been reactivated by a moderator.',
      { volunteerId: volunteer.id, moderatorId: req.user.id },
      '/volunteer/profile'
    );

    res.status(200).json({ success: true, message: 'Volunteer reactivated successfully', data: volunteer });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all opportunities for moderator review
// @route   GET /api/moderator/opportunities
// @access  Private (Moderator role)
exports.getAllOpportunities = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const { page = 1, limit = 10, search, status, category } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    // Search functionality
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by status
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filter by category
    if (category && category !== 'all') {
      where.category = category;
    }

    const { count, rows: opportunities } = await Opportunity.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Charity,
          as: 'charity',
          attributes: ['organizationName', 'id'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName', 'email']
            }
          ]
        }
      ]
    });

    res.status(200).json({
      success: true,
      count,
      total: count,
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

// @desc    Suspend opportunity (moderator)
// @route   PUT /api/moderator/opportunities/:id/suspend
// @access  Private (Moderator role)
exports.suspendOpportunity = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return next(new AppError('Suspension reason is required', 400));
    }

    const opportunity = await Opportunity.findByPk(id, {
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

    if (opportunity.status === 'suspended') {
      return next(new AppError('Opportunity is already suspended', 400));
    }

    // Store previous status for restoration
    const previousStatus = opportunity.status;

    await opportunity.update({
      status: 'suspended',
      suspendedAt: new Date(),
      suspendedBy: req.user.id,
      suspensionReason: reason,
      previousStatus: previousStatus,
      moderatedBy: req.user.id,
      moderatedAt: new Date()
    });

    // Send notification to charity
    await require('../services/notification.service').createNotification(
      opportunity.charity.userId,
      'opportunity_suspended',
      'Opportunity Suspended',
      `Your opportunity "${opportunity.title}" has been suspended. Reason: ${reason}`,
      { 
        opportunityId: opportunity.id, 
        moderatorId: req.user.id,
        reason 
      },
      `/charity/opportunities/${opportunity.id}`
    );

    res.status(200).json({
      success: true,
      message: 'Opportunity suspended successfully',
      data: opportunity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resume/unsuspend opportunity (moderator)
// @route   PUT /api/moderator/opportunities/:id/resume
// @access  Private (Moderator role)
exports.resumeOpportunity = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const { id } = req.params;
    const { notes } = req.body;

    const opportunity = await Opportunity.findByPk(id, {
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

    if (opportunity.status !== 'suspended') {
      return next(new AppError('Opportunity is not suspended', 400));
    }

    // Restore previous status or default to published
    const restoredStatus = opportunity.previousStatus || 'published';

    await opportunity.update({
      status: restoredStatus,
      suspendedAt: null,
      suspendedBy: null,
      suspensionReason: null,
      previousStatus: null,
      resumedAt: new Date(),
      resumedBy: req.user.id,
      moderatedBy: req.user.id,
      moderatedAt: new Date()
    });

    // Send notification to charity
    await require('../services/notification.service').createNotification(
      opportunity.charity.userId,
      'opportunity_resumed',
      'Opportunity Resumed',
      `Your opportunity "${opportunity.title}" has been resumed and is now ${restoredStatus}.${notes ? ` Notes: ${notes}` : ''}`,
      { 
        opportunityId: opportunity.id, 
        moderatorId: req.user.id,
        notes 
      },
      `/charity/opportunities/${opportunity.id}`
    );

    res.status(200).json({
      success: true,
      message: 'Opportunity resumed successfully',
      data: opportunity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete opportunity (moderator)
// @route   DELETE /api/moderator/opportunities/:id
// @access  Private (Moderator role)
exports.deleteOpportunityAsModerator = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const { id } = req.params;
    const { reason } = req.body;

    const opportunity = await Opportunity.findByPk(id, {
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

    // Check if opportunity has active applications
    const activeApplications = await Application.count({
      where: {
        opportunityId: opportunity.id,
        status: { [Op.in]: ['pending', 'under_review', 'approved', 'confirmed'] }
      }
    });

    if (activeApplications > 0) {
      return next(new AppError(
        `Cannot delete opportunity. There are ${activeApplications} active applications. Please handle them first or suspend the opportunity instead.`,
        400
      ));
    }

    // Store deletion info before removing
    await opportunity.update({
      deletedBy: req.user.id,
      deletionReason: reason || 'Deleted by moderator',
      moderatedBy: req.user.id,
      moderatedAt: new Date()
    });

    await opportunity.destroy();

    // Send notification to charity
    await require('../services/notification.service').createNotification(
      opportunity.charity.userId,
      'opportunity_deleted',
      'Opportunity Deleted',
      `Your opportunity "${opportunity.title}" has been deleted by a moderator.${reason ? ` Reason: ${reason}` : ''}`,
      { 
        opportunityTitle: opportunity.title,
        moderatorId: req.user.id,
        reason 
      },
      '/charity/opportunities'
    );

    res.status(200).json({
      success: true,
      message: 'Opportunity deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};