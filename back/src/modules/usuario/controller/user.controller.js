const jwt = require('jsonwebtoken');

const userService = require('../service/user.service');
const httpError = require('../../../utils/http-error');

async function login(req, res, next) {
  try {
    const email = req.body.email;

    if (!email) {
      throw httpError('Informe um e-mail para continuar.', 400);
    }

    const user = await userService.findOrCreateByEmail(email);
    const token = jwt.sign({}, process.env.JWT_SECRET, {
      subject: user.id,
      expiresIn: '7d'
    });

    return res.json({
      token,
      user
    });
  } catch (error) {
    return next(error);
  }
}

function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = {
  login,
  me
};
