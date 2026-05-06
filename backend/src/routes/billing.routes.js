const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const c = require('../controllers/billing.controller');
r.get('/plans', c.getPlans);
r.use(authenticate);
r.get('/current', c.getCurrent);
r.post('/upgrade', c.upgradePlan);
module.exports = r;
