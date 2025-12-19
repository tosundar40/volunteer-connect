const { Charity, User } = require('../models');
const AppError = require('../utils/appError');

// Get all pending charity applications
exports.getPendingCharities = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { rows: charities, count } = await Charity.findAndCountAll({
      where: { verificationStatus: 'pending' },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'createdAt']
      }],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        charities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all charities (approved, pending, rejected)
exports.getAllCharities = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.verificationStatus = status;
    }

    const { rows: charities, count } = await Charity.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'createdAt']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        charities,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get charity details
exports.getCharityDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const charity = await Charity.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'createdAt',]
      }]
    });

    if (!charity) {
      return next(new AppError('Charity not found', 404));
    }

    res.json({
      success: true,
      data: { charity }
    });
  } catch (error) {
    next(error);
  }
};

// Approve charity application
exports.approveCharity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verificationNotes } = req.body;

    const charity = await Charity.findByPk(id, {
      include: [{ model: User, as: 'user' }]
    });

    if (!charity) {
      return next(new AppError('Charity not found', 404));
    }

    if (charity.verificationStatus === 'approved') {
      return next(new AppError('Charity is already approved', 400));
    }

    charity.verificationStatus = 'approved';
    charity.verificationNotes = verificationNotes || 'Application approved by admin';
    charity.verifiedAt = new Date();
    await charity.save();

    // You can add email notification here
    // await sendApprovalEmail(charity.User.email, charity.organizationName);

    res.json({
      success: true,
      message: 'Charity application approved successfully',
      data: { charity }
    });
  } catch (error) {
    next(error);
  }
};

// Reject charity application
exports.rejectCharity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verificationNotes } = req.body;

    const charity = await Charity.findByPk(id, {
      include: [{ model: User, as: 'user' }]
    });

    if (!charity) {
      return next(new AppError('Charity not found', 404));
    }

    if (!verificationNotes) {
      return next(new AppError('Please provide a reason for rejection', 400));
    }

    charity.verificationStatus = 'rejected';
    charity.verificationNotes = verificationNotes;
    await charity.save();

    // You can add email notification here
    // await sendRejectionEmail(charity.User.email, charity.organizationName, verificationNotes);

    res.json({
      success: true,
      message: 'Charity application rejected',
      data: { charity }
    });
  } catch (error) {
    next(error);
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const { Opportunity, Application, Volunteer } = require('../models');

    const [
      totalCharities,
      pendingCharities,
      approvedCharities,
      rejectedCharities,
      totalVolunteers,
      totalOpportunities,
      totalApplications
    ] = await Promise.all([
      Charity.count(),
      Charity.count({ where: { verificationStatus: 'pending' } }),
      Charity.count({ where: { verificationStatus: 'approved' } }),
      Charity.count({ where: { verificationStatus: 'rejected' } }),
      Volunteer.count(),
      Opportunity.count(),
      Application.count()
    ]);

    res.json({
      success: true,
      data: {
        charities: {
          total: totalCharities,
          pending: pendingCharities,
          approved: approvedCharities,
          rejected: rejectedCharities
        },
        volunteers: totalVolunteers,
        opportunities: totalOpportunities,
        applications: totalApplications
      }
    });
  } catch (error) {
    next(error);
  }
};
