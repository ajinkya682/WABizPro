const mongoose = require('mongoose');
const campaignSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['broadcast', 'scheduled', 'triggered', 'drip'], default: 'broadcast' },
  status: { type: String, enum: ['draft', 'scheduled', 'running', 'completed', 'paused', 'failed'], default: 'draft' },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
  targetType: { type: String, enum: ['all', 'segment', 'manual'], default: 'all' },
  segmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Segment' },
  contactIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  scheduledAt: Date,
  timezone: { type: String, default: 'Asia/Kolkata' },
  sendingSpeed: { type: Number, default: 10 },
  stats: {
    total: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    replied: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  startedAt: Date,
  completedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

campaignSchema.index({ businessId: 1, status: 1 });
campaignSchema.index({ businessId: 1, createdAt: -1 });

module.exports = mongoose.model('Campaign', campaignSchema);
