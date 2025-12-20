// Rating Service
// Utility functions for calculating and managing ratings

const { Attendance, Opportunity } = require('../models');
const { Op } = require('sequelize');

/**
 * Calculate average rating for a volunteer from all charity ratings
 * @param {string} volunteerId - UUID of the volunteer
 * @returns {Object} Rating data including average, total count, and individual ratings
 */
async function calculateVolunteerAverageRating(volunteerId) {
  try {
    const attendanceRecords = await Attendance.findAll({
      where: {
        volunteerId,
        charityRating: { [Op.ne]: null }
      },
      attributes: ['charityRating', 'createdAt'],
      include: [
        {
          model: Opportunity,
          as: 'opportunity',
          attributes: ['title', 'id']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (attendanceRecords.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        individualRatings: [],
        message: 'No ratings available'
      };
    }

    const totalRating = attendanceRecords.reduce((sum, record) => sum + record.charityRating, 0);
    const averageRating = (totalRating / attendanceRecords.length);

    return {
      averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      totalRatings: attendanceRecords.length,
      individualRatings: attendanceRecords.map(record => ({
        rating: record.charityRating,
        opportunityTitle: record.opportunity?.title,
        opportunityId: record.opportunity?.id,
        date: record.createdAt
      }))
    };
  } catch (error) {
    throw new Error(`Error calculating volunteer rating: ${error.message}`);
  }
}

/**
 * Calculate average rating for a charity from all volunteer ratings
 * @param {string} charityId - UUID of the charity
 * @returns {Object} Rating data including average, total count, and individual ratings
 */
async function calculateCharityAverageRating(charityId) {
  try {
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
      attributes: ['volunteerRating', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    if (attendanceRecords.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        individualRatings: [],
        message: 'No ratings available'
      };
    }

    const totalRating = attendanceRecords.reduce((sum, record) => sum + record.volunteerRating, 0);
    const averageRating = (totalRating / attendanceRecords.length);

    return {
      averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      totalRatings: attendanceRecords.length,
      individualRatings: attendanceRecords.map(record => ({
        rating: record.volunteerRating,
        opportunityTitle: record.opportunity?.title,
        opportunityId: record.opportunity?.id,
        date: record.createdAt
      }))
    };
  } catch (error) {
    throw new Error(`Error calculating charity rating: ${error.message}`);
  }
}

/**
 * Get rating statistics for both volunteer and charity
 * @param {string} volunteerId - UUID of the volunteer
 * @param {string} charityId - UUID of the charity
 * @returns {Object} Combined rating statistics
 */
async function getRatingStatistics(volunteerId = null, charityId = null) {
  try {
    const results = {};
    
    if (volunteerId) {
      results.volunteerRating = await calculateVolunteerAverageRating(volunteerId);
    }
    
    if (charityId) {
      results.charityRating = await calculateCharityAverageRating(charityId);
    }
    
    return results;
  } catch (error) {
    throw new Error(`Error getting rating statistics: ${error.message}`);
  }
}

module.exports = {
  calculateVolunteerAverageRating,
  calculateCharityAverageRating,
  getRatingStatistics
};