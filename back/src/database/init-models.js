const sequelize = require('../config/sequelize');
const initSubscriptionModel = require('../modules/assinatura/model/subscription.model');
const initPlanModel = require('../modules/plano/model/plan.model');
const initStripeEventModel = require('../modules/stripe/model/stripe-event.model');
const initUserModel = require('../modules/usuario/model/user.model');

const User = initUserModel(sequelize);
const Plan = initPlanModel(sequelize);
const Subscription = initSubscriptionModel(sequelize);
const StripeEvent = initStripeEventModel(sequelize);

User.hasMany(Subscription, {
  foreignKey: 'userId',
  as: 'subscriptions'
});

Plan.hasMany(Subscription, {
  foreignKey: 'planId',
  as: 'subscriptions'
});

Subscription.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Subscription.belongsTo(Plan, {
  foreignKey: 'planId',
  as: 'plan'
});

module.exports = {
  sequelize,
  User,
  Plan,
  Subscription,
  StripeEvent
};
