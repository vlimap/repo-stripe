const jwt = require('jsonwebtoken');

const UserService = require('../service/user.service');
const httpError = require('../../../utils/http-error');

class UserController {
  static sendError(res, error) {
    console.error(error);
    return res.status(error.status || 500).json({
      error: error.message || 'Erro interno do servidor.'
    });
  }

  static async login(req, res) {
    try {
      const email = req.body.email;

      if (!email) {
        throw httpError('Informe um e-mail para continuar.', 400);
      }

      const user = await UserService.findOrCreateByEmail(email);
      const token = jwt.sign({}, process.env.JWT_SECRET, {
        subject: user.id,
        expiresIn: '7d'
      });

      return res.json({
        token,
        user
      });
    } catch (error) {
      return UserController.sendError(res, error);
    }
  }

  static async me(req, res) {
    try {
      return res.json({ user: req.user });
    } catch (error) {
      return UserController.sendError(res, error);
    }
  }
}

module.exports = UserController;
