const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/segment.controller');
router.get('/', protect, ctrl.getAll);
router.post('/', protect, ctrl.create);
router.delete('/:id', protect, ctrl.remove);
module.exports = router;
