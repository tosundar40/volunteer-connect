const { Opportunity, Volunteer, User, Application, Charity } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('./notification.service');

/**
 * Calculate matching score between volunteer and opportunity
 * @param {Object} volunteer - Volunteer instance
 * @param {Object} opportunity - Opportunity instance
 * @returns {number} - Match score (0-100)
 */
const calculateMatchScore = (volunteer, opportunity) => {
  let score = 0;
  let factors = [];

  // Skills matching (40% weight)
  let skillsScore = 0;
  if (opportunity.requiredSkills && opportunity.requiredSkills.length > 0 && volunteer.skills && volunteer.skills.length > 0) {
    const matchingSkills = volunteer.skills.filter(skill =>
      opportunity.requiredSkills.some(reqSkill =>
        skill.toLowerCase().includes(reqSkill.toLowerCase()) ||
        reqSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );
    skillsScore = (matchingSkills.length / opportunity.requiredSkills.length) * 40;
    factors.push({
      factor: 'Skills',
      score: skillsScore,
      details: `Matched ${matchingSkills.length}/${opportunity.requiredSkills.length} required skills`
    });
  } else if (!opportunity.requiredSkills || opportunity.requiredSkills.length === 0) {
    skillsScore = 20; // Partial score if no specific skills required
    factors.push({ factor: 'Skills', score: skillsScore, details: 'No specific skills required' });
  }

  // Interest/Category matching (30% weight)
  let interestScore = 0;
  if (opportunity.category && volunteer.interests && volunteer.interests.length > 0) {
    if (volunteer.interests.some(interest =>
      interest.toLowerCase() === opportunity.category.toLowerCase() ||
      interest.toLowerCase().includes(opportunity.category.toLowerCase()) ||
      opportunity.category.toLowerCase().includes(interest.toLowerCase())
    )) {
      interestScore = 30;
      factors.push({ factor: 'Interest', score: interestScore, details: `Interest matches opportunity category: ${opportunity.category}` });
    } else {
      interestScore = 10;
      factors.push({ factor: 'Interest', score: interestScore, details: 'Some related interests found' });
    }
  } else {
    interestScore = 15;
    factors.push({ factor: 'Interest', score: interestScore, details: 'Category/interest matching not available' });
  }

  // Location matching (20% weight)
  let locationScore = 0;
  if (opportunity.locationType === 'virtual') {
    locationScore = 20;
    factors.push({ factor: 'Location', score: locationScore, details: 'Virtual opportunity - location perfect match' });
  } else if (opportunity.locationType === 'hybrid') {
    locationScore = 18;
    factors.push({ factor: 'Location', score: locationScore, details: 'Hybrid opportunity - flexible location' });
  } else if (volunteer.city && opportunity.city) {
    const volunteerCity = volunteer.city.toLowerCase().trim();
    const opportunityCity = opportunity.city.toLowerCase().trim();

    if (volunteerCity === opportunityCity) {
      locationScore = 20;
      factors.push({ factor: 'Location', score: locationScore, details: 'Same city match' });
    } else if (volunteer.state && opportunity.state &&
      volunteer.state.toLowerCase() === opportunity.state.toLowerCase()) {
      locationScore = 15;
      factors.push({ factor: 'Location', score: locationScore, details: 'Same state/region' });
    } else if (volunteer.country && opportunity.country &&
      volunteer.country.toLowerCase() === opportunity.country.toLowerCase()) {
      locationScore = 10;
      factors.push({ factor: 'Location', score: locationScore, details: 'Same country' });
    } else {
      locationScore = 5;
      factors.push({ factor: 'Location', score: locationScore, details: 'Different locations' });
    }
  } else {
    locationScore = 10;
    factors.push({ factor: 'Location', score: locationScore, details: 'Location data incomplete' });
  }

  // Availability matching (10% weight)
  let availabilityScore = 0;
  if (opportunity.startDate && opportunity.endDate) {
    const oppStartDate = new Date(opportunity.startDate);
    const oppEndDate = new Date(opportunity.endDate);
    const now = new Date();

    // Check if volunteer is generally available (simplified check)
    if (volunteer.availability && volunteer.availability.days) {
      const oppDay = oppStartDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      if (volunteer.availability.days.includes(oppDay)) {
        availabilityScore = 10;
        factors.push({ factor: 'Availability', score: availabilityScore, details: `Available on ${oppDay}` });
      } else {
        availabilityScore = 5;
        factors.push({ factor: 'Availability', score: availabilityScore, details: 'Limited availability match' });
      }
    } else {
      availabilityScore = 8;
      factors.push({ factor: 'Availability', score: availabilityScore, details: 'Availability preferences not specified' });
    }
  } else {
    availabilityScore = 5;
    factors.push({ factor: 'Availability', score: availabilityScore, details: 'Opportunity dates not specified' });
  }

  // Bonus factors
  let bonusScore = 0;

  // Experience bonus (up to 5 points)
  if (volunteer.experience && volunteer.experience.length > 0) {
    const relevantExperience = volunteer.experience.filter(exp =>
      opportunity.requiredSkills?.some(skill =>
        exp.description?.toLowerCase().includes(skill.toLowerCase()) ||
        exp.organization?.toLowerCase().includes(opportunity.category?.toLowerCase())
      )
    );
    if (relevantExperience.length > 0) {
      bonusScore += 3;
      factors.push({ factor: 'Experience', score: 3, details: 'Relevant volunteer experience found' });
    }
  }

  // Age/demographic suitability (up to 2 points)
  if (volunteer.dateOfBirth) {
    const age = new Date().getFullYear() - new Date(volunteer.dateOfBirth).getFullYear();
    if (age >= 18 && age <= 65) {
      bonusScore += 2;
      factors.push({ factor: 'Demographics', score: 2, details: 'Age suitable for volunteering' });
    }
  }

  const totalScore = Math.min(skillsScore + interestScore + locationScore + availabilityScore + bonusScore, 100);

  return {
    score: Math.round(totalScore),
    factors,
    recommendation: totalScore >= 70 ? 'Excellent Match' :
      totalScore >= 50 ? 'Good Match' :
        totalScore >= 30 ? 'Fair Match' : 'Poor Match'
  };
};

/**
 * Find matching volunteers for an opportunity
 * @param {string} opportunityId - Opportunity UUID
 * @param {number} limit - Maximum number of matches to return
 * @param {number} minScore - Minimum match score threshold (default: 30)
 * @returns {Array} - Array of volunteers with match scores
 */
exports.findMatchesForOpportunity = async (opportunityId, limit = 20, minScore = 30) => {
  try {
    const opportunity = await Opportunity.findByPk(opportunityId);

    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    // Build where clause for volunteers (only approved, active volunteers)
    const where = {
      approvalStatus: 'approved',
      isActive: true
    };

    // Get all potential volunteers (filter by location later in scoring)
    const volunteers = await Volunteer.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'phoneNumber']
        }
      ],
      limit: 500 // Get larger pool for better matching
    });

    // Calculate match scores for each volunteer
    const matches = volunteers.map(volunteer => {
      const matchResult = calculateMatchScore(volunteer, opportunity);
      return {
        volunteer,
        matchScore: matchResult.score,
        matchFactors: matchResult.factors,
        recommendation: matchResult.recommendation,
        user: volunteer.user
      };
    });

    // Filter by minimum score and sort by match score
    const qualifiedMatches = matches
      .filter(match => match.matchScore >= minScore)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    // Add ranking and additional metadata
    const rankedMatches = qualifiedMatches.map((match, index) => ({
      ...match,
      rank: index + 1,
      matchPercentage: Math.round(match.matchScore),
      recommendationColor: match.matchScore >= 70 ? 'success' :
        match.matchScore >= 50 ? 'info' :
          match.matchScore >= 30 ? 'warning' : 'error'
    }));

    return {
      totalFound: rankedMatches.length,
      totalEvaluated: volunteers.length,
      matches: rankedMatches,
      opportunity: {
        id: opportunity.id,
        title: opportunity.title,
        category: opportunity.category,
        requiredSkills: opportunity.requiredSkills,
        locationType: opportunity.locationType,
        city: opportunity.city,
        numberOfVolunteers: opportunity.numberOfVolunteers
      },
      searchCriteria: {
        minScore,
        limit
      }
    };
  } catch (error) {
    console.error('Error finding matches for opportunity:', error);
    throw error;
  }
};

