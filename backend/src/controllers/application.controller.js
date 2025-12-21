const { Application, Opportunity, Volunteer, Charity, User } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('../services/notification.service');
const emailService = require('../services/email.service');

// @desc    Get all applications (for current user)
// @route   GET /api/applications
// @access  Private
exports.getApplications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    let applications;

    if (req.user.role === 'volunteer') {
      const volunteer = await Volunteer.findOne({ where: { userId: req.user.id } });
      if (!volunteer) {
        return next(new AppError('Volunteer profile not found', 404));
      }
      
      where.volunteerId = volunteer.id;
      applications = await Application.findAll({
        where,
        include: [
          { 
            model: Opportunity, 
            as: 'opportunity',
            include: [{ model: Charity, as: 'charity' }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else if (req.user.role === 'charity') {
      const charity = await Charity.findOne({ where: { userId: req.user.id } });
      if (!charity) {
        return next(new AppError('Charity profile not found', 404));
      }

      applications = await Application.findAll({
        where,
        include: [
          { 
            model: Opportunity, 
            as: 'opportunity',
            where: { charityId: charity.id }
          },
          {
            model: Volunteer,
            as: 'volunteer',
            include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email','phoneNumber'] }]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    }

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private
exports.getApplication = async (req, res, next) => {
  try {
    const application = await Application.findByPk(req.params.id, {
      include: [
        { 
          model: Opportunity, 
          as: 'opportunity',
          include: [{ model: Charity, as: 'charity' }]
        },
        {
          model: Volunteer,
          as: 'volunteer',
          include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email','phoneNumber'] }]
        }
      ]
    });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Check authorization
    const volunteer = await Volunteer.findOne({ where: { userId: req.user.id } });
    const charity = await Charity.findOne({ where: { userId: req.user.id } });

    const isVolunteerOwner = volunteer && application.volunteerId === volunteer.id;
    const isCharityOwner = charity && application.opportunity.charityId === charity.id;
    const isModerator = req.user.role === 'moderator';

    if (!isVolunteerOwner && !isCharityOwner && !isModerator) {
      return next(new AppError('Not authorized to view this application', 403));
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create application
// @route   POST /api/applications
// @access  Private (Volunteer role)
exports.createApplication = async (req, res, next) => {
  try {
    const { opportunityId, applicationMessage } = req.body;

    // Get volunteer profile
    const volunteer = await Volunteer.findOne({ where: { userId: req.user.id } });
    if (!volunteer) {
      return next(new AppError('Please complete your volunteer profile first', 403));
    }

    // Check if volunteer is approved by moderator
    if (volunteer.approvalStatus !== 'approved') {
      let message = 'Your volunteer application is still under review. Please wait for moderator approval before applying to opportunities.';
      if (volunteer.approvalStatus === 'rejected') {
        message = 'Your volunteer application has been rejected. Please review the moderator notes and update your profile if necessary.';
      }
      return next(new AppError(message, 403));
    }

    // Check if opportunity exists and is published
    const opportunity = await Opportunity.findByPk(opportunityId);
    if (!opportunity) {
      return next(new AppError('Opportunity not found', 404));
    }

    if (opportunity.status !== 'published') {
      return next(new AppError('This opportunity is not accepting applications', 400));
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      where: { opportunityId, volunteerId: volunteer.id }
    });

    if (existingApplication) {
      return next(new AppError('You have already applied for this opportunity', 400));
    }

    // Check if application deadline has passed
    if (opportunity.applicationDeadline && new Date() > new Date(opportunity.applicationDeadline)) {
      return next(new AppError('Application deadline has passed', 400));
    }

    // Create application
    const application = await Application.create({
      opportunityId,
      volunteerId: volunteer.id,
      applicationMessage,
      status: 'pending'
    });

    // Send notification to charity
    await notificationService.notifyCharityNewApplication(opportunity.charityId, application.id);

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id
// @access  Private (Charity role - for their opportunities)
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;

    const application = await Application.findByPk(req.params.id, {
      include: [{ model: Opportunity, as: 'opportunity' }]
    });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Get charity profile
    const charity = await Charity.findOne({ where: { userId: req.user.id } });
    if (!charity) {
      return next(new AppError('Charity profile not found', 404));
    }

    // Check if this application belongs to charity's opportunity
    if (application.opportunity.charityId !== charity.id && req.user.role !== 'moderator') {
      return next(new AppError('Not authorized to update this application', 403));
    }

    // Prevent approving or confirming when the opportunity is suspended
    const oppStatus = application.opportunity && application.opportunity.status;
    if ((oppStatus === 'suspended' || oppStatus === 'suspend') && ['approved', 'confirmed'].includes(status) && req.user.role !== 'moderator') {
      return next(new AppError('Cannot approve or confirm applications while the opportunity is suspended', 400));
    }

    // Update application
    await application.update({
      status,
      reviewNotes,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      ...(status === 'confirmed' && { confirmedAt: new Date() })
    });

    // Update opportunity volunteers count if confirmed
    if (status === 'confirmed') {
      await application.opportunity.increment('volunteersConfirmed');
    }

    // Send notification to volunteer
    await notificationService.notifyVolunteerApplicationUpdate(application.volunteerId, application.id, status);

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw application
// @route   PUT /api/applications/:id/withdraw
// @access  Private (Volunteer role - own application)
exports.withdrawApplication = async (req, res, next) => {
  try {
    const { withdrawnReason } = req.body;

    const application = await Application.findByPk(req.params.id);

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Get volunteer profile
    const volunteer = await Volunteer.findOne({ where: { userId: req.user.id } });
    if (!volunteer) {
      return next(new AppError('Volunteer profile not found', 404));
    }

    // Check ownership
    if (application.volunteerId !== volunteer.id) {
      return next(new AppError('Not authorized to withdraw this application', 403));
    }

    if (['withdrawn', 'rejected'].includes(application.status)) {
      return next(new AppError('Application cannot be withdrawn', 400));
    }

    // Update application
    await application.update({
      status: 'withdrawn',
      withdrawnReason,
      withdrawnAt: new Date()
    });

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request additional information from volunteer
// @route   POST /api/applications/:id/request-info
// @access  Private (Charity role)
exports.requestAdditionalInfo = async (req, res, next) => {
  try {
    const { infoRequested, message } = req.body;

    const application = await Application.findByPk(req.params.id, {
      include: [
        { model: Opportunity, as: 'opportunity' },
        { model: Volunteer, as: 'volunteer', include: [{ model: User, as: 'user' }] }
      ]
    });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Check charity ownership
    const charity = await Charity.findOne({ where: { userId: req.user.id } });
    if (!charity || application.opportunity.charityId !== charity.id) {
      return next(new AppError('Not authorized to request information for this application', 403));
    }

    // Update application status and add requested info
    await application.update({
      status: 'additional_info_requested',
      additionalInfoRequested: {
        fields: infoRequested,
        message,
        requestedBy: req.user.id,
        requestedAt: new Date()
      },
      additionalInfoRequestedAt: new Date(),
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    });

    // Send notification to volunteer
    await notificationService.notifyVolunteerAdditionalInfoRequest(
      application.volunteer.userId,
      application.id,
      message
    );

    // Send email notification
    try {
      await emailService.sendAdditionalInfoRequestEmail(
        application.volunteer.user.email,
        {
          volunteerName: `${application.volunteer.user.firstName} ${application.volunteer.user.lastName}`,
          charityName: application.opportunity.charity?.name || 'The charity',
          opportunityTitle: application.opportunity.title,
          infoRequested,
          message
        }
      );
    } catch (emailError) {
      console.error('Error sending additional info request email:', emailError);
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Provide additional information as volunteer
// @route   POST /api/applications/:id/provide-info
// @access  Private (Volunteer role)
exports.provideAdditionalInfo = async (req, res, next) => {
  try {
    const { additionalInfo } = req.body;

    const application = await Application.findByPk(req.params.id, {
      include: [
        { model: Opportunity, as: 'opportunity', include: [{ model: Charity, as: 'charity' }] },
        { model: Volunteer, as: 'volunteer' }
      ]
    });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Check volunteer ownership
    const volunteer = await Volunteer.findOne({ where: { userId: req.user.id } });
    if (!volunteer || application.volunteerId !== volunteer.id) {
      return next(new AppError('Not authorized to update this application', 403));
    }

    if (application.status !== 'additional_info_requested') {
      return next(new AppError('Additional information is not currently requested for this application', 400));
    }

    // Update application with provided info
    await application.update({
      status: 'under_review',
      additionalInfoProvided: additionalInfo,
      additionalInfoProvidedAt: new Date()
    });

    // Notify charity that info has been provided
    await notificationService.notifyCharityAdditionalInfoProvided(
      application.opportunity.charity.userId,
      application.id
    );

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete charity vetting
// @route   POST /api/applications/:id/complete-vetting
// @access  Private (Charity role)
exports.completeVetting = async (req, res, next) => {
  try {
    const { vettingScore, vettingNotes, requiresBackgroundCheck, flagForModeration, flaggedReason } = req.body;

    const application = await Application.findByPk(req.params.id, {
      include: [{ model: Opportunity, as: 'opportunity' }]
    });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Check charity ownership
    const charity = await Charity.findOne({ where: { userId: req.user.id } });
    if (!charity || application.opportunity.charityId !== charity.id) {
      return next(new AppError('Not authorized to complete vetting for this application', 403));
    }

    let newStatus = 'under_review';
    if (flagForModeration) {
      newStatus = 'moderator_review';
    } else if (requiresBackgroundCheck) {
      newStatus = 'background_check_required';
    }

    // Update application with vetting results
    await application.update({
      status: newStatus,
      vettingScore,
      vettingNotes,
      flaggedForModeration: flagForModeration || false,
      flaggedReason: flaggedReason || null,
      reviewedBy: req.user.id,
      reviewedAt: new Date()
    });

    // Send appropriate notifications
    if (flagForModeration) {
      await notificationService.notifyModeratorsApplicationFlagged(application.id, flaggedReason);
    } else if (requiresBackgroundCheck) {
      await notificationService.notifyVolunteerBackgroundCheckRequired(
        application.volunteerId,
        application.id
      );
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get applications for moderator review
// @route   GET /api/applications/moderator/review
// @access  Private (Moderator role)
exports.getApplicationsForModeratorReview = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const { flaggedReason } = req.query;
    const { Op } = require('sequelize');
    const where = {
      status: 'moderator_review'
    };

    if (flaggedReason) {
      where.flaggedReason = { [Op.iLike]: `%${flaggedReason}%` };
    }

    const applications = await Application.findAll({
      where,
      include: [
        {
          model: Opportunity,
          as: 'opportunity',
          include: [{ model: Charity, as: 'charity', include: [{ model: User, as: 'user' }] }]
        },
        {
          model: Volunteer,
          as: 'volunteer',
          include: [{ model: User, as: 'user' }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Moderator review application
// @route   POST /api/applications/:id/moderator-review
// @access  Private (Moderator role)
exports.moderatorReviewApplication = async (req, res, next) => {
  try {
    if (req.user.role !== 'moderator') {
      return next(new AppError('Access denied. Moderator role required.', 403));
    }

    const { reviewStatus, notes, newApplicationStatus } = req.body;

    const application = await Application.findByPk(req.params.id, {
      include: [
        { model: Opportunity, as: 'opportunity', include: [{ model: Charity, as: 'charity' }] },
        { model: Volunteer, as: 'volunteer', include: [{ model: User, as: 'user' }] }
      ]
    });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Update application with moderator review
    await application.update({
      moderatorReviewStatus: reviewStatus,
      moderatorNotes: notes,
      moderatorReviewedBy: req.user.id,
      moderatorReviewedAt: new Date(),
      status: newApplicationStatus || (reviewStatus === 'approved' ? 'under_review' : 'rejected'),
      flaggedForModeration: false
    });

    // Send notifications
    await notificationService.notifyCharityModeratorReview(
      application.opportunity.charity.userId,
      application.id,
      reviewStatus
    );

    await notificationService.notifyVolunteerApplicationUpdate(
      application.volunteer.userId,
      application.id,
      application.status
    );

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get volunteer profile for charity review
// @route   GET /api/applications/:id/volunteer-profile
// @access  Private (Charity role)
exports.getVolunteerProfileForReview = async (req, res, next) => {
  try {
    const application = await Application.findByPk(req.params.id, {
      include: [
        { model: Opportunity, as: 'opportunity' },
        {
          model: Volunteer,
          as: 'volunteer',
          include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'phone', 'createdAt','phoneNumber'] }]
        }
      ]
    });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Check charity ownership
    const charity = await Charity.findOne({ where: { userId: req.user.id } });
    if (!charity || application.opportunity.charityId !== charity.id) {
      return next(new AppError('Not authorized to view this volunteer profile', 403));
    }

    // Get volunteer's application history (summary)
    const volunteerApplicationHistory = await Application.findAll({
      where: { volunteerId: application.volunteerId },
      attributes: ['status', 'createdAt', 'confirmedAt'],
      include: [
        {
          model: Opportunity,
          as: 'opportunity',
          attributes: ['title', 'category'],
          include: [{ model: Charity, as: 'charity', attributes: ['name'] }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.status(200).json({
      success: true,
      data: {
        volunteer: application.volunteer,
        applicationHistory: volunteerApplicationHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm participation (Volunteer)
// @route   POST /api/applications/:id/confirm
// @access  Private (Volunteer role - own application)
exports.confirmParticipation = async (req, res, next) => {
  try {
    const { committedHours } = req.body;

    // Validate committed hours
    if (!committedHours || committedHours < 1 || committedHours > 168) {
      return next(new AppError('Please provide valid committed hours (1-168)', 400));
    }

    const application = await Application.findByPk(req.params.id, {
      include: [
        { 
          model: Opportunity, 
          as: 'opportunity',
          include: [{ model: Charity, as: 'charity' }]
        },
        {
          model: Volunteer,
          as: 'volunteer',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });

    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Get volunteer profile
    const volunteer = await Volunteer.findOne({ where: { userId: req.user.id } });
    if (!volunteer) {
      return next(new AppError('Volunteer profile not found', 404));
    }

    // Check ownership
    if (application.volunteerId !== volunteer.id) {
      return next(new AppError('Not authorized to confirm this application', 403));
    }

    // Check if application is approved
    if (application.status !== 'approved') {
      return next(new AppError('Only approved applications can be confirmed', 400));
    }

    // Update application status and add committed hours
    await application.update({
      status: 'confirmed',
      hoursCommitted: parseInt(committedHours),
      confirmedAt: new Date()
    });

    // Update opportunity volunteers confirmed count
    await application.opportunity.increment('volunteersConfirmed');

    // Send notification to charity
    await notificationService.notifyCharityVolunteerConfirmed(
      application.opportunity.charity.userId,
      application.id,
      committedHours
    );

    // Send confirmation email to volunteer
    // try {
    //   await emailService.sendParticipationConfirmationEmail(
    //     application.volunteer.user.email,
    //     {
    //       volunteerName: `${application.volunteer.user.firstName} ${application.volunteer.user.lastName}`,
    //       opportunityTitle: application.opportunity.title,
    //       charityName: application.opportunity.charity?.organizationName || 'the charity',
    //       committedHours,
    //       startDate: application.opportunity.startDate
    //     }
    //   );
    // } catch (emailError) {
    //   console.error('Error sending participation confirmation email:', emailError);
    // }

    res.status(200).json({
      success: true,
      message: 'Participation confirmed successfully',
      data: application
    });
  } catch (error) {
    next(error);
  }
};
