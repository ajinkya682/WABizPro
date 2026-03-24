const mongoose = require('mongoose');
const segmentSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  description: String,
  filters: [{ field: String, operator: String, value: mongoose.Schema.Types.Mixed }],
  logicOperator: { type: String, enum: ['AND', 'OR'], default: 'AND' },
  contactCount: { type: Number, default: 0 },
  isDynamic: { type: Boolean, default: true },
  lastRefreshed: Date,
}, { timestamps: true });
module.exports = mongoose.model('Segment', segmentSchema);