/**
 * Get recommended opportunities for a volunteer
 * @param {string} volunteerId - Volunteer UUID
 * @param {number} limit - Maximum number of recommendations
 * @returns {Array} - Array of opportunities with match scores
 */
exports.getRecommendationsForVolunteer = async (volunteerId, limit = 10) => {
  try {
    const volunteer = await Volunteer.findByPk(volunteerId);
    console.log('Volunteer fetched for recommendations:', volunteerId);
    if (!volunteer) {
      throw new Error('Volunteer not found');
    }
    console.log('Calculating recommendations for volunteer:', volunteerId);
    console.log('Get the volunteer:', volunteer);
    // Build where clause for opportunities
    const where = {
      status: 'published',
      // moderationStatus: 'approved',
      startDate: { [Op.gte]: new Date() }
    };

    // Build flexible location filter
    const locationFilters = [];

    // Always include virtual and hybrid opportunities (location-flexible)
    locationFilters.push({ locationType: 'virtual' });
    locationFilters.push({ locationType: 'hybrid' });

    // If volunteer has location preferences, include matching locations
    if (volunteer.city) {
      locationFilters.push({ city: { [Op.iLike]: `%${volunteer.city}%` } });
    }
    if (volunteer.state) {
      locationFilters.push({ state: { [Op.iLike]: `%${volunteer.state}%` } });
    }
    if (volunteer.country) {
      locationFilters.push({ country: { [Op.iLike]: `%${volunteer.country}%` } });
    }

    // If volunteer has no location data, show all opportunities (scoring will handle it)
    if (locationFilters.length > 2) { // More than just virtual/hybrid
      where[Op.or] = locationFilters;
    } else if (!volunteer.city && !volunteer.state && !volunteer.country) {
      // No location restrictions if volunteer hasn't specified location
      // Don't add any location filter - show all opportunities
    } else {
      // Only virtual/hybrid available
      where[Op.or] = locationFilters;
    }

    // Get potential opportunities
    const opportunities = await Opportunity.findAll({
     // where,
      include: [{ association: 'charity' }]
    });
console.log(`Found ${opportunities.length} opportunities for recommendation evaluation.`);
    // Calculate match scores (compute numeric score and keep details)
    const recommendations = opportunities.map(opportunity => {
      const matchResult = calculateMatchScore(volunteer, opportunity);
      return {
        opportunity,
        matchScore: matchResult.score,
        matchDetails: matchResult
      };
    })
      .filter(rec => rec.matchScore >= 40) // Minimum 40% match for recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    return recommendations;
  } catch (error) {
    throw error;
  }
};

