const { Router } = require('express');

const planController = require('../controller/plan.controller');

const router = Router();

router.get('/', planController.list);

module.exports = router;
