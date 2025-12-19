const { User, Volunteer, Charity } = require('../models');
const { AppError } = require('../middleware/errorHandler');
const { sendTokenResponse } = require('../utils/auth');
const crypto = require('crypto');
const emailService = require('../services/email.service');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { 
      email, password, firstName, lastName, role, phoneNumber, consentGiven,
      // Charity specific fields
      organizationName, registrationNumber, description, missionStatement,
      areasOfFocus, websiteUrl, address, city, state, postalCode, country, contactPhone,
      // Volunteer specific fields
      volunteer
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new AppError('User with this email already exists', 400));
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
      phoneNumber,
      consentGiven,
      consentDate: consentGiven ? new Date() : null,
      verificationToken: crypto.randomBytes(32).toString('hex')
    });

    // Create role-specific profile
    if (role === 'volunteer') {
      const volunteerData = volunteer || {};
      await Volunteer.create({ 
        userId: user.id,
        dateOfBirth: volunteerData.dateOfBirth || null,
        bio: volunteerData.bio || '',
        skills: volunteerData.skills || [],
        interests: volunteerData.interests || [],
        city: volunteerData.city || city,
        state: volunteerData.state || state,
        country: volunteerData.country || country,
        maxTravelDistance: volunteerData.maxTravelDistance || 10,
        notificationPreferences: volunteerData.notificationPreferences || {
          email: true,
          sms: false,
          push: true,
          frequency: 'immediate',
          opportunityUpdates: true,
          applicationUpdates: true,
          generalNews: false
        },
        privacySettings: volunteerData.privacySettings || {
          profileVisible: true,
          contactInfoVisible: false,
          skillsVisible: true,
          availabilityVisible: true
        }
      });
    } else if (role === 'charity') {
      // Validate charity required fields
      if (!organizationName || !registrationNumber) {
        return next(new AppError('Organization name and registration number are required for charity registration', 400));
      }
      
      await Charity.create({ 
        userId: user.id,
        organizationName,
        registrationNumber,
        description: description || '',
        missionStatement: missionStatement || '',
        areasOfFocus: areasOfFocus || [],
        websiteUrl: websiteUrl || null,
        address: address || null,
        city: city || null,
        state: state || null,
        postalCode: postalCode || null,
        country: country || null,
        contactEmail: email,
        contactPhone: contactPhone || null,
        verificationStatus: 'pending' // Requires admin approval
      });
    }

    // Send verification email
    // await emailService.sendVerificationEmail(user);

    // Reload user with associations for token response
    const userWithAssociations = await User.findByPk(user.id, {
      include: [
        { association: 'volunteer' },
        { association: 'charity' }
      ]
    });

    sendTokenResponse(userWithAssociations, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with associations
    const user = await User.findOne({ 
      where: { email },
      include: [
        { association: 'volunteer' },
        { association: 'charity' }
      ]
    });

    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated', 403));
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { association: 'volunteer' },
        { association: 'charity' }
      ]
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile (including role-specific data)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phoneNumber, volunteer, charity, ...otherFields } = req.body;

    // Update user basic info
    const user = await User.findByPk(userId);
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    await user.save();

    // Update role-specific profile
    if (user.role === 'volunteer') {
      const { Volunteer } = require('../models');
      let volunteerProfile = await Volunteer.findOne({ where: { userId } });
      
      // Prepare volunteer update data
      const volunteerUpdateData = volunteer || {};
      
      if (volunteerProfile) {
        // Update all volunteer fields
        if (volunteerUpdateData.dateOfBirth !== undefined) volunteerProfile.dateOfBirth = volunteerUpdateData.dateOfBirth;
        if (volunteerUpdateData.bio !== undefined) volunteerProfile.bio = volunteerUpdateData.bio;
        if (volunteerUpdateData.skills !== undefined) volunteerProfile.skills = volunteerUpdateData.skills;
        if (volunteerUpdateData.interests !== undefined) volunteerProfile.interests = volunteerUpdateData.interests;
        if (volunteerUpdateData.qualifications !== undefined) volunteerProfile.qualifications = volunteerUpdateData.qualifications;
        if (volunteerUpdateData.experience !== undefined) volunteerProfile.experience = volunteerUpdateData.experience;
        if (volunteerUpdateData.city !== undefined) volunteerProfile.city = volunteerUpdateData.city;
        if (volunteerUpdateData.state !== undefined) volunteerProfile.state = volunteerUpdateData.state;
        if (volunteerUpdateData.postalCode !== undefined) volunteerProfile.postalCode = volunteerUpdateData.postalCode;
        if (volunteerUpdateData.country !== undefined) volunteerProfile.country = volunteerUpdateData.country;
        if (volunteerUpdateData.maxTravelDistance !== undefined) volunteerProfile.maxTravelDistance = volunteerUpdateData.maxTravelDistance;
        if (volunteerUpdateData.availability !== undefined) volunteerProfile.availability = volunteerUpdateData.availability;
        if (volunteerUpdateData.isAvailableForEmergency !== undefined) volunteerProfile.isAvailableForEmergency = volunteerUpdateData.isAvailableForEmergency;
        if (volunteerUpdateData.emergencyContactName !== undefined) volunteerProfile.emergencyContactName = volunteerUpdateData.emergencyContactName;
        if (volunteerUpdateData.emergencyContactPhone !== undefined) volunteerProfile.emergencyContactPhone = volunteerUpdateData.emergencyContactPhone;
        if (volunteerUpdateData.emergencyContactRelation !== undefined) volunteerProfile.emergencyContactRelation = volunteerUpdateData.emergencyContactRelation;
        if (volunteerUpdateData.notificationPreferences !== undefined) volunteerProfile.notificationPreferences = volunteerUpdateData.notificationPreferences;
        if (volunteerUpdateData.privacySettings !== undefined) volunteerProfile.privacySettings = volunteerUpdateData.privacySettings;
        
        await volunteerProfile.save();
      } else if (Object.keys(volunteerUpdateData).length > 0) {
        volunteerProfile = await Volunteer.create({
          userId,
          ...volunteerUpdateData
        });
      }
    } else if (user.role === 'charity' && charity) {
      const { Charity } = require('../models');
      let charityProfile = await Charity.findOne({ where: { userId } });
      
      if (charityProfile) {
        await charityProfile.update(charity);
      } else {
        charityProfile = await Charity.create({
          userId,
          ...charity
        });
      }
    }

    // Fetch updated user with profile
    const updatedUser = await User.findByPk(userId, {
      include: [
        { association: 'volunteer' },
        { association: 'charity' }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details (basic info only)
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phoneNumber } = req.body;

    // Update user basic info
    const user = await User.findByPk(userId);
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile (GET version of updateProfile for fetching)
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { association: 'volunteer' },
        { association: 'charity' }
      ]
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    // Check current password
    const isMatch = await user.comparePassword(req.body.currentPassword);

    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save();

    // Send email
    // await emailService.sendPasswordResetEmail(user, resetToken);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resetToken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpire: { [require('sequelize').Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return next(new AppError('Invalid or expired reset token', 400));
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
