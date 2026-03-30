const getStripe = require('../../../config/stripe');
const StripeService = require('../service/stripe.service');

class StripeController {
  static sendError(res, error) {
    console.error(error);
    return res.status(error.status || 500).json({
      error: error.message || 'Erro interno do servidor.'
    });
  }

  static async handleWebhook(req, res) {
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

      const result = await StripeService.handleWebhookEvent(event);

      return res.json({
        received: true,
        duplicate: result.duplicate
      });
    } catch (error) {
      if (error.type === 'StripeSignatureVerificationError') {
        return res.status(400).json({ error: 'Assinatura do webhook invalida.' });
      }

      return StripeController.sendError(res, error);
    }
  }

  static async createCustomerPortalSession(req, res) {
    try {
      const session = await StripeService.createCustomerPortalSession(req.user);

      return res.json({ url: session.url });
    } catch (error) {
      return StripeController.sendError(res, error);
    }
  }
}

module.exports = StripeController;
