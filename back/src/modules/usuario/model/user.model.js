const { DataTypes } = require('sequelize');

module.exports = function initUserModel(sequelize) {
  return sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      stripeCustomerId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
      }
    },
    {
      tableName: 'usuarios',
      underscored: true
    }
  );
};
