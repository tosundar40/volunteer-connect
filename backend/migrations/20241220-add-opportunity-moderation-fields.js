const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, add the new columns
    await queryInterface.addColumn('opportunities', 'suspendedAt', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the opportunity was suspended by moderator'
    });

    await queryInterface.addColumn('opportunities', 'suspendedBy', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Moderator who suspended the opportunity'
    });

    await queryInterface.addColumn('opportunities', 'suspensionReason', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason provided for suspending the opportunity'
    });

    await queryInterface.addColumn('opportunities', 'previousStatus', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Status before suspension to restore later'
    });

    await queryInterface.addColumn('opportunities', 'resumedAt', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the opportunity was resumed'
    });

    await queryInterface.addColumn('opportunities', 'resumedBy', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Moderator who resumed the opportunity'
    });

    await queryInterface.addColumn('opportunities', 'deletedBy', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Moderator who deleted the opportunity'
    });

    await queryInterface.addColumn('opportunities', 'deletionReason', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason provided for deleting the opportunity'
    });

    // Add suspended to the status enum by creating a new enum type and updating the column
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_opportunities_status" ADD VALUE IF NOT EXISTS 'suspended';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    await queryInterface.removeColumn('opportunities', 'suspendedAt');
    await queryInterface.removeColumn('opportunities', 'suspendedBy');
    await queryInterface.removeColumn('opportunities', 'suspensionReason');
    await queryInterface.removeColumn('opportunities', 'previousStatus');
    await queryInterface.removeColumn('opportunities', 'resumedAt');
    await queryInterface.removeColumn('opportunities', 'resumedBy');
    await queryInterface.removeColumn('opportunities', 'deletedBy');
    await queryInterface.removeColumn('opportunities', 'deletionReason');

    // Note: Removing enum value from PostgreSQL is complex and not recommended
    // The 'suspended' value will remain in the enum even after rollback
  }
};