const { Router } = require('express');

const AuthMiddleware = require('../../../middlewares/auth.middleware');
const UserController = require('../controller/user.controller');

const router = Router();

router.post('/login', UserController.login);
router.get('/me', AuthMiddleware.handle, UserController.me);

module.exports = router;
