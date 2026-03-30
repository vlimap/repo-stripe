const httpError = require('../../../utils/http-error');
const PlanService = require('../../plano/service/plan.service');
const StripeService = require('../../stripe/service/stripe.service');
const SubscriptionService = require('../service/subscription.service');

class SubscriptionController {
  static sendError(res, error) {
    console.error(error);
    return res.status(error.status || 500).json({
      error: error.message || 'Erro interno do servidor.'
    });
  }

  static async getPaymentLink(req, res) {
    try {
      const { planCode } = req.body;

      if (!planCode) {
        throw httpError('Informe o codigo do plano.', 400);
      }

      const plan = await PlanService.findByCode(planCode);

      if (!plan || !plan.active) {
        throw httpError('Plano nao encontrado.', 404);
      }

      if (!plan.paymentLinkUrl) {
        throw httpError('Plano sem Payment Link configurado.', 400);
      }

      const url = StripeService.buildPaymentLink(plan.paymentLinkUrl, req.user);

      return res.json({
        url,
        plan: {
          code: plan.code,
          name: plan.name
        }
      });
    } catch (error) {
      return SubscriptionController.sendError(res, error);
    }
  }

  static async me(req, res) {
    try {
      const subscription = await SubscriptionService.getLatestByUser(req.user.id);

      return res.json({
        subscription: SubscriptionService.serializeSubscription(subscription)
      });
    } catch (error) {
      return SubscriptionController.sendError(res, error);
    }
  }

  static async premiumContent(req, res) {
    try {
      return res.json({
        message: 'Acesso premium liberado pelo backend.',
        user: {
          id: req.user.id,
          email: req.user.email
        },
        subscription: SubscriptionService.serializeSubscription(req.subscription)
      });
    } catch (error) {
      return SubscriptionController.sendError(res, error);
    }
  }
}

module.exports = SubscriptionController;
