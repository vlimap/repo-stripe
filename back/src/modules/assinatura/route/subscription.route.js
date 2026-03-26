const { Router } = require('express');

const authMiddleware = require('../../../middlewares/auth.middleware');
const requireActiveSubscription = require('../../../middlewares/require-active-subscription.middleware');
const subscriptionController = require('../controller/subscription.controller');

const router = Router();

router.post('/payment-link', authMiddleware, subscriptionController.getPaymentLink);
router.get('/me', authMiddleware, subscriptionController.me);
router.get('/recurso-premium', authMiddleware, requireActiveSubscription, subscriptionController.premiumContent);

module.exports = router;
