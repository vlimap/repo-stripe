const jwt = require('jsonwebtoken');

const { User } = require('../database/init-models');

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token nao informado.' });
    }

    const token = authorization.replace('Bearer ', '').trim();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.sub);

    if (!user) {
      return res.status(401).json({ error: 'Usuario nao encontrado.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalido.' });
  }
};
