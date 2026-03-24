const mongoose = require('mongoose');
const chatBotSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  triggerType: { type: String, enum: ['keyword', 'any_message', 'first_message'], default: 'keyword' },
  keywords: [String],
  nodes: [{
    id: String,
    type: { type: String, enum: ['message', 'condition', 'input', 'action', 'delay', 'end'] },
    name: String,
    data: {
      message: String,
      buttons: [{ id: String, text: String }],
      inputVariable: String,
      conditionField: String,
      conditionOperator: String,
      conditionValue: String,
      actionType: String,
      actionValue: String,
      delaySeconds: Number,
      webhookUrl: String
    },
    nextNodes: [{ condition: String, nodeId: String }]
  }],
  startNodeId: String,
  fallbackMessage: { type: String, default: "Sorry, I didn't understand that. Please try again." },
}, { timestamps: true });
module.exports = mongoose.model('ChatBot', chatBotSchema);
