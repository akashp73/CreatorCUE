const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const c = require('../controllers/scoreRule.controller');
r.use(authenticate);
r.get('/', c.list); r.post('/', c.create); r.put('/:id', c.update);
module.exports = r;
