const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const Subscription = require('../models/Subscription');
const Business = require('../models/Business');
const Contact = require('../models/Contact');

const PLAN_MAP = {
  basic: { planId: 'starter', amount: 2900 },
  starter: { planId: 'starter', amount: 2900 },
  pro: { planId: 'pro', amount: 7900 },
  premium: { planId: 'elite', amount: 14900 },
  elite: { planId: 'elite', amount: 14900 },
};

router.get('/subscription', protect, async (req, res) => {
  try {
    const [subscription, business, contactsCount] = await Promise.all([
      Subscription.findOne({ businessId: req.user.businessId }).sort({ createdAt: -1 }),
      Business.findById(req.user.businessId),
      Contact.countDocuments({ businessId: req.user.businessId }),
    ]);

    const currentPlan = PLAN_MAP[subscription?.plan] || PLAN_MAP[business?.plan] || PLAN_MAP.basic;

    res.json({
      subscription: {
        planId: currentPlan.planId,
        status: subscription?.status || 'active',
        currentPeriodStart: subscription?.currentPeriodStart || business?.createdAt || new Date(),
        currentPeriodEnd:
          subscription?.currentPeriodEnd ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        contactsCount,
        messagesSent: business?.messageCount || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to load subscription' });
  }
});

router.post('/create-order', protect, async (req, res) => {
  try {
    const { planId, amount } = req.body;
    if (!planId || !amount) {
      return res.status(400).json({ message: 'Plan and amount are required' });
    }

    res.json({
      id: `demo_order_${Date.now()}`,
      amount,
      currency: 'INR',
      planId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to create order' });
  }
});

router.post('/verify', protect, async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ message: 'Plan is required' });
    }

    const normalizedPlan =
      planId === 'starter' ? 'basic' : planId === 'elite' ? 'premium' : planId;
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await Promise.all([
      Subscription.findOneAndUpdate(
        { businessId: req.user.businessId },
        {
          businessId: req.user.businessId,
          plan: normalizedPlan,
          status: 'active',
          currentPeriodStart,
          currentPeriodEnd,
          pricing: {
            amount: PLAN_MAP[planId]?.amount || 0,
            currency: 'INR',
            interval: 'monthly',
          },
        },
        { upsert: true, new: true }
      ),
      Business.findByIdAndUpdate(req.user.businessId, { plan: normalizedPlan }, { new: true }),
    ]);

    res.json({ message: 'Subscription updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Payment verification failed' });
  }
});

module.exports = router;
