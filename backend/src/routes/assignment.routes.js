const r = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const c = require('../controllers/assignment.controller');

r.use(authenticate);
r.get('/config', c.getConfig);
r.put('/config', requireRole('ADMIN', 'MANAGER'), c.updateConfig);
r.get('/rules', c.getRules);
r.post('/rules', requireRole('ADMIN', 'MANAGER'), c.addRule);
r.delete('/rules/:id', requireRole('ADMIN', 'MANAGER'), c.deleteRule);

module.exports = r;
