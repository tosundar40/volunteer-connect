const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
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
  type: {
    type: DataTypes.ENUM(
      'application_received',
      'application_approved',
      'application_rejected',
      'opportunity_reminder',
      'attendance_recorded',
      'charity_approved',
      'charity_rejected',
      'volunteer_verified',
      'volunteer_approved',
      'new_opportunity_match',
      'message_received',
      'system_announcement',
      'verification_update',
      'account_deactivated',
      'account_reactivated',
      'additional_info_provided',
      'additional_info_requested',
      'volunteer_confirmed'

    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional data related to notification'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actionUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'URL to navigate when notification is clicked'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id', 'is_read']
    }
  ]
});

module.exports = Notification;
