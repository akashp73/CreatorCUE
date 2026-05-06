const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const c = require('../controllers/note.controller');
r.use(authenticate);
r.post('/', c.createNote);
module.exports = r;
