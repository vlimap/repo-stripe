require('dotenv').config();

const useSsl = process.env.DB_SSL === 'true';

const common = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  logging: false,
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_data',
  dialectOptions: useSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : undefined
};

module.exports = {
  development: { ...common },
  test: { ...common },
  production: { ...common }
};
