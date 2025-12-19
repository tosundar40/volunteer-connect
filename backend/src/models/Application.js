const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define('Application', {
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
    type: DataTypes.ENUM('pending', 'under_review', 'approved', 'accepted', 'rejected', 'withdrawn', 'confirmed', 'additional_info_requested', 'moderator_review', 'background_check_required'),
    defaultValue: 'pending'
  },
  applicationMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Message from volunteer when applying'
  },
  reviewNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes from charity during review'
  },
  additionalInfoRequested: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Details about what additional information is needed from volunteer'
  },
  additionalInfoProvided: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional information provided by volunteer'
  },
  additionalInfoRequestedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  additionalInfoProvidedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  vettingScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Charity vetting score (1-10)'
  },
  vettingNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed vetting assessment from charity'
  },
  moderatorReviewStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'escalated'),
    allowNull: true
  },
  moderatorNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  moderatorReviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  moderatorReviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  flaggedForModeration: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  flaggedReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  confirmedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isSystemMatched: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'True if this was a system-suggested match'
  },
  matchScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Matching algorithm score (0-100)'
  },
  withdrawnReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  withdrawnAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  hoursCommitted: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Number of hours volunteer committed to work'
  },
  hoursWorked: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Actual number of hours volunteer worked'
  }
}, {
  tableName: 'applications',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['opportunity_id', 'volunteer_id']
    }
  ]
});

module.exports = Application;
