const mongoose = require('mongoose');
const conversationSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['open', 'assigned', 'resolved', 'bot'], default: 'open' },
  lastMessage: String,
  lastMessageAt: Date,
  unreadCount: { type: Number, default: 0 },
  labels: [String],
  botSessionData: { type: Map, of: String },
  currentBotNodeId: String,
  isBotActive: { type: Boolean, default: true },
  resolvedAt: Date,
}, { timestamps: true });

conversationSchema.index({ businessId: 1, status: 1 });
conversationSchema.index({ businessId: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
