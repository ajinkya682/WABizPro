const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['owner', 'admin', 'agent'], default: 'owner' },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  avatar: String,
  isVerified: { type: Boolean, default: false },
  verifyToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema);
