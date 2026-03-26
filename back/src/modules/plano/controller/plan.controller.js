const planService = require('../service/plan.service');

async function list(req, res, next) {
  try {
    const plans = await planService.findAllActive();

    return res.json({
      plans: plans.map((plan) => ({
        code: plan.code,
        name: plan.name,
        description: plan.description,
        accessKey: plan.accessKey,
        configured: Boolean(plan.paymentLinkUrl && plan.stripePaymentLinkId)
      }))
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list
};
