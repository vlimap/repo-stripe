const { Router } = require('express');

const AuthMiddleware = require('../../../middlewares/auth.middleware');
const RequireActiveSubscriptionMiddleware = require('../../../middlewares/require-active-subscription.middleware');
const SubscriptionController = require('../controller/subscription.controller');

const router = Router();

router.post('/payment-link', AuthMiddleware.handle, SubscriptionController.getPaymentLink);
router.get('/me', AuthMiddleware.handle, SubscriptionController.me);
router.get(
  '/recurso-premium',
  AuthMiddleware.handle,
  RequireActiveSubscriptionMiddleware.handle,
  SubscriptionController.premiumContent
);

module.exports = router;
