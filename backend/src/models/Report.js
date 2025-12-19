const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reporterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  reportedEntityType: {
    type: DataTypes.ENUM('user', 'charity', 'opportunity', 'comment'),
    allowNull: false
  },
  reportedEntityId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  reason: {
    type: DataTypes.ENUM(
      'inappropriate_content',
      'spam',
      'harassment',
      'false_information',
      'safety_concern',
      'other'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'under_review', 'resolved', 'dismissed'),
    defaultValue: 'pending'
  },
  resolution: {
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
  actionTaken: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'e.g., Warning, Suspension, Ban, Content Removed'
  }
}, {
  tableName: 'reports',
  timestamps: true
});

module.exports = Report;
