const User = require('../models/User');
const Business = require('../models/Business');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
const generateRefreshToken = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, businessName } = req.body;
    if (!name || !email || !password || !businessName)
      return res.status(400).json({ message: 'All fields are required' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 12);
    const business = await Business.create({ name: businessName, plan: 'basic', isActive: true });
    const user = await User.create({ name, email: email.toLowerCase(), password: hashedPassword, businessId: business._id, role: 'owner' });
    business.ownerId = user._id;
    await business.save();
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    res.status(201).json({
      message: 'Account created successfully', token, refreshToken,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, businessId: business._id, businessName: business.name }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
    user.lastLogin = new Date();
    await user.save();
    const business = await Business.findById(user.businessId);
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    res.json({
      message: 'Login successful', token, refreshToken,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, businessId: user.businessId, businessName: business?.name }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.logout = (req, res) => res.json({ message: 'Logged out successfully' });

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const business = await Business.findById(user.businessId);
    res.json({ user: { ...user.toObject(), businessName: business?.name } });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.updateMe = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, email }, { new: true });
    res.json({ user });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'No account found with that email' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    console.log(`🔑 Reset token for ${email}: ${resetToken}`);
    res.json({ message: 'Password reset link sent to your email' });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });
    user.password = await bcrypt.hash(req.body.password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.verifyEmail = async (req, res) => {
  try {
    const user = await User.findOne({ verifyToken: req.params.token });
    if (!user) return res.status(400).json({ message: 'Invalid token' });
    user.isVerified = true;
    user.verifyToken = undefined;
    await user.save();
    res.json({ message: 'Email verified' });
  } catch { res.status(500).json({ message: 'Server error' }); }
};
