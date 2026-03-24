const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');
const Segment = require('../models/Segment');
const Template = require('../models/Template');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Business = require('../models/Business');
const { sendTemplateMessage } = require('../services/whatsapp.service');

const sanitizeCampaignPayload = (payload = {}) => {
  const sanitized = {
    name: payload.name?.trim(),
    description: payload.description?.trim() || '',
    type: payload.type || 'broadcast',
    targetType: payload.targetType || 'all',
    templateId: payload.templateId || undefined,
    timezone: payload.timezone || 'Asia/Kolkata',
  };

  if (payload.segmentId) sanitized.segmentId = payload.segmentId;
  if (Array.isArray(payload.contactIds) && payload.contactIds.length > 0) {
    sanitized.contactIds = payload.contactIds.filter(Boolean);
  }
  if (payload.type === 'scheduled' && payload.scheduledAt) {
    sanitized.scheduledAt = payload.scheduledAt;
    sanitized.status = 'scheduled';
  }

  return sanitized;
};

const buildSegmentFilter = (filters = [], logicOperator = 'AND') => {
  const conditions = filters
    .map((filter) => {
      if (filter.field === 'tags') {
        if (filter.operator === 'not_contains') return { tags: { $ne: filter.value } };
        return { tags: filter.value };
      }

      if (filter.field === 'optIn') {
        return { optIn: filter.value === true || filter.value === 'true' };
      }

      if (filter.field === 'lastContacted' && filter.value) {
        const dateValue = new Date(filter.value);
        if (Number.isNaN(dateValue.getTime())) return null;
        return filter.operator === 'lt'
          ? { lastContacted: { $lte: dateValue } }
          : { lastContacted: { $gte: dateValue } };
      }

      return null;
    })
    .filter(Boolean);

  if (conditions.length === 0) return {};
  return { [logicOperator === 'OR' ? '$or' : '$and']: conditions };
};

const resolveRecipients = async (campaign, businessId) => {
  const baseQuery = { businessId, optIn: true, isBlocked: { $ne: true } };

  if (campaign.targetType === 'segment' && campaign.segmentId) {
    const segment = await Segment.findOne({ _id: campaign.segmentId, businessId }).lean();
    if (!segment) return [];
    return Contact.find({ ...baseQuery, ...buildSegmentFilter(segment.filters, segment.logicOperator) });
  }

  if (campaign.targetType === 'manual' && Array.isArray(campaign.contactIds) && campaign.contactIds.length > 0) {
    return Contact.find({ ...baseQuery, _id: { $in: campaign.contactIds } });
  }

  return Contact.find(baseQuery);
};

exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { businessId: req.user.businessId };
    if (status && status !== 'all') query.status = status;
    const campaigns = await Campaign.find(query).populate('templateId', 'name status').sort({ createdAt: -1 });
    res.json({ campaigns, total: campaigns.length });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.getById = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, businessId: req.user.businessId }).populate('templateId');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ campaign });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.create = async (req, res) => {
  try {
    const payload = sanitizeCampaignPayload(req.body);
    if (!payload.name || !payload.templateId) {
      return res.status(400).json({ message: 'Campaign name and template are required' });
    }
    if (payload.targetType === 'segment' && !payload.segmentId) {
      return res.status(400).json({ message: 'Please select a segment for this audience' });
    }

    const template = await Template.findOne({
      _id: payload.templateId,
      businessId: req.user.businessId,
      status: { $in: ['APPROVED', 'PENDING'] },
    });
    if (!template) return res.status(400).json({ message: 'Selected template is not available' });

    const campaign = await Campaign.create({
      ...payload,
      businessId: req.user.businessId,
      createdBy: req.user._id,
      status: payload.status || 'draft',
    });
    const recipients = await resolveRecipients(campaign, req.user.businessId);
    campaign.stats.total = recipients.length;
    await campaign.save();
    res.status(201).json({ campaign, message: 'Campaign created' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const payload = sanitizeCampaignPayload(req.body);
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, businessId: req.user.businessId, status: { $in: ['draft', 'scheduled'] } },
      payload,
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found or cannot be edited' });
    res.json({ campaign });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.remove = async (req, res) => {
  try {
    await Campaign.findOneAndDelete({ _id: req.params.id, businessId: req.user.businessId });
    res.json({ message: 'Campaign deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.send = async (req, res) => {
  try {
    const business = await Business.findById(req.user.businessId);
    if (!business?.whatsappAccessToken || !business?.whatsappPhoneNumberId) {
      return res.status(400).json({
        message: 'WhatsApp is not configured. Add Access Token and Phone Number ID in Settings.',
      });
    }

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      businessId: req.user.businessId,
    }).populate('templateId');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (!campaign.templateId) return res.status(400).json({ message: 'Campaign template not found' });

    const recipients = await resolveRecipients(campaign, req.user.businessId);

    campaign.status = 'running';
    campaign.startedAt = new Date();
    campaign.stats.total = recipients.length;
    campaign.stats.sent = 0;
    campaign.stats.delivered = 0;
    campaign.stats.read = 0;
    campaign.stats.failed = 0;
    await campaign.save();

    const io = req.app.get('io');
    let sentCount = 0;
    let failedCount = 0;

    for (const contact of recipients) {
      let conversation = await Conversation.findOne({
        businessId: req.user.businessId,
        contactId: contact._id,
      });

      if (!conversation) {
        conversation = await Conversation.create({
          businessId: req.user.businessId,
          contactId: contact._id,
          status: 'open',
          lastMessageAt: new Date(),
        });
      }

      const message = await Message.create({
        businessId: req.user.businessId,
        conversationId: conversation._id,
        contactId: contact._id,
        direction: 'outbound',
        type: 'template',
        content: {
          text:
            campaign.templateId.components?.find((component) => component.type === 'BODY')?.text ||
            campaign.description ||
            campaign.name,
          templateName: campaign.templateId.name,
        },
        status: 'queued',
      });

      try {
        const providerResponse = await sendTemplateMessage({
          business,
          template: campaign.templateId,
          contact,
        });

        const waMessageId = providerResponse.messages?.[0]?.id;
        message.status = 'sent';
        message.sentAt = new Date();
        message.waMessageId = waMessageId;
        await message.save();

        await Promise.all([
          Conversation.findByIdAndUpdate(conversation._id, {
            lastMessage: message.content.text,
            lastMessageAt: message.createdAt,
            status: 'open',
          }),
          Contact.findByIdAndUpdate(contact._id, {
            lastContacted: message.createdAt,
            conversationId: conversation._id,
          }),
        ]);

        if (io) {
          io.to(req.user.businessId.toString()).emit('message_sent', {
            conversationId: conversation._id.toString(),
            message,
          });
        }

        sentCount += 1;
      } catch (err) {
        failedCount += 1;
        message.status = 'failed';
        message.errorMessage =
          err.response?.data?.error?.message || err.message || 'WhatsApp send failed';
        await message.save();
      }
    }

    campaign.status = failedCount > 0 && sentCount === 0 ? 'failed' : 'completed';
    campaign.completedAt = new Date();
    campaign.stats.sent = sentCount;
    campaign.stats.delivered = 0;
    campaign.stats.read = 0;
    campaign.stats.failed = failedCount;
    await campaign.save();

    res.json({
      campaign,
      message:
        failedCount > 0
          ? `Campaign processed: ${sentCount} sent, ${failedCount} failed`
          : 'Campaign launched successfully! 🚀',
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.pause = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate({ _id: req.params.id, businessId: req.user.businessId }, { status: 'paused' }, { new: true });
    res.json({ campaign });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.resume = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndUpdate({ _id: req.params.id, businessId: req.user.businessId }, { status: 'running' }, { new: true });
    res.json({ campaign });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.getStats = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, businessId: req.user.businessId });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ stats: campaign.stats });
  } catch { res.status(500).json({ message: 'Server error' }); }
};
