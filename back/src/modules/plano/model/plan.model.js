const { DataTypes } = require('sequelize');

module.exports = function initPlanModel(sequelize) {
  return sequelize.define(
    'Plan',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      accessKey: {
        type: DataTypes.STRING,
        allowNull: false
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      paymentLinkUrl: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      stripePaymentLinkId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      tableName: 'planos',
      underscored: true
    }
  );
};
