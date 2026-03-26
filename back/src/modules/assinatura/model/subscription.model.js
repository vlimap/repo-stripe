const { DataTypes } = require('sequelize');

module.exports = function initSubscriptionModel(sequelize) {
  return sequelize.define(
    'Subscription',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      planId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'incomplete'
      },
      stripeSubscriptionId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
      },
      stripeCustomerId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      stripeCheckoutSessionId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      currentPeriodEnd: {
        type: DataTypes.DATE,
        allowNull: true
      },
      cancelAtPeriodEnd: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      endedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'assinaturas',
      underscored: true
    }
  );
};
