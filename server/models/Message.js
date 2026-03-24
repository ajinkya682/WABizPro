const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    type: { type: String, enum: ['text', 'template', 'image', 'document'], default: 'text' },
    content: {
      text: String,
      mediaUrl: String,
      caption: String,
      templateName: String,
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'read', 'failed'],
      default: 'queued',
    },
    waMessageId: String,
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    errorMessage: String,
    metadata: { type: Map, of: String },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ businessId: 1, contactId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
