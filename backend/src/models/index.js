const sequelize = require('../config/database');
const User = require('./User');
const Charity = require('./Charity');
const Volunteer = require('./Volunteer');
const Opportunity = require('./Opportunity');
const Application = require('./Application');
const Attendance = require('./Attendance');
const Notification = require('./Notification');
const Report = require('./Report');

// Define associations

// User associations
User.hasOne(Charity, { foreignKey: 'userId', as: 'charity' });
User.hasOne(Volunteer, { foreignKey: 'userId', as: 'volunteer' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
User.hasMany(Report, { foreignKey: 'reporterId', as: 'reportsMade' });

// Charity associations
Charity.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Charity.hasMany(Opportunity, { foreignKey: 'charityId', as: 'opportunities' });
Charity.belongsTo(User, { foreignKey: 'verifiedBy', as: 'verifier' });

// Volunteer associations
Volunteer.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Volunteer.hasMany(Application, { foreignKey: 'volunteerId', as: 'applications' });
Volunteer.hasMany(Attendance, { foreignKey: 'volunteerId', as: 'attendanceRecords' });

// Opportunity associations
Opportunity.belongsTo(Charity, { foreignKey: 'charityId', as: 'charity' });
Opportunity.hasMany(Application, { foreignKey: 'opportunityId', as: 'applications' });
Opportunity.hasMany(Attendance, { foreignKey: 'opportunityId', as: 'attendanceRecords' });
Opportunity.belongsTo(User, { foreignKey: 'moderatedBy', as: 'moderator' });

// Application associations
Application.belongsTo(Opportunity, { foreignKey: 'opportunityId', as: 'opportunity' });
Application.belongsTo(Volunteer, { foreignKey: 'volunteerId', as: 'volunteer' });
Application.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

// Attendance associations
Attendance.belongsTo(Opportunity, { foreignKey: 'opportunityId', as: 'opportunity' });
Attendance.belongsTo(Volunteer, { foreignKey: 'volunteerId', as: 'volunteer' });
Attendance.belongsTo(User, { foreignKey: 'recordedBy', as: 'recorder' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Report associations
Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

module.exports = {
  sequelize,
  User,
  Charity,
  Volunteer,
  Opportunity,
  Application,
  Attendance,
  Notification,
  Report
};
