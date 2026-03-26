const { Op } = require('sequelize');

const getStripe = require('../../../config/stripe');
const { Plan, Subscription, User } = require('../../../database/init-models');
const userService = require('../../usuario/service/user.service');

const ACTIVE_STATUSES = ['active', 'trialing'];

function fromUnixTimestamp(value) {
  return value ? new Date(value * 1000) : null;
}

function serializeSubscription(subscription) {
  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    status: subscription.status,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    stripeCustomerId: subscription.stripeCustomerId,
    stripeCheckoutSessionId: subscription.stripeCheckoutSessionId,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    endedAt: subscription.endedAt,
    plan: subscription.plan
      ? {
          code: subscription.plan.code,
          name: subscription.plan.name,
          accessKey: subscription.plan.accessKey
        }
      : null
  };
}

async function getLatestByUser(userId) {
  return Subscription.findOne({
    where: { userId },
    include: [
      {
        model: Plan,
        as: 'plan'
      }
    ],
    order: [['updatedAt', 'DESC']]
  });
}

async function getPremiumAccessByUser(userId) {
  return Subscription.findOne({
    where: {
      userId,
      status: {
        [Op.in]: ACTIVE_STATUSES
      }
    },
    include: [
      {
        model: Plan,
        as: 'plan',
        where: {
          accessKey: 'premium'
        }
      }
    ],
    order: [['updatedAt', 'DESC']]
  });
}

async function upsertFromCheckoutSession(session, plan) {
  const stripe = getStripe();
  const user = await User.findByPk(session.client_reference_id);
  const stripeSubscription = session.subscription
    ? await stripe.subscriptions.retrieve(session.subscription)
    : null;

  const values = {
    userId: user.id,
    planId: plan.id,
    status: stripeSubscription?.status || (session.payment_status === 'paid' ? 'active' : 'incomplete'),
    stripeSubscriptionId: session.subscription || null,
    stripeCustomerId: session.customer || null,
    stripeCheckoutSessionId: session.id,
    currentPeriodEnd: fromUnixTimestamp(stripeSubscription?.current_period_end),
    cancelAtPeriodEnd: Boolean(stripeSubscription?.cancel_at_period_end),
    endedAt: fromUnixTimestamp(stripeSubscription?.ended_at)
  };

  let subscription = values.stripeSubscriptionId
    ? await Subscription.findOne({
        where: { stripeSubscriptionId: values.stripeSubscriptionId }
      })
    : null;

  if (!subscription) {
    subscription = await Subscription.create(values);
  } else {
    await subscription.update(values);
  }

  if (values.stripeCustomerId) {
    await userService.updateStripeCustomerId(user.id, values.stripeCustomerId);
  }

  return Subscription.findByPk(subscription.id, {
    include: [{ model: Plan, as: 'plan' }]
  });
}

async function syncExistingByStripeSubscriptionId(stripeSubscriptionId, stripeCustomerId) {
  if (!stripeSubscriptionId) {
    return null;
  }

  const stripe = getStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  let subscription = await Subscription.findOne({
    where: { stripeSubscriptionId }
  });

  if (!subscription && stripeCustomerId) {
    subscription = await Subscription.findOne({
      where: { stripeCustomerId },
      order: [['updatedAt', 'DESC']]
    });
  }

  if (!subscription) {
    return null;
  }

  await subscription.update({
    status: stripeSubscription.status,
    stripeSubscriptionId: stripeSubscription.id,
    stripeCustomerId: stripeSubscription.customer,
    currentPeriodEnd: fromUnixTimestamp(stripeSubscription.current_period_end),
    cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
    endedAt: fromUnixTimestamp(stripeSubscription.ended_at)
  });

  if (stripeSubscription.customer) {
    await userService.updateStripeCustomerId(subscription.userId, stripeSubscription.customer);
  }

  return Subscription.findByPk(subscription.id, {
    include: [{ model: Plan, as: 'plan' }]
  });
}

async function syncFromStripeSubscriptionObject(stripeSubscription) {
  let subscription = await Subscription.findOne({
    where: { stripeSubscriptionId: stripeSubscription.id }
  });

  if (!subscription && stripeSubscription.customer) {
    subscription = await Subscription.findOne({
      where: { stripeCustomerId: stripeSubscription.customer },
      order: [['updatedAt', 'DESC']]
    });
  }

  if (!subscription) {
    return null;
  }

  await subscription.update({
    status: stripeSubscription.status,
    stripeSubscriptionId: stripeSubscription.id,
    stripeCustomerId: stripeSubscription.customer,
    currentPeriodEnd: fromUnixTimestamp(stripeSubscription.current_period_end),
    cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
    endedAt: fromUnixTimestamp(stripeSubscription.ended_at)
  });

  if (stripeSubscription.customer) {
    await userService.updateStripeCustomerId(subscription.userId, stripeSubscription.customer);
  }

  return Subscription.findByPk(subscription.id, {
    include: [{ model: Plan, as: 'plan' }]
  });
}

module.exports = {
  ACTIVE_STATUSES,
  getLatestByUser,
  getPremiumAccessByUser,
  serializeSubscription,
  syncExistingByStripeSubscriptionId,
  syncFromStripeSubscriptionObject,
  upsertFromCheckoutSession
};
