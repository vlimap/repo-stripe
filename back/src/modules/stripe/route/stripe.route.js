const express = require('express');

const AuthMiddleware = require('../../../middlewares/auth.middleware');
const StripeController = require('../controller/stripe.controller');

const webhookRouter = express.Router();
const stripeRouter = express.Router();

webhookRouter.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  StripeController.handleWebhook
);

stripeRouter.post(
  '/customer-portal',
  AuthMiddleware.handle,
  StripeController.createCustomerPortalSession
);

module.exports = {
  webhookRouter,
  stripeRouter
};
