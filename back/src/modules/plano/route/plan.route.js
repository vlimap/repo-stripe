const { Router } = require('express');

const PlanController = require('../controller/plan.controller');

const router = Router();

router.get('/', PlanController.list);

module.exports = router;
