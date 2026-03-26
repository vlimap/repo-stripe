require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./database/init-models');
const planService = require('./modules/plano/service/plan.service');

const PORT = Number(process.env.PORT || 3333);

async function bootstrap() {
  await sequelize.authenticate();
  await planService.syncPlansFromEnv();

  app.listen(PORT, () => {
    console.log(`API pronta em http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  if (error?.name === 'SequelizeDatabaseError') {
    console.error('Banco nao preparado. Execute: npm run db:migrate && npm run db:seed');
  }

  console.error('Falha ao iniciar a aplicacao:', error);
  process.exit(1);
});
