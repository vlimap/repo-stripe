const { Op } = require('sequelize');

const getStripe = require('../../../config/stripe');
const { Plan, Subscription, User } = require('../../../database/init-models');
const UserService = require('../../usuario/service/user.service');

const ACTIVE_STATUSES = ['active', 'trialing'];

class SubscriptionService {
  static fromUnixTimestamp(value) {
    return value ? new Date(value * 1000) : null;
  }

  static buildSubscriptionValuesFromStripeSubscription(stripeSubscription) {
    return {
      status: stripeSubscription.status,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: stripeSubscription.customer,
      currentPeriodEnd: SubscriptionService.fromUnixTimestamp(stripeSubscription.current_period_end),
      cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
      endedAt: SubscriptionService.fromUnixTimestamp(stripeSubscription.ended_at)
    };
  }

  static buildSubscriptionValuesFromCheckoutSession(session, stripeSubscription, plan, userId) {
    return {
      userId,
      planId: plan.id,
      status: stripeSubscription?.status || (session.payment_status === 'paid' ? 'active' : 'incomplete'),
      stripeSubscriptionId: stripeSubscription?.id || session.subscription || null,
      stripeCustomerId: stripeSubscription?.customer || session.customer || null,
      stripeCheckoutSessionId: session.id,
      currentPeriodEnd: SubscriptionService.fromUnixTimestamp(stripeSubscription?.current_period_end),
      cancelAtPeriodEnd: Boolean(stripeSubscription?.cancel_at_period_end),
      endedAt: SubscriptionService.fromUnixTimestamp(stripeSubscription?.ended_at)
    };
  }

  static serializeSubscription(subscription) {
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

  static async getLatestByUser(userId) {
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

  static async getPremiumAccessByUser(userId) {
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

  static async reloadSubscription(subscriptionId) {
    return Subscription.findByPk(subscriptionId, {
      include: [{ model: Plan, as: 'plan' }]
    });
  }

  static async updateStoredCustomerId(userId, stripeCustomerId) {
    if (!stripeCustomerId) {
      return;
    }

    await UserService.updateStripeCustomerId(userId, stripeCustomerId);
  }

  static async findSubscriptionForStripeSync({ stripeSubscriptionId, stripeCustomerId }) {
    let subscription = stripeSubscriptionId
      ? await Subscription.findOne({
          where: { stripeSubscriptionId }
        })
      : null;

    if (!subscription && stripeCustomerId) {
      subscription = await Subscription.findOne({
        where: { stripeCustomerId },
        order: [['updatedAt', 'DESC']]
      });
    }

    return subscription;
  }

  static async syncStoredSubscription(subscription, values) {
    await subscription.update(values);
    await SubscriptionService.updateStoredCustomerId(subscription.userId, values.stripeCustomerId);
    return SubscriptionService.reloadSubscription(subscription.id);
  }

  static async upsertFromCheckoutSession(session, plan) {
    const stripe = getStripe();
    const user = await User.findByPk(session.client_reference_id);
    const stripeSubscription = session.subscription
      ? await stripe.subscriptions.retrieve(session.subscription)
      : null;

    const values = SubscriptionService.buildSubscriptionValuesFromCheckoutSession(
      session,
      stripeSubscription,
      plan,
      user.id
    );

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

    await SubscriptionService.updateStoredCustomerId(user.id, values.stripeCustomerId);

    return SubscriptionService.reloadSubscription(subscription.id);
  }

  static async syncExistingByStripeSubscriptionId(stripeSubscriptionId, stripeCustomerId) {
    if (!stripeSubscriptionId) {
      return null;
    }

    const stripe = getStripe();
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const subscription = await SubscriptionService.findSubscriptionForStripeSync({
      stripeSubscriptionId,
      stripeCustomerId: stripeSubscription.customer || stripeCustomerId
    });

    if (!subscription) {
      return null;
    }

    return SubscriptionService.syncStoredSubscription(
      subscription,
      SubscriptionService.buildSubscriptionValuesFromStripeSubscription(stripeSubscription)
    );
  }

  static async syncFromStripeSubscriptionObject(stripeSubscription) {
    const subscription = await SubscriptionService.findSubscriptionForStripeSync({
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: stripeSubscription.customer
    });

    if (!subscription) {
      return null;
    }

    return SubscriptionService.syncStoredSubscription(
      subscription,
      SubscriptionService.buildSubscriptionValuesFromStripeSubscription(stripeSubscription)
    );
  }
}

module.exports = SubscriptionService;
