const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const c = require('../controllers/device.controller');
r.use(authenticate);
r.post('/register', c.registerDevice);
module.exports = r;
