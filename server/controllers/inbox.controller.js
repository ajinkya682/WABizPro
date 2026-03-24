const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const Business = require('../models/Business');
const { sendTextMessage } = require('../services/whatsapp.service');

exports.getConversations = async (req, res) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const query = { businessId: req.user.businessId };
    if (status && status !== 'all') query.status = status;
    const conversations = await Conversation.find(query)
      .populate('contactId', 'name phone tags')
      .populate('assignedAgent', 'name email')
      .sort({ lastMessageAt: -1 })
      .limit(limit).skip((page - 1) * limit);
    res.json({ conversations });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.id }).sort({ createdAt: 1 }).limit(100);
    await Conversation.findByIdAndUpdate(req.params.id, { unreadCount: 0 });
    res.json({ messages });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.reply = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message text is required' });
    const conversation = await Conversation.findOne({ _id: req.params.id, businessId: req.user.businessId }).populate('contactId');
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    const business = await Business.findById(req.user.businessId);
    if (!business?.whatsappAccessToken || !business?.whatsappPhoneNumberId) {
      return res.status(400).json({ message: 'WhatsApp is not configured in Settings' });
    }

    const message = await Message.create({
      businessId: req.user.businessId, conversationId: req.params.id,
      contactId: conversation.contactId._id, direction: 'outbound',
      content: { text }, status: 'queued'
    });

    try {
      const providerResponse = await sendTextMessage({
        business,
        contact: conversation.contactId,
        text,
      });
      message.status = 'sent';
      message.sentAt = new Date();
      message.waMessageId = providerResponse.messages?.[0]?.id;
      await message.save();
    } catch (err) {
      message.status = 'failed';
      message.errorMessage =
        err.response?.data?.error?.message || err.message || 'WhatsApp send failed';
      await message.save();
      return res.status(400).json({ message: message.errorMessage });
    }

    await Conversation.findByIdAndUpdate(req.params.id, { lastMessage: text, lastMessageAt: new Date() });
    // Emit via socket
    const io = req.app.get('io');
    if (io) io.to(req.user.businessId.toString()).emit('message_sent', { conversationId: req.params.id, message });
    res.json({ message });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.resolve = async (req, res) => {
  try {
    const conv = await Conversation.findOneAndUpdate(
      { _id: req.params.id, businessId: req.user.businessId },
      { status: 'resolved', resolvedAt: new Date() }, { new: true }
    );
    res.json({ conversation: conv });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.reopen = async (req, res) => {
  try {
    const conv = await Conversation.findOneAndUpdate({ _id: req.params.id, businessId: req.user.businessId }, { status: 'open', resolvedAt: null }, { new: true });
    res.json({ conversation: conv });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.assign = async (req, res) => {
  try {
    const conv = await Conversation.findOneAndUpdate({ _id: req.params.id, businessId: req.user.businessId }, { assignedAgent: req.body.agentId, status: 'assigned' }, { new: true }).populate('assignedAgent', 'name email');
    res.json({ conversation: conv });
  } catch { res.status(500).json({ message: 'Server error' }); }
};
