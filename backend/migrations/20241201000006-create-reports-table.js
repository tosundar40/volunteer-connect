const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create enum types
    await queryInterface.sequelize.query('CREATE TYPE "enum_reports_reported_entity_type" AS ENUM(\'user\', \'charity\', \'opportunity\', \'comment\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_reports_reason" AS ENUM(\'inappropriate_content\', \'spam\', \'harassment\', \'false_information\', \'safety_concern\', \'other\');');
    await queryInterface.sequelize.query('CREATE TYPE "enum_reports_status" AS ENUM(\'pending\', \'under_review\', \'resolved\', \'dismissed\');');

    await queryInterface.createTable('reports', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      reporter_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      reported_entity_type: {
        type: DataTypes.ENUM('user', 'charity', 'opportunity', 'comment'),
        allowNull: false
      },
      reported_entity_id: {
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
      action_taken: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'e.g., Warning, Suspension, Ban, Content Removed'
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
    await queryInterface.addIndex('reports', ['reporter_id']);
    await queryInterface.addIndex('reports', ['reported_entity_type']);
    await queryInterface.addIndex('reports', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('reports');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reports_reported_entity_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reports_reason";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reports_status";');
  }
};