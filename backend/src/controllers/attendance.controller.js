const asyncHandler = require('express-async-handler');
const { Attendance, Application, Volunteer, User, Opportunity, Charity } = require('../models');
const { Op } = require('sequelize');
const Sequelize = require('sequelize');
const AppError = require('../utils/appError');

// @desc    Get volunteers for attendance tracking
// @route   GET /api/attendance/opportunity/:opportunityId/volunteers
// @access  Private (Charity)
const getVolunteersForAttendance = asyncHandler(async (req, res) => {
  const { opportunityId } = req.params;

  // Check if opportunity exists and belongs to the charity
  const opportunity = await Opportunity.findOne({
    where: { id: opportunityId },
    include: [
      {
        model: Charity,
        as: 'charity',
        where: { userId: req.user.id }
      }
    ]
  });

  if (!opportunity) {
    throw new AppError('Opportunity not found or unauthorized', 404);
  }

  // Get all confirmed volunteers for this opportunity
  const applications = await Application.findAll({
    where: {
      opportunityId,
      status: 'confirmed'
    },
    include: [
      {
        model: Volunteer,
        as: 'volunteer',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
          }
        ]
      }
    ]
  });

  // Get existing attendance records
  const attendanceRecords = await Attendance.findAll({
    where: { opportunityId }
  });

  // Map attendance records by volunteer ID for easy lookup
  const attendanceMap = {};
  attendanceRecords.forEach(record => {
    attendanceMap[record.volunteerId] = record;
  });

  // Combine application and attendance data
  const volunteersWithAttendance = applications.map(application => ({
    id: application.volunteer.id,
    applicationId: application.id,
    firstName: application.volunteer.user.firstName,
    lastName: application.volunteer.user.lastName,
    email: application.volunteer.user.email,
    phoneNumber: application.volunteer.user.phoneNumber,
    skills: application.volunteer.skills,
    attendance: attendanceMap[application.volunteer.id] || null
  }));

  res.status(200).json({
    success: true,
    data: volunteersWithAttendance
  });
});

// @desc    Record or update attendance for a volunteer
// @route   POST/PUT /api/attendance
// @access  Private (Charity)
const recordAttendance = asyncHandler(async (req, res) => {
  const {
    opportunityId,
    volunteerId,
    status,
    hoursWorked,
    checkInTime,
    checkOutTime,
    notes,
    charityFeedback,
    charityRating
  } = req.body;

  // Validate required fields
  if (!opportunityId || !volunteerId || !status) {
    throw new AppError('OpportunityId, volunteerId, and status are required', 400);
  }

  // Check if opportunity exists and belongs to the charity
  const opportunity = await Opportunity.findOne({
    where: { id: opportunityId },
    include: [
      {
        model: Charity,
        as: 'charity',
        where: { userId: req.user.id }
      }
    ]
  });

  if (!opportunity) {
    throw new AppError('Opportunity not found or unauthorized', 404);
  }

  // Check if volunteer has a confirmed application
  const application = await Application.findOne({
    where: {
      opportunityId,
      volunteerId,
      status: 'confirmed'
    }
  });

  if (!application) {
    throw new AppError('Volunteer not found or not confirmed for this opportunity', 404);
  }

  // Check if attendance record already exists
  let attendanceRecord = await Attendance.findOne({
    where: { opportunityId, volunteerId }
  });

  const attendanceData = {
    opportunityId,
    volunteerId,
    status,
    hoursWorked: hoursWorked || null,
    checkInTime: checkInTime || null,
    checkOutTime: checkOutTime || null,
    notes: notes || null,
    charityFeedback: charityFeedback || null,
    charityRating: charityRating || null,
    recordedBy: req.user.id
  };

  if (attendanceRecord) {
    // Update existing record
    attendanceRecord = await attendanceRecord.update(attendanceData);
  } else {
    // Create new record
    attendanceRecord = await Attendance.create(attendanceData);
  }

  // Recalculate and update volunteer totals (hours and opportunities completed)
  // Use aggregate queries to avoid race conditions and ensure correctness
  const volunteer = await Volunteer.findByPk(volunteerId);
  if (volunteer) {
    const hoursResult = await Attendance.findOne({
      where: { volunteerId, hoursWorked: { [Op.not]: null } },
      attributes: [
        [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('hours_worked')), 0), 'totalHours']
      ],
      raw: true
    });

    const completedResult = await Attendance.findOne({
      where: { volunteerId, status: { [Op.in]: ['present', 'late'] } },
      attributes: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'completedCount']],
      raw: true
    });

    const totalHours = hoursResult?.totalHours ? parseFloat(hoursResult.totalHours) : 0;
    const completedCount = completedResult?.completedCount ? parseInt(completedResult.completedCount, 10) : 0;

    await volunteer.update({
      totalHoursVolunteered: Math.round(totalHours),
      totalOpportunitiesCompleted: completedCount
    });
  }

  // Fetch the complete record with associations
  const completeRecord = await Attendance.findByPk(attendanceRecord.id, {
    include: [
      {
        model: Volunteer,
        as: 'volunteer',
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
    message: attendanceRecord.createdAt === attendanceRecord.updatedAt 
      ? 'Attendance recorded successfully' 
      : 'Attendance updated successfully',
    data: completeRecord
  });
});

