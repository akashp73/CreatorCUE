const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const c = require('../controllers/dashboard.controller');
r.use(authenticate);
r.get('/stats', c.getStats);
r.get('/hot-leads', c.getHotLeads);
module.exports = r;
