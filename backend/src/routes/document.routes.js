const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const c = require('../controllers/document.controller');
r.use(authenticate);
r.delete('/:id', c.deleteDoc);
module.exports = r;
