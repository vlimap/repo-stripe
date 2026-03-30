const SubscriptionService = require('../modules/assinatura/service/subscription.service');

class RequireActiveSubscriptionMiddleware {
  static sendError(res, error) {
    console.error(error);
    return res.status(error.status || 500).json({
      error: error.message || 'Erro interno do servidor.'
    });
  }

  static async handle(req, res, next) {
    try {
      const subscription = await SubscriptionService.getPremiumAccessByUser(req.user.id);

      if (!subscription) {
        return res.status(403).json({ error: 'Acesso premium nao liberado.' });
      }

      req.subscription = subscription;
      return next();
    } catch (error) {
      return RequireActiveSubscriptionMiddleware.sendError(res, error);
    }
  }
}

module.exports = RequireActiveSubscriptionMiddleware;
