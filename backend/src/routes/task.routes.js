const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const c = require('../controllers/task.controller');
r.use(authenticate);
r.get('/my-tasks', c.getMyTasks);
r.post('/', c.createTask);
r.put('/:id/complete', c.completeTask);
module.exports = r;