/**
 * Create system-suggested matches for charity review
 * @param {string} opportunityId - Opportunity UUID
 * @param {number} maxMatches - Maximum number of matches to suggest
 * @returns {Array} - Array of suggested matches
 */
exports.createSystemMatches = async (opportunityId, maxMatches = 10) => {
  try {
    const matches = await exports.findMatchesForOpportunity(opportunityId, maxMatches, 50);

    if (matches.length === 0) {
      return [];
    }

    const opportunity = await Opportunity.findByPk(opportunityId, {
      include: [{ model: Charity, as: 'charity' }]
    });

    // Check for existing applications to avoid duplicates
    const existingApplications = await Application.findAll({
      where: {
        opportunityId,
        volunteerId: { [Op.in]: matches.map(m => m.volunteer.id) }
      },
      attributes: ['volunteerId']
    });

    const existingVolunteerIds = existingApplications.map(app => app.volunteerId);

    // Filter out volunteers who already have applications
    const newMatches = matches.filter(match =>
      !existingVolunteerIds.includes(match.volunteer.id)
    );

    // Create suggested match applications
    const suggestedMatches = [];
    for (const match of newMatches) {
      const application = await Application.create({
        opportunityId,
        volunteerId: match.volunteer.id,
        status: 'pending',
        isSystemMatched: true,
        matchScore: match.matchScore,
        applicationMessage: `System-suggested match based on ${match.recommendation.toLowerCase()} compatibility (${match.matchScore}% match).`
      });

      suggestedMatches.push({
        application,
        volunteer: match.volunteer,
        matchScore: match.matchScore,
        matchFactors: match.matchFactors,
        recommendation: match.recommendation
      });

      // Notify charity about the suggested match
      await notificationService.notifyCharityVolunteerMatch(
        opportunity.charity.userId,
        opportunityId,
        match.volunteer.id
      );
    }

    return suggestedMatches;
  } catch (error) {
    throw error;
  }
};

