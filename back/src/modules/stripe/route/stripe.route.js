const express = require('express');

const authMiddleware = require('../../../middlewares/auth.middleware');
const stripeController = require('../controller/stripe.controller');

const webhookRouter = express.Router();
const stripeRouter = express.Router();

webhookRouter.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  stripeController.handleWebhook
);

stripeRouter.post('/customer-portal', authMiddleware, stripeController.createCustomerPortalSession);

module.exports = {
  webhookRouter,
  stripeRouter
};
