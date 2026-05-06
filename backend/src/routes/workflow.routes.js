const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const c = require('../controllers/workflow.controller');
r.use(authenticate);
r.get('/', c.listWorkflows);
r.post('/', c.createWorkflow);
r.put('/:id', c.updateWorkflow);
r.put('/:id/toggle', c.toggleWorkflow);
module.exports = r;
