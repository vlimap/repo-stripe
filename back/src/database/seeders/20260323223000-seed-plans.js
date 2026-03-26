'use strict';

const { randomUUID } = require('node:crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('planos', [
      {
        id: randomUUID(),
        code: 'BASIC',
        name: 'Basic',
        description: 'Plano de entrada para demonstrar catalogo local e checkout hospedado.',
        access_key: 'basic',
        sort_order: 10,
        payment_link_url: null,
        stripe_payment_link_id: null,
        active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: randomUUID(),
        code: 'PRO',
        name: 'Pro',
        description: 'Plano premium mensal usado para liberar o recurso protegido.',
        access_key: 'premium',
        sort_order: 20,
        payment_link_url: null,
        stripe_payment_link_id: null,
        active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: randomUUID(),
        code: 'PRO_YEARLY',
        name: 'Pro Anual',
        description: 'Plano premium anual para comparar produto, preco e recorrencia.',
        access_key: 'premium',
        sort_order: 30,
        payment_link_url: null,
        stripe_payment_link_id: null,
        active: true,
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('planos', {
      code: {
        [Sequelize.Op.in]: ['BASIC', 'PRO', 'PRO_YEARLY']
      }
    });
  }
};
