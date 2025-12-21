const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create enum types
    await queryInterface.sequelize.query('CREATE TYPE "enum_volunteers_approval_status" AS ENUM(\'pending\', \'approved\', \'rejected\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_volunteers_background_check_status" AS ENUM(\'not_required\', \'pending\', \'approved\', \'rejected\');');

    await queryInterface.createTable('volunteers', {
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
      date_of_birth: {
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
      postal_code: {
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
      max_travel_distance: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        comment: 'Maximum travel distance in kilometers'
      },
      approval_status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      approval_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Date when volunteer was approved/rejected by moderator'
      },
      approved_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      approval_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notes from moderator regarding approval/rejection'
      },
      background_check_status: {
        type: DataTypes.ENUM('not_required', 'pending', 'approved', 'rejected'),
        defaultValue: 'not_required'
      },
      background_check_date: {
        type: DataTypes.DATE,
        allowNull: true
      },
      emergency_contact_name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      emergency_contact_phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      emergency_contact_relation: {
        type: DataTypes.STRING,
        allowNull: true
      },
      is_available_for_emergency: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      total_hours_volunteered: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      total_opportunities_completed: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      preferred_charities: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        defaultValue: []
      },
      notification_preferences: {
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
      privacy_settings: {
        type: DataTypes.JSONB,
        defaultValue: {
          profileVisible: true,
          contactInfoVisible: false,
          skillsVisible: true,
          availabilityVisible: true
        }
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
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
    await queryInterface.addIndex('volunteers', ['user_id'], { unique: true });
    await queryInterface.addIndex('volunteers', ['city']);
    await queryInterface.addIndex('volunteers', ['approval_status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('volunteers');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_volunteers_approval_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_volunteers_background_check_status";');
  }
};