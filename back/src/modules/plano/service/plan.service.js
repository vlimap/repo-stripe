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

class PlanService {
  static readEnv(name) {
    return process.env[name] ? process.env[name].trim() : null;
  }

  static isPlaceholderPaymentLinkUrl(value) {
    return /^https:\/\/buy\.stripe\.com\/test_x+$/.test(value);
  }

  static isPlaceholderPaymentLinkId(value) {
    return /^plink_x+$/.test(value);
  }

  static normalizePaymentLinkUrl(value) {
    if (!value || PlanService.isPlaceholderPaymentLinkUrl(value)) {
      return null;
    }

    return value;
  }

  static normalizePaymentLinkId(value) {
    if (!value || PlanService.isPlaceholderPaymentLinkId(value)) {
      return null;
    }

    return value;
  }

  static buildPlanConfig(item) {
    return {
      code: item.code,
      name: item.name,
      description: item.description,
      accessKey: item.accessKey,
      sortOrder: item.sortOrder,
      paymentLinkUrl: PlanService.normalizePaymentLinkUrl(PlanService.readEnv(item.paymentLinkUrlEnv)),
      stripePaymentLinkId: PlanService.normalizePaymentLinkId(
        PlanService.readEnv(item.paymentLinkIdEnv)
      ),
      active: true
    };
  }

  static validateUniquePaymentLinkIds(plans) {
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

  static async syncPlansFromEnv() {
    const plans = DEFAULT_PLANS.map((item) => PlanService.buildPlanConfig(item));

    PlanService.validateUniquePaymentLinkIds(plans);

    for (const plan of plans) {
      await Plan.upsert(plan);
    }
  }

  static async findAllActive() {
    return Plan.findAll({
      where: { active: true },
      order: [['sortOrder', 'ASC']]
    });
  }

  static async findByCode(code) {
    return Plan.findOne({ where: { code } });
  }

  static async findByStripePaymentLinkId(stripePaymentLinkId) {
    return Plan.findOne({ where: { stripePaymentLinkId } });
  }
}

module.exports = PlanService;
