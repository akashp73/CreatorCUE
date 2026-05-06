const r = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const c = require('../controllers/campaign.controller');
r.use(authenticate);
r.get('/', c.listCampaigns);
r.post('/', c.createCampaign);
r.post('/preview-audience', c.previewAudience);
r.post('/:id/launch', c.launchCampaign);
module.exports = r;
