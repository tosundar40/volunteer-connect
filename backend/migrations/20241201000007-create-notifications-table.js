const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create enum types
    await queryInterface.sequelize.query(`CREATE TYPE "enum_notifications_type" AS ENUM(
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
      'volunteer_confirmed',
      'opportunity_suspended'
    );`);

    await queryInterface.sequelize.query('CREATE TYPE "enum_notifications_priority" AS ENUM(\'low\', \'medium\', \'high\');');

    await queryInterface.createTable('notifications', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
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
          'volunteer_confirmed',
          'opportunity_suspended'
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
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      action_url: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL to navigate when notification is clicked'
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['is_read']);
    await queryInterface.addIndex('notifications', ['user_id', 'is_read']);
    await queryInterface.addIndex('notifications', ['type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notifications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_priority";');
  }
};