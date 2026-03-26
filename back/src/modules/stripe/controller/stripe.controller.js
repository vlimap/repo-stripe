const getStripe = require('../../../config/stripe');
const stripeService = require('../service/stripe.service');

async function handleWebhook(req, res, next) {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Header stripe-signature ausente.' });
    }

    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    const result = await stripeService.handleWebhookEvent(event);

    return res.json({
      received: true,
      duplicate: result.duplicate
    });
  } catch (error) {
    if (error.type === 'StripeSignatureVerificationError') {
      return res.status(400).json({ error: 'Assinatura do webhook invalida.' });
    }

    return next(error);
  }
}

async function createCustomerPortalSession(req, res, next) {
  try {
    const session = await stripeService.createCustomerPortalSession(req.user);

    return res.json({ url: session.url });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  handleWebhook,
  createCustomerPortalSession
};
