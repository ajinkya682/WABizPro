const mongoose = require('mongoose');
const contactSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  tags: [String],
  attributes: { type: Map, of: String },
  optIn: { type: Boolean, default: true },
  optInDate: Date,
  optInSource: { type: String, default: 'manual' },
  lastContacted: Date,
  lastReplied: Date,
  notes: String,
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isBlocked: { type: Boolean, default: false },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
}, { timestamps: true });

contactSchema.index({ businessId: 1, phone: 1 }, { unique: true });
contactSchema.index({ businessId: 1, createdAt: -1 });
contactSchema.index({ businessId: 1, tags: 1 });

module.exports = mongoose.model('Contact', contactSchema);
