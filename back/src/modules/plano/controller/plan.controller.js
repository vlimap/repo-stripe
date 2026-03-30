const PlanService = require('../service/plan.service');

class PlanController {
  static sendError(res, error) {
    console.error(error);
    return res.status(error.status || 500).json({
      error: error.message || 'Erro interno do servidor.'
    });
  }

  static async list(req, res) {
    try {
      const plans = await PlanService.findAllActive();

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
      return PlanController.sendError(res, error);
    }
  }
}

module.exports = PlanController;
