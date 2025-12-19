const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addColumn('users', 'deactivated_at', {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when the account was deactivated by a moderator'
    });

    await queryInterface.addColumn('users', 'deactivated_by', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Moderator user id who deactivated this account'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'deactivated_by');
    await queryInterface.removeColumn('users', 'deactivated_at');
  }
};
