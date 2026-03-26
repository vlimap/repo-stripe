const { Plan } = require('../../../database/init-models');

const DEFAULT_PLANS = [
  {
    code: 'BASIC',
    name: 'Basic',
    description: 'Plano de entrada para demonstrar catalogo local e checkout hospedado.',
    accessKey: 'basic',
    sortOrder: 10,
    paymentLinkUrlEnv: 'STRIPE_BASIC_PAYMENT_LINK_URL',
    paymentLinkIdEnv: 'STRIPE_BASIC_PAYMENT_LINK_ID'
  },
  {
    code: 'PRO',
    name: 'Pro',
    description: 'Plano premium mensal usado para liberar o recurso protegido.',
    accessKey: 'premium',
    sortOrder: 20,
    paymentLinkUrlEnv: 'STRIPE_PRO_PAYMENT_LINK_URL',
    paymentLinkIdEnv: 'STRIPE_PRO_PAYMENT_LINK_ID'
  },
  {
    code: 'PRO_YEARLY',
    name: 'Pro Anual',
    description: 'Plano premium anual para comparar produto, preco e recorrencia.',
    accessKey: 'premium',
    sortOrder: 30,
    paymentLinkUrlEnv: 'STRIPE_PRO_YEARLY_PAYMENT_LINK_URL',
    paymentLinkIdEnv: 'STRIPE_PRO_YEARLY_PAYMENT_LINK_ID'
  }
];

function readEnv(name) {
  return process.env[name] ? process.env[name].trim() : null;
}

function isPlaceholderPaymentLinkUrl(value) {
  return /^https:\/\/buy\.stripe\.com\/test_x+$/.test(value);
}

function isPlaceholderPaymentLinkId(value) {
  return /^plink_x+$/.test(value);
}

function normalizePaymentLinkUrl(value) {
  if (!value || isPlaceholderPaymentLinkUrl(value)) {
    return null;
  }

  return value;
}

function normalizePaymentLinkId(value) {
  if (!value || isPlaceholderPaymentLinkId(value)) {
    return null;
  }

  return value;
}

function buildPlanConfig(item) {
  return {
    code: item.code,
    name: item.name,
    description: item.description,
    accessKey: item.accessKey,
    sortOrder: item.sortOrder,
    paymentLinkUrl: normalizePaymentLinkUrl(readEnv(item.paymentLinkUrlEnv)),
    stripePaymentLinkId: normalizePaymentLinkId(readEnv(item.paymentLinkIdEnv)),
    active: true
  };
}

function validateUniquePaymentLinkIds(plans) {
  const seen = new Map();

  for (const plan of plans) {
    if (!plan.stripePaymentLinkId) {
      continue;
    }

    const duplicatePlanCode = seen.get(plan.stripePaymentLinkId);

    if (duplicatePlanCode) {
      throw new Error(
        `Payment Link ID duplicado no .env: "${plan.stripePaymentLinkId}" esta sendo usado por ${duplicatePlanCode} e ${plan.code}.`
      );
    }

    seen.set(plan.stripePaymentLinkId, plan.code);
  }
}

async function syncPlansFromEnv() {
  const plans = DEFAULT_PLANS.map(buildPlanConfig);

  validateUniquePaymentLinkIds(plans);

  for (const plan of plans) {
    await Plan.upsert(plan);
  }
}

async function findAllActive() {
  return Plan.findAll({
    where: { active: true },
    order: [['sortOrder', 'ASC']]
  });
}

async function findByCode(code) {
  return Plan.findOne({ where: { code } });
}

async function findByStripePaymentLinkId(stripePaymentLinkId) {
  return Plan.findOne({ where: { stripePaymentLinkId } });
}

module.exports = {
  DEFAULT_PLANS,
  syncPlansFromEnv,
  findAllActive,
  findByCode,
  findByStripePaymentLinkId
};
