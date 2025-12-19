const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Opportunity = sequelize.define('Opportunity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  charityId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'charities',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'e.g., Education, Environment, Healthcare'
  },
  requiredSkills: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  requiredQualifications: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  numberOfVolunteers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  volunteersConfirmed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  locationType: {
    type: DataTypes.ENUM('in-person', 'virtual', 'hybrid'),
    allowNull: false,
    defaultValue: 'in-person'
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
  virtualMeetingLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in hours'
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurrencePattern: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Pattern for recurring opportunities'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'in_progress', 'completed', 'cancelled','active'),
    defaultValue: 'draft'
  },
  visibility: {
    type: DataTypes.ENUM('public', 'private', 'invite_only'),
    defaultValue: 'public'
  },
  applicationDeadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ageRestriction: {
    type: DataTypes.JSONB,
    defaultValue: { min: 0, max: null }
  },
  physicalRequirements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  backgroundCheckRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  trainingRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  trainingDetails: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  benefits: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'e.g., Meals provided, Transport reimbursement'
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  contactPerson: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  moderationStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  moderationNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  moderatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  moderatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  closureNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes provided when closing/completing the opportunity'
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the opportunity was closed/completed'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'opportunities',
  timestamps: true
});

module.exports = Opportunity;
