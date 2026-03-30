const { User } = require('../../../database/init-models');

class UserService {
  static normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  static async findOrCreateByEmail(email) {
    const normalizedEmail = UserService.normalizeEmail(email);

    const [user] = await User.findOrCreate({
      where: { email: normalizedEmail },
      defaults: { email: normalizedEmail }
    });

    return user;
  }

  static async findById(id) {
    return User.findByPk(id);
  }

  static async updateStripeCustomerId(userId, stripeCustomerId) {
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
}

module.exports = UserService;