// @desc    Get attendance records for an opportunity
// @route   GET /api/attendance/opportunity/:opportunityId
// @access  Private (Charity)
const getOpportunityAttendance = asyncHandler(async (req, res) => {
  const { opportunityId } = req.params;

  // Check if opportunity exists and belongs to the charity
  const opportunity = await Opportunity.findOne({
    where: { id: opportunityId },
    include: [
      {
        model: Charity,
        as: 'charity',
        where: { userId: req.user.id }
      }
    ]
  });

  if (!opportunity) {
    throw new AppError('Opportunity not found or unauthorized', 404);
  }

  const attendanceRecords = await Attendance.findAll({
    where: { opportunityId },
    include: [
      {
        model: Volunteer,
        as: 'volunteer',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    success: true,
    data: attendanceRecords
  });
});

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private (Charity)
const deleteAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const attendanceRecord = await Attendance.findByPk(id, {
    include: [
      {
        model: Opportunity,
        as: 'opportunity',
        include: [
          {
            model: Charity,
            as: 'charity',
            where: { userId: req.user.id }
          }
        ]
      }
    ]
  });

  if (!attendanceRecord) {
    throw new AppError('Attendance record not found or unauthorized', 404);
  }

  await attendanceRecord.destroy();

  res.status(200).json({
    success: true,
    message: 'Attendance record deleted successfully'
  });
});

// @desc    Get volunteer's own attendance history
// @route   GET /api/attendance/my-history
// @access  Private (Volunteer)
const getMyAttendanceHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, startDate, endDate } = req.query;
  
  // Get volunteer record
  const volunteer = await Volunteer.findOne({
    where: { userId: req.user.id }
  });

  if (!volunteer) {
    throw new AppError('Volunteer profile not found', 404);
  }

  // Build where conditions
  const whereConditions = {
    volunteerId: volunteer.id
  };

  if (status) {
    whereConditions.status = status;
  }

  if (startDate || endDate) {
    const dateFilter = {};
    if (startDate) dateFilter[Op.gte] = new Date(startDate);
    if (endDate) dateFilter[Op.lte] = new Date(endDate);
    whereConditions.createdAt = dateFilter;
  }

  const offset = (page - 1) * limit;

  const { count, rows: attendanceRecords } = await Attendance.findAndCountAll({
    where: whereConditions,
    include: [
      {
        model: Opportunity,
        as: 'opportunity',
        include: [
          {
            model: Charity,
            as: 'charity',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['firstName', 'lastName', 'email']
              }
            ]
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.status(200).json({
    success: true,
    data: attendanceRecords,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalRecords: count,
      limit: parseInt(limit)
    }
  });
});

// @desc    Submit volunteer feedback for attendance
// @route   PUT /api/attendance/:id/volunteer-feedback
// @access  Private (Volunteer)
const submitVolunteerFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { volunteerFeedback, volunteerRating } = req.body;

  // Get volunteer record
  const volunteer = await Volunteer.findOne({
    where: { userId: req.user.id }
  });

  if (!volunteer) {
    throw new AppError('Volunteer profile not found', 404);
  }

  // Find attendance record
  const attendanceRecord = await Attendance.findOne({
    where: { 
      id,
      volunteerId: volunteer.id
    },
    include: [
      {
        model: Opportunity,
        as: 'opportunity'
      }
    ]
  });

  if (!attendanceRecord) {
    throw new AppError('Attendance record not found or unauthorized', 404);
  }

  // Update feedback
  await attendanceRecord.update({
    volunteerFeedback: volunteerFeedback || null,
    volunteerRating: volunteerRating || null
  });

  res.status(200).json({
    success: true,
    message: 'Feedback submitted successfully',
    data: attendanceRecord
  });
});

