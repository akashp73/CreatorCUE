const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const c = require('../controllers/template.controller');
r.use(authenticate);
r.get('/', c.getWaTemplates); r.post('/', c.createWaTemplate); r.put('/:id', c.updateWaTemplate);
module.exports = r;
