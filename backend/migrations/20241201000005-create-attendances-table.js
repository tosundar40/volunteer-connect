const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create enum type
    await queryInterface.sequelize.query('CREATE TYPE "enum_attendance_status" AS ENUM(\'present\', \'absent\', \'late\', \'excused\');');

    await queryInterface.createTable('attendance', {
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
        type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
        allowNull: false
      },
      hours_worked: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Actual hours worked'
      },
      check_in_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      check_out_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      recorded_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'Charity user who recorded attendance'
      },
      charity_feedback: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      volunteer_feedback: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      charity_rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Rating given by charity to volunteer'
      },
      volunteer_rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Rating given by volunteer to charity/opportunity'
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
    await queryInterface.addIndex('attendance', ['opportunity_id']);
    await queryInterface.addIndex('attendance', ['volunteer_id']);
    await queryInterface.addIndex('attendance', ['status']);
    
    // Add unique constraint for opportunity_id and volunteer_id combination
    await queryInterface.addIndex('attendance', {
      fields: ['opportunity_id', 'volunteer_id'],
      unique: true,
      name: 'attendances_opportunity_volunteer_unique'
    });

    // Add CHECK constraints for rating validations
    await queryInterface.sequelize.query(`
      ALTER TABLE attendance ADD CONSTRAINT check_charity_rating_range 
      CHECK (charity_rating IS NULL OR (charity_rating >= 1 AND charity_rating <= 5))
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TABLE attendance ADD CONSTRAINT check_volunteer_rating_range 
      CHECK (volunteer_rating IS NULL OR (volunteer_rating >= 1 AND volunteer_rating <= 5))
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop CHECK constraints first
    await queryInterface.sequelize.query('ALTER TABLE attendance DROP CONSTRAINT IF EXISTS check_charity_rating_range');
    await queryInterface.sequelize.query('ALTER TABLE attendance DROP CONSTRAINT IF EXISTS check_volunteer_rating_range');
    
    await queryInterface.dropTable('attendance');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_attendance_status";');
  }
};