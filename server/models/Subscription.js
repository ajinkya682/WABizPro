const mongoose = require('mongoose');
const subscriptionSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  plan: { type: String, enum: ['basic', 'pro', 'premium'], default: 'basic' },
  status: { type: String, enum: ['active', 'cancelled', 'expired', 'trial'], default: 'trial' },
  pricing: { amount: Number, currency: { type: String, default: 'INR' }, interval: String },
  limits: { messagesPerMonth: Number, contacts: Number, campaigns: Number, agents: Number, bots: Number, templates: Number },
  razorpaySubscriptionId: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelledAt: Date,
}, { timestamps: true });
module.exports = mongoose.model('Subscription', subscriptionSchema);
