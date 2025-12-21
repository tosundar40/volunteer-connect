const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create enum types
    await queryInterface.sequelize.query(`CREATE TYPE "enum_applications_status" AS ENUM(
      'pending', 
      'under_review', 
      'approved', 
      'accepted', 
      'rejected', 
      'withdrawn', 
      'confirmed', 
      'additional_info_requested', 
      'moderator_review', 
      'background_check_required'
    );`);
    
    await queryInterface.sequelize.query('CREATE TYPE "enum_applications_moderator_review_status" AS ENUM(\'pending\', \'approved\', \'rejected\', \'escalated\');');

    await queryInterface.createTable('applications', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      opportunity_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'opportunities',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      volunteer_id: {
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
      application_message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Message from volunteer when applying'
      },
      review_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notes from charity during review'
      },
      additional_info_requested: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Details about what additional information is needed from volunteer'
      },
      additional_info_provided: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Additional information provided by volunteer'
      },
      additional_info_requested_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      additional_info_provided_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      vetting_score: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Charity vetting score (1-10)'
      },
      vetting_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Detailed vetting assessment from charity'
      },
      moderator_review_status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'escalated'),
        allowNull: true
      },
      moderator_notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      moderator_reviewed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      moderator_reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      flagged_for_moderation: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      flagged_reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      reviewed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      confirmed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      is_system_matched: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'True if this was a system-suggested match'
      },
      match_score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Matching algorithm score (0-100)'
      },
      withdrawn_reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      withdrawn_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      hours_committed: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Number of hours volunteer committed to work'
      },
      hours_worked: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Actual number of hours volunteer worked'
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
    await queryInterface.addIndex('applications', ['opportunity_id']);
    await queryInterface.addIndex('applications', ['volunteer_id']);
    await queryInterface.addIndex('applications', ['status']);
    await queryInterface.addIndex('applications', ['opportunity_id', 'volunteer_id'], { unique: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('applications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_applications_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_applications_moderator_review_status";');
  }
};