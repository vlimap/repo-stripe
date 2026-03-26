const getStripe = require('../../../config/stripe');
const { StripeEvent } = require('../../../database/init-models');
const httpError = require('../../../utils/http-error');
const subscriptionService = require('../../assinatura/service/subscription.service');
const planService = require('../../plano/service/plan.service');
const userService = require('../../usuario/service/user.service');

function buildPaymentLink(paymentLinkUrl, user) {
  const url = new URL(paymentLinkUrl);

  url.searchParams.set('client_reference_id', user.id);
  url.searchParams.set('locked_prefilled_email', user.email);

  return url.toString();
}

async function createCustomerPortalSession(user) {
  let stripeCustomerId = user.stripeCustomerId;

  if (!stripeCustomerId) {
    const latestSubscription = await subscriptionService.getLatestByUser(user.id);
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
    await userService.updateStripeCustomerId(user.id, stripeCustomerId);
  }

  return session;
}

async function handleCheckoutSessionCompleted(session) {
  if (!session.client_reference_id) {
    throw httpError('checkout.session.completed sem client_reference_id.', 400);
  }

  if (!session.payment_link) {
    throw httpError('checkout.session.completed sem payment_link.', 400);
  }

  const user = await userService.findById(session.client_reference_id);

  if (!user) {
    throw httpError('Usuario interno nao encontrado para o checkout.', 404);
  }

  const plan = await planService.findByStripePaymentLinkId(session.payment_link);

  if (!plan) {
    throw httpError('Plano local nao encontrado para o payment link recebido.', 400);
  }

  return subscriptionService.upsertFromCheckoutSession(session, plan);
}

async function handleInvoicePaid(invoice) {
  return subscriptionService.syncExistingByStripeSubscriptionId(invoice.subscription, invoice.customer);
}

async function handleInvoicePaymentFailed(invoice) {
  return subscriptionService.syncExistingByStripeSubscriptionId(invoice.subscription, invoice.customer);
}

async function handleCustomerSubscriptionUpdated(stripeSubscription) {
  return subscriptionService.syncFromStripeSubscriptionObject(stripeSubscription);
}

async function handleCustomerSubscriptionDeleted(stripeSubscription) {
  return subscriptionService.syncFromStripeSubscriptionObject(stripeSubscription);
}

async function handleWebhookEvent(event) {
  const existingEvent = await StripeEvent.findByPk(event.id);

  if (existingEvent) {
    return { duplicate: true };
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleCustomerSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleCustomerSubscriptionDeleted(event.data.object);
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

module.exports = {
  buildPaymentLink,
  createCustomerPortalSession,
  handleWebhookEvent
};
