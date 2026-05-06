const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const c = require('../controllers/payment.controller');
r.use(authenticate);
r.get('/', c.listPayments);
r.post('/', c.createPayment);
r.put('/:id/status', c.updatePaymentStatus);
r.post('/:id/remind', c.remindPayment);
module.exports = r;
