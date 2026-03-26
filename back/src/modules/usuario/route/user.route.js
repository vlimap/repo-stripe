const { Router } = require('express');

const authMiddleware = require('../../../middlewares/auth.middleware');
const userController = require('../controller/user.controller');

const router = Router();

router.post('/login', userController.login);
router.get('/me', authMiddleware, userController.me);

module.exports = router;
