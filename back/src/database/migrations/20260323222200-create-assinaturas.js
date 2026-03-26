'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('assinaturas', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      plan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'planos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'incomplete'
      },
      stripe_subscription_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      stripe_customer_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      stripe_checkout_session_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      current_period_end: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancel_at_period_end: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('assinaturas', ['user_id']);
    await queryInterface.addIndex('assinaturas', ['stripe_customer_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('assinaturas');
  }
};
