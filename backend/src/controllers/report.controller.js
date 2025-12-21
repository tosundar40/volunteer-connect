const { Report, User, Charity, Volunteer, Opportunity } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Create a new report
 * @route POST /api/reports
 * @access Private (Volunteer, Charity)
 */
exports.createReport = async (req, res, next) => {
  try {
    const { reportedEntityType, reportedEntityId, reason, description } = req.body;
    const reporterId = req.user.id;

    // Validate required fields
    if (!reportedEntityType || !reportedEntityId || !reason || !description) {
      return next(new AppError('All fields are required', 400));
    }

    // Validate entity type
    const validEntityTypes = ['user', 'charity', 'opportunity', 'comment'];
    if (!validEntityTypes.includes(reportedEntityType)) {
      return next(new AppError('Invalid entity type', 400));
    }

    // Validate reason
    const validReasons = [
      'inappropriate_content',
      'spam',
      'harassment',
      'false_information',
      'safety_concern',
      'other'
    ];
    if (!validReasons.includes(reason)) {
      return next(new AppError('Invalid reason', 400));
    }

    // Check if the entity exists
    let entity;
    switch (reportedEntityType) {
      case 'user':
        entity = await User.findByPk(reportedEntityId);
        break;
      case 'charity':
        entity = await Charity.findByPk(reportedEntityId);
        break;
      case 'opportunity':
        entity = await Opportunity.findByPk(reportedEntityId);
        break;
      // Add comment check when comments are implemented
      default:
        break;
    }

    if (!entity && reportedEntityType !== 'comment') {
      return next(new AppError('Reported entity not found', 404));
    }

    // Prevent users from reporting themselves
    if (reportedEntityType === 'user' && reportedEntityId === reporterId) {
      return next(new AppError('You cannot report yourself', 400));
    }

    // Check if user has already reported this entity
    const existingReport = await Report.findOne({
      where: {
        reporterId,
        reportedEntityType,
        reportedEntityId,
        status: ['pending', 'under_review']
      }
    });

    if (existingReport) {
      return next(new AppError('You have already reported this entity', 400));
    }

    // Create the report
    const report = await Report.create({
      reporterId,
      reportedEntityType,
      reportedEntityId,
      reason,
      description,
      status: 'pending'
    });

    logger.info(`Report created: ${report.id} by user ${reporterId}`);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: { report }
    });
  } catch (error) {
    logger.error('Error creating report:', error);
    next(error);
  }
};

/**
 * Get all reports submitted by the current user
 * @route GET /api/reports/my-reports
 * @access Private
 */
exports.getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.findAll({
      where: { reporterId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: { reports }
    });
  } catch (error) {
    logger.error('Error fetching user reports:', error);
    next(error);
  }
};

/**
 * Get a specific report by ID
 * @route GET /api/reports/:id
 * @access Private
 */
