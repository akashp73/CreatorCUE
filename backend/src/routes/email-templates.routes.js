const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const c = require('../controllers/template.controller');
r.use(authenticate);
r.get('/', c.getEmailTemplates); r.post('/', c.createEmailTemplate); r.put('/:id', c.updateEmailTemplate); r.delete('/:id', c.deleteEmailTemplate);
module.exports = r;
