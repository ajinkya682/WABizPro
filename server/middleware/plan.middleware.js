const Business = require('../models/Business');
const PLAN_LIMITS = {
  basic:   { messagesPerMonth: 1000,  contacts: 500,   campaigns: 5,  bots: 1, templates: 5  },
  pro:     { messagesPerMonth: 10000, contacts: 5000,  campaigns: 50, bots: 5, templates: 25 },
  premium: { messagesPerMonth: -1,    contacts: -1,    campaigns: -1, bots: -1, templates: -1 },
};

exports.checkLimit = (resource) => async (req, res, next) => {
  try {
    const business = await Business.findById(req.user.businessId);
    const limits = PLAN_LIMITS[business.plan] || PLAN_LIMITS.basic;
    const limit = limits[resource];
    if (limit === -1) return next();
    const Model = require(`../models/${resource.charAt(0).toUpperCase() + resource.slice(1, -1)}`);
    const count = await Model.countDocuments({ businessId: req.user.businessId });
    if (count >= limit) return res.status(403).json({ message: `${resource} limit reached for your plan. Please upgrade.` });
    next();
  } catch { next(); }
};
