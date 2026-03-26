const { DataTypes } = require('sequelize');

module.exports = function initStripeEventModel(sequelize) {
  return sequelize.define(
    'StripeEvent',
    {
      stripeEventId: {
        type: DataTypes.STRING,
        primaryKey: true
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      processedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'stripe_events',
      underscored: true,
      timestamps: false
    }
  );
};
