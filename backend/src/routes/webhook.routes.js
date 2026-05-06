const r = require('express').Router();
const { apiKeyMiddleware } = require('../middleware/auth.middleware');
const c = require('../controllers/webhook.controller');
r.post('/activity', apiKeyMiddleware, c.handleActivity);
r.post('/lead', apiKeyMiddleware, c.handleLeadCapture);
r.get('/facebook', c.handleFacebook);
r.post('/facebook', apiKeyMiddleware, c.handleFacebook);
r.post('/razorpay', c.handleRazorpay);
module.exports = r;
