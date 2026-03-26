const { Sequelize } = require('sequelize');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL nao configurada.');
}

const useSsl = process.env.DB_SSL === 'true';

module.exports = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: useSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : undefined
});
