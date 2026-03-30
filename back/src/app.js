const cors = require('cors');
const express = require('express');

const planRoutes = require('./modules/plano/route/plan.route');
const subscriptionRoutes = require('./modules/assinatura/route/subscription.route');
const { stripeRouter, webhookRouter } = require('./modules/stripe/route/stripe.route');
const userRoutes = require('./modules/usuario/route/user.route');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : true;

app.use(cors({ origin: corsOrigin }));

// O webhook precisa ser registrado antes do express.json().
app.use('/stripe', webhookRouter);

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/usuarios', userRoutes);
app.use('/planos', planRoutes);
app.use('/assinaturas', subscriptionRoutes);
app.use('/stripe', stripeRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada.' });
});

module.exports = app;