// @desc    Get average charity rating for a volunteer
// @route   GET /api/attendance/volunteer/:volunteerId/average-rating
// @access  Private
const getVolunteerAverageRating = asyncHandler(async (req, res) => {
  const { volunteerId } = req.params;

  // Calculate average rating given by charities to this volunteer
  const result = await Attendance.findOne({
    where: {
      volunteerId,
      charityRating: { [Op.not]: null }
    },
    attributes: [
      [Sequelize.fn('AVG', Sequelize.col('charity_rating')), 'averageRating'],
      [Sequelize.fn('COUNT', Sequelize.col('charity_rating')), 'ratingCount']
    ],
    raw: true
  });

  const averageRating = result?.averageRating ? parseFloat(result.averageRating).toFixed(2) : null;
  const ratingCount = result?.ratingCount || 0;

  res.status(200).json({
    success: true,
    data: {
      volunteerId,
      averageRating: averageRating ? parseFloat(averageRating) : 0,
      ratingCount: parseInt(ratingCount)
    }
  });
});

// @desc    Get average volunteer rating for an opportunity
// @route   GET /api/attendance/opportunity/:opportunityId/average-rating
// @access  Private
const getOpportunityAverageRating = asyncHandler(async (req, res) => {
  const { opportunityId } = req.params;

  // Calculate average rating given by volunteers to this opportunity
  const result = await Attendance.findOne({
    where: {
      opportunityId,
      volunteerRating: { [Op.not]: null }
    },
    attributes: [
      [Sequelize.fn('AVG', Sequelize.col('volunteer_rating')), 'averageRating'],
      [Sequelize.fn('COUNT', Sequelize.col('volunteer_rating')), 'ratingCount']
    ],
    raw: true
  });

  const averageRating = result?.averageRating ? parseFloat(result.averageRating).toFixed(2) : null;
  const ratingCount = result?.ratingCount || 0;

  res.status(200).json({
    success: true,
    data: {
      opportunityId,
      averageRating: averageRating ? parseFloat(averageRating) : 0,
      ratingCount: parseInt(ratingCount)
    }
  });
});

// @desc    Get average charity rating for all opportunities by a charity
// @route   GET /api/attendance/charity/:charityId/average-rating
// @access  Private
const getCharityAverageRating = asyncHandler(async (req, res) => {
  const { charityId } = req.params;

  // Calculate average rating given by volunteers to all opportunities of this charity
  const result = await Attendance.findOne({
    where: {
      volunteerRating: { [Op.not]: null }
    },
    include: [
      {
        model: Opportunity,
        as: 'opportunity',
        where: { charityId },
        attributes: []
      }
    ],
    attributes: [
      [Sequelize.fn('AVG', Sequelize.col('volunteer_rating')), 'averageRating'],
      [Sequelize.fn('COUNT', Sequelize.col('volunteer_rating')), 'ratingCount']
    ],
    raw: true
  });

  const averageRating = result?.averageRating ? parseFloat(result.averageRating).toFixed(2) : null;
  const ratingCount = result?.ratingCount || 0;

  res.status(200).json({
    success: true,
    data: {
      charityId,
      averageRating: averageRating ? parseFloat(averageRating) : 0,
      ratingCount: parseInt(ratingCount)
    }
  });
});

module.exports = {
  getVolunteersForAttendance,
  recordAttendance,
  getOpportunityAttendance,
  deleteAttendance,
  getMyAttendanceHistory,
  submitVolunteerFeedback,
  getVolunteerAverageRating,
  getOpportunityAverageRating,
  getCharityAverageRating
};