exports.getReportById = async (req, res, next) => {
  try {
    const report = await Report.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!report) {
      return next(new AppError('Report not found', 404));
    }

    // Only the reporter, moderators, or admins can view the report
    if (
      report.reporterId !== req.user.id &&
      req.user.role !== 'moderator' &&
      req.user.role !== 'admin'
    ) {
      return next(new AppError('Not authorized to view this report', 403));
    }

    // Populate entity details
    const reportObj = report.toJSON();
    let entityDetails = null;

    try {
      switch (report.reportedEntityType) {
        case 'user':
          const user = await User.findByPk(report.reportedEntityId, {
            attributes: ['id', 'firstName', 'lastName', 'email', 'role']
          });
          if (user) {
            entityDetails = {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
              role: user.role
            };
          }
          break;
        case 'charity':
          const charity = await Charity.findByPk(report.reportedEntityId, {
            attributes: ['id', 'organizationName', 'email', 'registrationNumber']
          });
          if (charity) {
            entityDetails = {
              id: charity.id,
              name: charity.organizationName,
              email: charity.email,
              registrationNumber: charity.registrationNumber
            };
          }
          break;
        case 'opportunity':
          const opportunity = await Opportunity.findByPk(report.reportedEntityId, {
            attributes: ['id', 'title', 'category', 'startDate', 'endDate'],
            include: [{
              model: Charity,
              as: 'charity',
              attributes: ['organizationName']
            }]
          });
          if (opportunity) {
            entityDetails = {
              id: opportunity.id,
              name: opportunity.title,
              category: opportunity.category,
              charityName: opportunity.charity?.organizationName,
              startDate: opportunity.startDate
            };
          }
          break;
        default:
          break;
      }
    } catch (err) {
      logger.warn(`Failed to fetch entity details for report ${report.id}: ${err.message}`);
    }

    res.status(200).json({
      success: true,
      data: { 
        report: {
          ...reportObj,
          entityDetails
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching report:', error);
    next(error);
  }
};

/**
 * Get all reports (Moderator only)
 * @route GET /api/reports
 * @access Private (Moderator, Admin)
 */
exports.getAllReports = async (req, res, next) => {
  try {
    const {
      status,
      reportedEntityType,
      reason,
      page = 1,
      limit = 20
    } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (reportedEntityType) {
      where.reportedEntityType = reportedEntityType;
    }

    if (reason) {
      where.reason = reason;
    }

    const offset = (page - 1) * limit;

    const { count, rows: reports } = await Report.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    // Populate entity details for each report
    const reportsWithEntityDetails = await Promise.all(
      reports.map(async (report) => {
        const reportObj = report.toJSON();
        let entityDetails = null;

        try {
          switch (report.reportedEntityType) {
            case 'user':
              const user = await User.findByPk(report.reportedEntityId, {
                attributes: ['id', 'firstName', 'lastName', 'email', 'role']
              });
              if (user) {
                entityDetails = {
                  id: user.id,
                  name: `${user.firstName} ${user.lastName}`,
                  email: user.email,
                  role: user.role
                };
              }
              break;
            case 'charity':
              const charity = await Charity.findByPk(report.reportedEntityId, {
                attributes: ['id', 'organizationName', 'email', 'registrationNumber']
              });
              if (charity) {
                entityDetails = {
                  id: charity.id,
                  name: charity.organizationName,
                  email: charity.email,
                  registrationNumber: charity.registrationNumber
                };
              }
              break;
            case 'opportunity':
              const opportunity = await Opportunity.findByPk(report.reportedEntityId, {
                attributes: ['id', 'title', 'category', 'startDate', 'endDate'],
                include: [{
                  model: Charity,
                  as: 'charity',
                  attributes: ['organizationName']
                }]
              });
              if (opportunity) {
                entityDetails = {
                  id: opportunity.id,
                  name: opportunity.title,
                  category: opportunity.category,
                  charityName: opportunity.charity?.organizationName,
                  startDate: opportunity.startDate
                };
              }
              break;
            default:
              break;
          }
        } catch (err) {
          logger.warn(`Failed to fetch entity details for report ${report.id}: ${err.message}`);
        }

        return {
          ...reportObj,
          entityDetails
        };
      })
    );

    res.status(200).json({
      success: true,
      count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      data: { reports: reportsWithEntityDetails }
    });
  } catch (error) {
    logger.error('Error fetching all reports:', error);
    next(error);
  }
};

/**
 * Update report status (Moderator only)
 * @route PUT /api/reports/:id/status
 * @access Private (Moderator, Admin)
 */
exports.updateReportStatus = async (req, res, next) => {
  try {
    const { status, resolution, actionTaken } = req.body;
    const reportId = req.params.id;

    const report = await Report.findByPk(reportId);

    if (!report) {
      return next(new AppError('Report not found', 404));
    }

    // Validate status
    const validStatuses = ['pending', 'under_review', 'resolved', 'dismissed'];
    if (status && !validStatuses.includes(status)) {
      return next(new AppError('Invalid status', 400));
    }

    // Update report
    const updateData = {};

    if (status) {
      updateData.status = status;
    }

    if (resolution) {
      updateData.resolution = resolution;
    }

    if (actionTaken) {
      updateData.actionTaken = actionTaken;
    }

    // If status is being changed to resolved or dismissed, record reviewer info
    if (status && ['resolved', 'dismissed'].includes(status)) {
      updateData.reviewedBy = req.user.id;
      updateData.reviewedAt = new Date();
    }

    await report.update(updateData);

    logger.info(`Report ${reportId} updated by moderator ${req.user.id}`);

    // Fetch updated report with associations
    const updatedReport = await Report.findByPk(reportId, {
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: { report: updatedReport }
    });
  } catch (error) {
    logger.error('Error updating report status:', error);
    next(error);
  }
};

/**
 * Delete a report (Moderator/Admin only)
 * @route DELETE /api/reports/:id
 * @access Private (Moderator, Admin)
 */
exports.deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findByPk(req.params.id);

    if (!report) {
      return next(new AppError('Report not found', 404));
    }

    await report.destroy();

    logger.info(`Report ${req.params.id} deleted by ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting report:', error);
    next(error);
  }
};

/**
 * Get report statistics (Moderator only)
 * @route GET /api/reports/stats
 * @access Private (Moderator, Admin)
 */
exports.getReportStats = async (req, res, next) => {
  try {
    const totalReports = await Report.count();
    const pendingReports = await Report.count({ where: { status: 'pending' } });
    const underReviewReports = await Report.count({ where: { status: 'under_review' } });
    const resolvedReports = await Report.count({ where: { status: 'resolved' } });
    const dismissedReports = await Report.count({ where: { status: 'dismissed' } });

    // Reports by entity type
    const reportsByEntityType = await Report.findAll({
      attributes: [
        'reportedEntityType',
        [Report.sequelize.fn('COUNT', Report.sequelize.col('id')), 'count']
      ],
      group: ['reportedEntityType']
    });

    // Reports by reason
    const reportsByReason = await Report.findAll({
      attributes: [
        'reason',
        [Report.sequelize.fn('COUNT', Report.sequelize.col('id')), 'count']
      ],
      group: ['reason']
    });

    res.status(200).json({
      success: true,
      data: {
        totalReports,
        pendingReports,
        underReviewReports,
        resolvedReports,
        dismissedReports,
        reportsByEntityType,
        reportsByReason
      }
    });
  } catch (error) {
    logger.error('Error fetching report statistics:', error);
    next(error);
  }
};

/**
 * Get reports for a specific entity (Moderator only)
 * @route GET /api/reports/entity/:entityType/:entityId
 * @access Private (Moderator, Admin)
 */
exports.getReportsForEntity = async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;

    const reports = await Report.findAll({
      where: {
        reportedEntityType: entityType,
        reportedEntityId: entityId
      },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'reporter',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: { reports }
    });
  } catch (error) {
    logger.error('Error fetching entity reports:', error);
    next(error);
  }
};
