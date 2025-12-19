const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to applications table
    await queryInterface.addColumn('applications', 'hours_committed', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Number of hours volunteer committed to work'
    });

    await queryInterface.addColumn('applications', 'hours_worked', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Actual number of hours volunteer worked'
    });

    // Update the status enum to include 'accepted'
    await queryInterface.changeColumn('applications', 'status', {
      type: DataTypes.ENUM('pending', 'under_review', 'approved', 'accepted', 'rejected', 'withdrawn', 'confirmed', 'additional_info_requested', 'moderator_review', 'background_check_required'),
      defaultValue: 'pending'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the new columns
    await queryInterface.removeColumn('applications', 'hours_committed');
    await queryInterface.removeColumn('applications', 'hours_worked');

    // Revert the status enum
    await queryInterface.changeColumn('applications', 'status', {
      type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected', 'withdrawn', 'confirmed', 'additional_info_requested', 'moderator_review', 'background_check_required'),
      defaultValue: 'pending'
    });
  }
};