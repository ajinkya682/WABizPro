const Contact = require('../models/Contact');
const Campaign = require('../models/Campaign');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

exports.getOverview = async (req, res) => {
  try {
    const bId = req.user.businessId;
    const [contacts, campaigns, messagesSent, conversations] = await Promise.all([
      Contact.countDocuments({ businessId: bId }),
      Campaign.countDocuments({ businessId: bId }),
      Message.countDocuments({ businessId: bId, direction: 'outbound' }),
      Conversation.countDocuments({ businessId: bId, status: { $in: ['open', 'assigned'] } }),
    ]);
    const thisMonthStart = new Date(); thisMonthStart.setDate(1); thisMonthStart.setHours(0,0,0,0);
    const newContactsThisMonth = await Contact.countDocuments({ businessId: bId, createdAt: { $gte: thisMonthStart } });
    const completedCampaigns = await Campaign.countDocuments({ businessId: bId, status: 'completed' });

    const total = await Message.countDocuments({ businessId: bId, direction: 'outbound' });
    const delivered = await Message.countDocuments({ businessId: bId, status: { $in: ['delivered', 'read'] } });
    const read = await Message.countDocuments({ businessId: bId, status: 'read' });
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    const readRate = total > 0 ? Math.round((read / total) * 100) : 0;

    res.json({ contacts, campaigns, messagesSent, conversations, newContactsThisMonth, completedCampaigns, deliveryRate, readRate });
  } catch (err) {
    console.error('Overview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDeliveryRates = async (req, res) => {
  try {
    const bId = req.user.businessId;
    const result = await Message.aggregate([
      { $match: { businessId: bId, direction: 'outbound' } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          queued: { $sum: { $cond: [{ $eq: ['$status', 'queued'] }, 1, 0] } },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          delivered: { $sum: { $cond: [{ $in: ['$status', ['delivered', 'read']] }, 1, 0] } },
          read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        }
      }
    ]);
    const d = result[0] || { total: 0, queued: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
    res.json([
      { name: 'Queued', value: d.queued },
      { name: 'Sent', value: d.sent },
      { name: 'Delivered', value: d.delivered },
      { name: 'Read', value: d.read },
      { name: 'Failed', value: d.failed },
    ]);
  } catch (err) {
    console.error('Delivery rates error:', err);
    res.json([]);
  }
};

// FIX: Use single aggregation instead of 30 separate queries
exports.getMessageVolume = async (req, res) => {
  try {
    const bId = req.user.businessId;
    const { days = 7 } = req.query;
    const daysNum = Math.min(parseInt(days) || 7, 30);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    startDate.setHours(0, 0, 0, 0);

    const data = await Message.aggregate([
      {
        $match: {
          businessId: bId,
          createdAt: { $gte: startDate },
          direction: 'outbound',
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sent: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $in: ['$status', ['delivered', 'read']] }, 1, 0] } },
          read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
        }
      },
      { $sort: { '_id': 1 } },
      { $limit: 30 },
    ]);

    res.json(data.map(d => ({
      date: new Date(d._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      sent: d.sent,
      delivered: d.delivered,
      read: d.read,
    })));
  } catch (err) {
    console.error('Message volume error:', err);
    res.json([]);
  }
};

exports.getCampaignPerformance = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ businessId: req.user.businessId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json(campaigns.map(c => ({
      name: (c.name || '').substring(0, 15),
      sent: c.stats?.sent || 0,
      delivered: c.stats?.delivered || 0,
      read: c.stats?.read || 0,
    })));
  } catch (err) {
    console.error('Campaign performance error:', err);
    res.json([]);
  }
};

// NEW: Contact growth over last 30 days
exports.getContactsGrowth = async (req, res) => {
  try {
    const bId = req.user.businessId;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    const data = await Contact.aggregate([
      { $match: { businessId: bId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          contacts: { $sum: 1 },
        }
      },
      { $sort: { '_id': 1 } },
    ]);

    res.json(data.map(d => ({
      date: new Date(d._id).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      contacts: d.contacts,
    })));
  } catch (err) {
    console.error('Contacts growth error:', err);
    res.json([]);
  }
};
