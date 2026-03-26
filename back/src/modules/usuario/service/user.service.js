const { User } = require('../../../database/init-models');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function findOrCreateByEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  const [user] = await User.findOrCreate({
    where: { email: normalizedEmail },
    defaults: { email: normalizedEmail }
  });

  return user;
}

async function findById(id) {
  return User.findByPk(id);
}

async function updateStripeCustomerId(userId, stripeCustomerId) {
  if (!stripeCustomerId) {
    return null;
  }

  const user = await User.findByPk(userId);

  if (!user) {
    return null;
  }

  await user.update({ stripeCustomerId });
  return user;
}

module.exports = {
  findOrCreateByEmail,
  findById,
  updateStripeCustomerId
};
