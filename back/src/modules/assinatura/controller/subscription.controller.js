const httpError = require('../../../utils/http-error');
const planService = require('../../plano/service/plan.service');
const stripeService = require('../../stripe/service/stripe.service');
const subscriptionService = require('../service/subscription.service');

async function getPaymentLink(req, res, next) {
  try {
    const { planCode } = req.body;

    if (!planCode) {
      throw httpError('Informe o codigo do plano.', 400);
    }

    const plan = await planService.findByCode(planCode);

    if (!plan || !plan.active) {
      throw httpError('Plano nao encontrado.', 404);
    }

    if (!plan.paymentLinkUrl) {
      throw httpError('Plano sem Payment Link configurado.', 400);
    }

    const url = stripeService.buildPaymentLink(plan.paymentLinkUrl, req.user);

    return res.json({
      url,
      plan: {
        code: plan.code,
        name: plan.name
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const subscription = await subscriptionService.getLatestByUser(req.user.id);

    return res.json({
      subscription: subscriptionService.serializeSubscription(subscription)
    });
  } catch (error) {
    return next(error);
  }
}

function premiumContent(req, res) {
  return res.json({
    message: 'Acesso premium liberado pelo backend.',
    user: {
      id: req.user.id,
      email: req.user.email
    },
    subscription: subscriptionService.serializeSubscription(req.subscription)
  });
}

module.exports = {
  getPaymentLink,
  me,
  premiumContent
};
