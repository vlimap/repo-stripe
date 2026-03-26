const subscriptionService = require('../modules/assinatura/service/subscription.service');

module.exports = async function requireActiveSubscription(req, res, next) {
  try {
    const subscription = await subscriptionService.getPremiumAccessByUser(req.user.id);

    if (!subscription) {
      return res.status(403).json({ error: 'Acesso premium nao liberado.' });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    next(error);
  }
};
