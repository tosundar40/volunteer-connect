const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 */
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send verification email
 */
exports.sendVerificationEmail = async (user) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${user.verificationToken}`;

  const html = `
    <h1>Email Verification</h1>
    <p>Hello ${user.firstName},</p>
    <p>Thank you for registering with our Volunteering Platform.</p>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationUrl}">${verificationUrl}</a>
    <p>This link will expire in 24 hours.</p>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Verify Your Email Address',
    html
  });
};

/**
 * Send password reset email
 */
exports.sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const html = `
    <h1>Password Reset Request</h1>
    <p>Hello ${user.firstName},</p>
    <p>You have requested to reset your password.</p>
    <p>Please click the link below to reset your password:</p>
    <a href="${resetUrl}">${resetUrl}</a>
    <p>This link will expire in 30 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html
  });
};

/**
 * Send application confirmation email
 */
exports.sendApplicationConfirmationEmail = async (volunteer, opportunity) => {
  const html = `
    <h1>Application Submitted</h1>
    <p>Hello ${volunteer.user.firstName},</p>
    <p>Your application for "${opportunity.title}" has been submitted successfully.</p>
    <p>The charity will review your application and get back to you soon.</p>
  `;

  await sendEmail({
    to: volunteer.user.email,
    subject: 'Application Submitted',
    html
  });
};

/**
 * Send additional info request email
 */
exports.sendAdditionalInfoRequestEmail = async (volunteerEmail, details) => {
  const { volunteerName, charityName, opportunityTitle, infoRequested, message } = details;

  const requestedFields = infoRequested.map(field => `<li>${field}</li>`).join('');

  const html = `
    <h1>Additional Information Requested</h1>
    <p>Hello ${volunteerName},</p>
    <p>${charityName} has requested additional information for your application to "${opportunityTitle}".</p>
    
    <h3>Information Requested:</h3>
    <ul>
      ${requestedFields}
    </ul>
    
    <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff;">
      <p><strong>Message from charity:</strong></p>
      <p>${message}</p>
    </div>
    
    <p>Please log in to your account to provide the requested information.</p>
    <a href="${process.env.FRONTEND_URL}/volunteer/applications" 
       style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      Provide Information
    </a>
  `;

  await sendEmail({
    to: volunteerEmail,
    subject: 'Additional Information Requested for Your Application',
    html
  });
};

/**
 * Send application status update email
 */
exports.sendApplicationStatusUpdateEmail = async (volunteerEmail, details) => {
  const { volunteerName, opportunityTitle, status, message } = details;

  const statusMessages = {
    approved: 'Congratulations! Your application has been approved.',
    rejected: 'Your application status has been updated.',
    confirmed: 'You have been confirmed for this volunteering opportunity.',
    background_check_required: 'A background check is required to proceed with your application.'
  };

  const html = `
    <h1>Application Status Update</h1>
    <p>Hello ${volunteerName},</p>
    <p>${statusMessages[status] || 'Your application status has been updated.'}</p>
    <p><strong>Opportunity:</strong> ${opportunityTitle}</p>
    
    ${message ? `
      <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff;">
        <p><strong>Message from charity:</strong></p>
        <p>${message}</p>
      </div>
    ` : ''}
    
    <p>Please log in to your account to view more details.</p>
    <a href="${process.env.FRONTEND_URL}/volunteer/applications" 
       style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      View Applications
    </a>
  `;

  await sendEmail({
    to: volunteerEmail,
    subject: `Application Status Update - ${opportunityTitle}`,
    html
  });
};

/**
 * Send volunteer approval email
 */
exports.sendVolunteerApprovalEmail = async (volunteerEmail, volunteerName, approvalNotes) => {
  const html = `
    <h1>🎉 Volunteer Application Approved!</h1>
    <p>Hello ${volunteerName},</p>
    <p>Congratulations! Your volunteer application has been approved by our moderators.</p>
    
    <div style="background-color: #e8f5e8; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; border-radius: 5px;">
      <p><strong>You can now:</strong></p>
      <ul>
        <li>Browse and apply for volunteering opportunities</li>
        <li>Connect with registered charities</li>
        <li>Make a positive impact in your community</li>
      </ul>
    </div>
    
    ${approvalNotes && approvalNotes.trim() !== 'Approved by moderator' ? `
      <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff;">
        <p><strong>Notes from moderator:</strong></p>
        <p>${approvalNotes}</p>
      </div>
    ` : ''}
    
    <p>Start your volunteering journey today!</p>
    <a href="${process.env.FRONTEND_URL}/opportunities" 
       style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      Browse Opportunities
    </a>
  `;

  await sendEmail({
    to: volunteerEmail,
    subject: 'Volunteer Application Approved - Start Making a Difference!',
    html
  });
};

/**
 * Send volunteer rejection email
 */
exports.sendVolunteerRejectionEmail = async (volunteerEmail, volunteerName, rejectionNotes) => {
  const html = `
    <h1>Volunteer Application Update</h1>
    <p>Hello ${volunteerName},</p>
    <p>Thank you for your interest in volunteering with our platform. After careful review, we are unable to approve your volunteer application at this time.</p>
    
    <div style="background-color: #fff3cd; padding: 15px; margin: 15px 0; border-left: 4px solid #ffc107; border-radius: 5px;">
      <p><strong>Reason for rejection:</strong></p>
      <p>${rejectionNotes}</p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #6c757d; border-radius: 5px;">
      <p><strong>What you can do:</strong></p>
      <ul>
        <li>Review the feedback provided above</li>
        <li>Update your profile information if needed</li>
        <li>Contact our support team if you have questions</li>
        <li>Reapply after addressing the concerns mentioned</li>
      </ul>
    </div>
    
    <p>We appreciate your interest in volunteering and encourage you to reapply once you've addressed the feedback provided.</p>
    <p>If you have any questions, please don't hesitate to contact our support team.</p>
    
    <a href="${process.env.FRONTEND_URL}/contact" 
       style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      Contact Support
    </a>
  `;

  await sendEmail({
    to: volunteerEmail,
    subject: 'Volunteer Application Update',
    html
  });
};

/**
 * Send participation confirmation email
 */
exports.sendParticipationConfirmationEmail = async (volunteerEmail, data) => {
  const { volunteerName, opportunityTitle, charityName, committedHours, startDate } = data;
  
  const html = `
    <h1>Participation Confirmed!</h1>
    <p>Hello ${volunteerName},</p>
    
    <div style="background-color: #d4edda; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; border-radius: 5px;">
      <p><strong>🎉 Great news!</strong> Your participation has been confirmed for:</p>
      <p><strong>"${opportunityTitle}"</strong> with ${charityName}</p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px;">
      <p><strong>Your Commitment:</strong></p>
      <ul>
        <li><strong>Hours Committed:</strong> ${committedHours} hours</li>
        ${startDate ? `<li><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</li>` : ''}
        <li><strong>Charity:</strong> ${charityName}</li>
      </ul>
    </div>
    
    <div style="background-color: #d1ecf1; padding: 15px; margin: 15px 0; border-left: 4px solid #17a2b8; border-radius: 5px;">
      <p><strong>What's Next:</strong></p>
      <ul>
        <li>The charity will contact you with further details</li>
        <li>You can view your application status in your dashboard</li>
        <li>Prepare for an amazing volunteering experience!</li>
      </ul>
    </div>
    
    <p>Thank you for your commitment to making a difference in your community!</p>
    
    <a href="${process.env.FRONTEND_URL}/volunteer/my-applications" 
       style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      View My Applications
    </a>
  `;

  await sendEmail({
    to: volunteerEmail,
    subject: `Participation Confirmed - ${opportunityTitle}`,
    html
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail: exports.sendVerificationEmail,
  sendPasswordResetEmail: exports.sendPasswordResetEmail,
  sendApplicationConfirmationEmail: exports.sendApplicationConfirmationEmail,
  sendAdditionalInfoRequestEmail: exports.sendAdditionalInfoRequestEmail,
  sendApplicationStatusUpdateEmail: exports.sendApplicationStatusUpdateEmail,
  sendVolunteerApprovalEmail: exports.sendVolunteerApprovalEmail,
  sendVolunteerRejectionEmail: exports.sendVolunteerRejectionEmail,
  sendParticipationConfirmationEmail: exports.sendParticipationConfirmationEmail
};
