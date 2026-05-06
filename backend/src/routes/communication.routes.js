const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const c = require('../controllers/communication.controller');
r.use(authenticate);
r.post('/email/send', c.sendEmail);
r.post('/whatsapp/send', c.sendWhatsApp);
module.exports = r;
