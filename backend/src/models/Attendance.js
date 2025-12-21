const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  opportunityId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'opportunities',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  volunteerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'volunteers',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
    allowNull: false
  },
  hoursWorked: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Actual hours worked'
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recordedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Charity user who recorded attendance'
  },
  volunteerFeedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  volunteerRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Rating given by volunteer to charity/opportunity'
  },
  charityFeedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  charityRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Rating given by charity to volunteer'
  }
}, {
  tableName: 'attendance',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['opportunity_id', 'volunteer_id'],
      name: 'attendances_opportunity_volunteer_unique'
    }
  ]
});

module.exports = Attendance;