/**
 * Get suggested matches for charity review
 * @param {string} charityId - Charity UUID
 * @param {string} opportunityId - Opportunity UUID (optional)
 * @returns {Array} - Array of suggested matches for review
 */
exports.getSuggestedMatchesForReview = async (charityId, opportunityId = null) => {
  try {
    const where = {
      isSystemMatched: true,
      status: 'pending'
    };

    const opportunityWhere = { charityId };
    if (opportunityId) {
      where.opportunityId = opportunityId;
    }

    const suggestedMatches = await Application.findAll({
      where,
      include: [
        {
          model: Opportunity,
          as: 'opportunity',
          where: opportunityWhere,
          include: [{ model: Charity, as: 'charity' }]
        },
        {
          model: Volunteer,
          as: 'volunteer',
          include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'email', 'phone'] }]
        }
      ],
      order: [['matchScore', 'DESC'], ['createdAt', 'DESC']]
    });

    return suggestedMatches;
  } catch (error) {
    throw error;
  }
};

/**
 * Charity review of suggested match
 * @param {string} applicationId - Application UUID
 * @param {string} charityUserId - Charity user UUID
 * @param {string} decision - 'accept' or 'decline'
 * @param {string} notes - Optional notes
 * @returns {Object} - Updated application
 */
exports.reviewSuggestedMatch = async (applicationId, charityUserId, decision, notes = null) => {
  try {
    const application = await Application.findByPk(applicationId, {
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
      throw new Error('Application not found');
    }

    if (!application.isSystemMatched) {
      throw new Error('This application is not a system-suggested match');
    }

    // Verify charity ownership
    if (application.opportunity.charity.userId !== charityUserId) {
      throw new Error('Not authorized to review this match');
    }

    let newStatus;
    if (decision === 'accept') {
      newStatus = 'under_review';

      // Notify volunteer about the accepted match
      await notificationService.notifyVolunteerApplicationUpdate(
        application.volunteer.userId,
        application.id,
        'under_review'
      );
    } else if (decision === 'decline') {
      newStatus = 'rejected';

      // Notify volunteer about the declined match
      await notificationService.notifyVolunteerApplicationUpdate(
        application.volunteer.userId,
        application.id,
        'rejected'
      );
    } else {
      throw new Error('Invalid decision. Must be "accept" or "decline"');
    }

    // Update application
    await application.update({
      status: newStatus,
      reviewNotes: notes,
      reviewedBy: charityUserId,
      reviewedAt: new Date()
    });

    return application;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  findMatchesForOpportunity: exports.findMatchesForOpportunity,
  getRecommendationsForVolunteer: exports.getRecommendationsForVolunteer,
  createSystemMatches: exports.createSystemMatches,
  getSuggestedMatchesForReview: exports.getSuggestedMatchesForReview,
  reviewSuggestedMatch: exports.reviewSuggestedMatch,
  calculateMatchScore
};
