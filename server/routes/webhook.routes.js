const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/webhook.controller');
router.get('/whatsapp', ctrl.verify);
router.post('/whatsapp', express.json(), ctrl.receive);
module.exports = router;
