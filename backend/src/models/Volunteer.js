const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Volunteer = sequelize.define('Volunteer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  skills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'e.g., Teaching, Cooking, Event Management'
  },
  interests: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'e.g., Education, Environment, Animal Welfare'
  },
  experience: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  qualifications: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  availability: {
    type: DataTypes.JSONB,
    defaultValue: {
      days: [],
      times: [],
      frequency: 'flexible'
    },
    comment: 'Preferred days, times, and frequency'
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  postalCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  maxTravelDistance: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: 'Maximum travel distance in kilometers'
  },
  approvalStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',

  },
  approvalDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when volunteer was approved/rejected by moderator'
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Moderator who approved/rejected the volunteer'
  },
  approvalNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes from moderator regarding approval/rejection'
  },
  backgroundCheckStatus: {
    type: DataTypes.ENUM('not_required', 'pending', 'approved', 'rejected'),
    defaultValue: 'not_required'
  },
  backgroundCheckDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emergencyContactName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergencyContactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergencyContactRelation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isAvailableForEmergency: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalHoursVolunteered: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalOpportunitiesCompleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  preferredCharities: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    defaultValue: []
  },
  notificationPreferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      email: true,
      sms: false,
      push: true,
      frequency: 'immediate',
      opportunityUpdates: true,
      applicationUpdates: true,
      generalNews: false
    }
  },
  privacySettings: {
    type: DataTypes.JSONB,
    defaultValue: {
      profileVisible: true,
      contactInfoVisible: false,
      skillsVisible: true,
      availabilityVisible: true
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'volunteers',
  timestamps: true,
  paranoid: true // Enable soft delete
});

module.exports = Volunteer;
