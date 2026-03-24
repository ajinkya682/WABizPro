const mongoose = require('mongoose');
const businessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  address: String,
  about: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  whatsappPhoneNumberId: String,
  whatsappAccessToken: String,
  wabaId: String,
  apiProvider: { type: String, enum: ['meta', 'twilio', '360dialog'], default: 'meta' },
  apiCredentials: {
    accountSid: String,
    authToken: String,
    apiKey: String,
    webhookSecret: String
  },
  metaApiConfig: {
    appId: String,
    businessAccountId: String,
    systemUserToken: String,
    webhookVerifyToken: String,
  },
  timezone: { type: String, default: 'Asia/Kolkata' },
  plan: { type: String, enum: ['basic', 'pro', 'premium'], default: 'basic' },
  messageCount: { type: Number, default: 0 },
  monthlyLimit: { type: Number, default: 1000 },
  isActive: { type: Boolean, default: true },
  logo: String,
  website: String,
  industry: String,
}, { timestamps: true });
module.exports = mongoose.model('Business', businessSchema);
