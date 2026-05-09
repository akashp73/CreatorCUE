const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const c = require('../controllers/call.controller');

r.use(authenticate);
r.post('/log', c.logCall);
r.post('/sync', c.syncCalls);
r.get('/today', c.getTodayStats);
r.get('/lead/:id', c.getLeadCalls);

module.exports = r;
