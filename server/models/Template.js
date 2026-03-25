const mongoose = require('mongoose');
const templateSchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'], default: 'MARKETING' },
  localeCode: { type: String, default: 'en_US' },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAUSED'], default: 'PENDING' },
  waTemplateId: String,
  components: [{
    type: { type: String, enum: ['HEADER', 'BODY', 'FOOTER', 'BUTTONS'] },
    format: String,
    text: String,
    mediaUrl: String,
    buttons: [{ type: String, text: String, url: String, phoneNumber: String }]
  }],
  variables: [String],
  rejectionReason: String,
  submittedAt: Date,
  approvedAt: Date,
}, { timestamps: true });

templateSchema.virtual('language')
  .get(function getLanguage() {
    return this.localeCode;
  })
  .set(function setLanguage(value) {
    this.localeCode = value;
  });

templateSchema.set('toJSON', { virtuals: true });
templateSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Template', templateSchema);
