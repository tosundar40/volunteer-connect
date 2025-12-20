const { Charity, User, Opportunity, Application } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// @desc    Get all charities
// @route   GET /api/charities
// @access  Public
exports.getCharities = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, areasOfFocus, verificationStatus } = req.query;
    const offset = (page - 1) * limit;

    const where = { isActive: true };

    if (search) {
      where[Op.or] = [
        { organizationName: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (areasOfFocus) {
      where.areasOfFocus = { [Op.contains]: [areasOfFocus] };
    }

    if (verificationStatus) {
      where.verificationStatus = verificationStatus;
    } else {
      // By default, show only approved charities to public
      where.verificationStatus = 'approved';
    }

    const { count, rows: charities } = await Charity.findAndCountAll({
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
      data: charities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's charity profile
// @route   GET /api/charities/profile
// @access  Private (Charity)
exports.getCurrentCharityProfile = async (req, res, next) => {
  try {
    const charity = await Charity.findOne({
      where: { userId: req.user.id },
      include: [
        { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'phoneNumber'] }
      ]
    });

    if (!charity) {
      return next(new AppError('Charity profile not found', 404));
    }

    res.status(200).json({
      success: true,
      data: charity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single charity
// @route   GET /api/charities/:id
// @access  Public
exports.getCharity = async (req, res, next) => {
  try {
    const charity = await Charity.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'phoneNumber'] }
      ]
    });

    if (!charity) {
      return next(new AppError('Charity not found', 404));
    }

    res.status(200).json({
      success: true,
      data: charity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create/Update charity profile
// @route   POST /api/charities
// @access  Private (Charity role)
exports.createOrUpdateCharity = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if charity profile exists
    let charity = await Charity.findOne({ where: { userId } });

    if (charity) {
      // Update existing profile
      await charity.update(req.body);
      
      // Reset verification status if key fields changed
      if (req.body.organizationName || req.body.registrationNumber) {
        await charity.update({ verificationStatus: 'pending' });
      }
    } else {
      // Create new profile
      charity = await Charity.create({
        userId,
        ...req.body
      });
    }

    res.status(charity ? 200 : 201).json({
      success: true,
      data: charity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update charity profile
// @route   PUT /api/charities/:id
// @access  Private (Charity role - own profile)
exports.updateCharity = async (req, res, next) => {
  try {
    const charity = await Charity.findByPk(req.params.id);

    if (!charity) {
      return next(new AppError('Charity not found', 404));
    }

    // Check ownership
    if (charity.userId !== req.user.id && req.user.role !== 'moderator') {
      return next(new AppError('Not authorized to update this charity', 403));
    }

    await charity.update(req.body);

    res.status(200).json({
      success: true,
      data: charity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete charity profile
// @route   DELETE /api/charities/:id
// @access  Private (Charity role - own profile or Moderator)
exports.deleteCharity = async (req, res, next) => {
  try {
    const charity = await Charity.findByPk(req.params.id);

    if (!charity) {
      return next(new AppError('Charity not found', 404));
    }

    // Check ownership
    if (charity.userId !== req.user.id && req.user.role !== 'moderator') {
      return next(new AppError('Not authorized to delete this charity', 403));
    }

    await charity.update({ isActive: false });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get charity statistics// @route   GET /api/charity/stats
// @access  Private (Charity)
exports.getCurrentCharityStats = async (req, res, next) => {
  try {
    const charity = await Charity.findOne({
      where: { userId: req.user.id },
      include: [
        { association: 'opportunities' }
      ]
    });

    if (!charity) {
      return next(new AppError('Charity profile not found', 404));
    }

    // Count pending applications for this charity's opportunities
    const pendingStatuses = ['pending', 'under_review', 'additional_info_requested', 'moderator_review', 'background_check_required'];

    const pendingApplications = await Application.count({
      include: [
        {
          model: Opportunity,
          as: 'opportunity',
          where: { charityId: charity.id },
          attributes: []
        }
      ],
      where: {
        status: { [Op.in]: pendingStatuses }
      }
    });

    const stats = {
      totalOpportunities: charity.opportunities?.length || 0,
      activeOpportunities: charity.opportunities?.filter(o => o.status === 'published').length || 0,
      completedOpportunities: charity.opportunities?.filter(o => o.status === 'completed').length || 0,
      totalVolunteers: charity.totalVolunteers || 0,
      pendingApplications: pendingApplications || 0,
      rating: charity.rating || 0
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get charity stats by ID// @route   GET /api/charities/:id/stats
// @access  Public
exports.getCharityStats = async (req, res, next) => {
  try {
    const charity = await Charity.findByPk(req.params.id, {
      include: [
        { association: 'opportunities' }
      ]
    });

    if (!charity) {
      return next(new AppError('Charity not found', 404));
    }

    const stats = {
      totalOpportunities: charity.opportunities.length,
      activeOpportunities: charity.opportunities.filter(o => o.status === 'published').length,
      completedOpportunities: charity.opportunities.filter(o => o.status === 'completed').length,
      totalVolunteers: charity.totalVolunteers,
      rating: charity.rating
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/charity';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.'));
    }
  }
});

// @desc    Get charity profile
// @route   GET /api/charity/profile
// @access  Private (Charity)
exports.getCharityProfile = async (req, res, next) => {
  try {
    const charity = await Charity.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    if (!charity) {
      return next(new AppError('Charity profile not found', 404));
    }

    res.status(200).json({
      success: true,
      data: charity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update charity profile
// @route   PUT /api/charity/profile
// @access  Private (Charity)
exports.updateCharityProfile = async (req, res, next) => {
  try {
    const charity = await Charity.findOne({
      where: { userId: req.user.id }
    });

    if (!charity) {
      return next(new AppError('Charity profile not found', 404));
    }

    // Check if charity can be updated (not during pending review for critical changes)
    if (charity.verificationStatus === 'pending' && charity.verifiedAt === null) {
      return next(new AppError('Cannot update profile while initial verification is pending', 400));
    }

    const updateData = {
      organizationName: req.body.organizationName,
      description: req.body.description,
      missionStatement: req.body.missionStatement,
      areasOfFocus: JSON.parse(req.body.areasOfFocus || '[]'),
      websiteUrl: req.body.websiteUrl || null,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalCode,
      country: req.body.country,
      contactPhone: req.body.contactPhone,
    };

    // Handle file uploads
    if (req.files) {
      if (req.files.logo) {
        updateData.logo = `/uploads/charity/${req.files.logo[0].filename}`;
      }
      if (req.files.bannerImage) {
        updateData.bannerImage = `/uploads/charity/${req.files.bannerImage[0].filename}`;
      }
    }

    // If this is a major update after initial approval, mark for re-review
    const significantFields = ['organizationName', 'registrationNumber', 'missionStatement'];
    const hasSignificantChanges = significantFields.some(field => {
      return updateData[field] && updateData[field] !== charity[field];
    });

    if (hasSignificantChanges && charity.verificationStatus === 'approved') {
      updateData.verificationStatus = 'pending';
      updateData.verificationNotes = 'Profile updated - pending re-review';
    }

    await charity.update(updateData);

    const updatedCharity = await Charity.findOne({
      where: { userId: req.user.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedCharity,
      requiresReview: hasSignificantChanges && charity.verificationStatus === 'approved'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public charity profile
// @route   GET /api/charities/:charityId/profile
// @access  Public
exports.getPublicCharityProfile = async (req, res, next) => {
  try {
    const { charityId } = req.params;

    const charity = await Charity.findOne({
      where: { 
        id: charityId,
        verificationStatus: 'approved',
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName']
        }
      ],
      attributes: { exclude: ['verificationNotes', 'verifiedBy'] }
    });

    if (!charity) {
      return next(new AppError('Charity not found or not approved', 404));
    }

    res.status(200).json({
      success: true,
      data: charity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get charity's average rating from volunteers
// @route   GET /api/charities/:id/average-rating
// @access  Public
exports.getCharityAverageRating = async (req, res, next) => {
  try {
    const { Attendance, Opportunity } = require('../models');
    const charityId = req.params.id;

    // Get all attendance records with volunteer ratings for this charity's opportunities
    const attendanceRecords = await Attendance.findAll({
      include: [
        {
          model: Opportunity,
          as: 'opportunity',
          where: { charityId },
          attributes: ['id', 'title']
        }
      ],
      where: {
        volunteerRating: { [Op.ne]: null }
      },
      attributes: ['volunteerRating', 'id']
    });

    if (attendanceRecords.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          averageRating: 0,
          totalRatings: 0,
          message: 'No ratings available'
        }
      });
    }

    // Calculate average rating
    const totalRating = attendanceRecords.reduce((sum, record) => sum + record.volunteerRating, 0);
    const averageRating = (totalRating / attendanceRecords.length).toFixed(2);

    res.status(200).json({
      success: true,
      data: {
        averageRating: parseFloat(averageRating),
        totalRatings: attendanceRecords.length,
        individualRatings: attendanceRecords.map(record => record.volunteerRating)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Upload profile images middleware
exports.uploadProfileImages = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 }
]);
