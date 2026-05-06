const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const c = require('../controllers/auth.controller');
r.post('/login', c.login);
r.post('/refresh', c.refreshToken);
r.post('/logout', c.logout);
r.get('/me', authenticate, c.getMe);
module.exports = r;
