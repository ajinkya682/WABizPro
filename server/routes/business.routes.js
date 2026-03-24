const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const Business = require('../models/Business');
router.get('/', protect, async (req, res) => {
  try {
    const business = await Business.findById(req.user.businessId);
    res.json({ business });
  } catch { res.status(500).json({ message: 'Server error' }); }
});
router.put('/', protect, async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(req.user.businessId, req.body, { new: true });
    res.json({ business, message: 'Settings saved' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});
router.post('/connect-whatsapp', protect, async (req, res) => {
  try {
    const { accessToken, phoneNumberId, wabaId } = req.body;
    await Business.findByIdAndUpdate(req.user.businessId, { whatsappAccessToken: accessToken, whatsappPhoneNumberId: phoneNumberId, wabaId, apiProvider: 'meta' });
    res.json({ message: 'WhatsApp connected successfully' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});
module.exports = router;
