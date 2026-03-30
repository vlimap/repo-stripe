const getStripe = require('../../../config/stripe');
const { StripeEvent } = require('../../../database/init-models');
const httpError = require('../../../utils/http-error');
const SubscriptionService = require('../../assinatura/service/subscription.service');
const PlanService = require('../../plano/service/plan.service');
const UserService = require('../../usuario/service/user.service');

class StripeService {
  static buildPaymentLink(paymentLinkUrl, user) {
    const url = new URL(paymentLinkUrl);

    url.searchParams.set('client_reference_id', user.id);
    url.searchParams.set('locked_prefilled_email', user.email);

    return url.toString();
  }

  static async createCustomerPortalSession(user) {
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const latestSubscription = await SubscriptionService.getLatestByUser(user.id);
      stripeCustomerId = latestSubscription?.stripeCustomerId || null;
    }

    if (!stripeCustomerId) {
      throw httpError('Usuario ainda nao possui customer criado na Stripe.', 400);
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.APP_URL}/`
    });

    if (!user.stripeCustomerId) {
      await UserService.updateStripeCustomerId(user.id, stripeCustomerId);
    }

    return session;
  }

  static async handleCheckoutSessionCompleted(session) {
    if (!session.client_reference_id) {
      throw httpError('checkout.session.completed sem client_reference_id.', 400);
    }

    if (!session.payment_link) {
      throw httpError('checkout.session.completed sem payment_link.', 400);
    }

    const user = await UserService.findById(session.client_reference_id);

    if (!user) {
      throw httpError('Usuario interno nao encontrado para o checkout.', 404);
    }

    const plan = await PlanService.findByStripePaymentLinkId(session.payment_link);

    if (!plan) {
      throw httpError('Plano local nao encontrado para o payment link recebido.', 400);
    }

    return SubscriptionService.upsertFromCheckoutSession(session, plan);
  }

  static async handleInvoicePaid(invoice) {
    return SubscriptionService.syncExistingByStripeSubscriptionId(
      invoice.subscription,
      invoice.customer
    );
  }

  static async handleInvoicePaymentFailed(invoice) {
    return SubscriptionService.syncExistingByStripeSubscriptionId(
      invoice.subscription,
      invoice.customer
    );
  }

  static async handleCustomerSubscriptionUpdated(stripeSubscription) {
    return SubscriptionService.syncFromStripeSubscriptionObject(stripeSubscription);
  }

  static async handleCustomerSubscriptionDeleted(stripeSubscription) {
    return SubscriptionService.syncFromStripeSubscriptionObject(stripeSubscription);
  }

  static async handleWebhookEvent(event) {
    const existingEvent = await StripeEvent.findByPk(event.id);

    if (existingEvent) {
      return { duplicate: true };
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await StripeService.handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'invoice.paid':
        await StripeService.handleInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await StripeService.handleInvoicePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.updated':
        await StripeService.handleCustomerSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await StripeService.handleCustomerSubscriptionDeleted(event.data.object);
        break;
      default:
        break;
    }

    await StripeEvent.create({
      stripeEventId: event.id,
      type: event.type,
      processedAt: new Date()
    });

    return { duplicate: false };
  }
}

module.exports = StripeService;
