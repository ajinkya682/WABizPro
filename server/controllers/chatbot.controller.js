const ChatBot = require('../models/ChatBot');

const serializeBot = (bot) => {
  const plainBot = bot.toObject ? bot.toObject() : bot;
  const firstNode = plainBot.nodes?.[0];

  return {
    ...plainBot,
    triggerKeyword: plainBot.keywords?.[0] || '',
    triggerMatches: plainBot.triggerType === 'any_message' ? 'contains' : 'exact',
    actions:
      plainBot.actions ||
      [
        {
          type: 'send_message',
          content:
            firstNode?.data?.message || plainBot.fallbackMessage || '',
        },
      ],
    replyText: firstNode?.data?.message || plainBot.fallbackMessage || '',
  };
};

const buildBotPayload = (body = {}) => {
  const triggerKeyword = body.triggerKeyword?.trim() || '';
  const replyText =
    body.replyText?.trim() ||
    body.actions?.[0]?.content?.trim() ||
    body.fallbackMessage?.trim() ||
    '';

  return {
    name: body.name?.trim(),
    isActive: body.isActive ?? true,
    triggerType: body.triggerMatches === 'contains' ? 'any_message' : 'keyword',
    keywords: triggerKeyword ? [triggerKeyword] : [],
    nodes: [
      {
        id: 'start-message',
        type: 'message',
        name: 'Auto Reply',
        data: { message: replyText },
        nextNodes: [],
      },
    ],
    startNodeId: 'start-message',
    fallbackMessage: replyText || "Sorry, I didn't understand that. Please try again.",
  };
};

exports.getAll = async (req, res) => {
  try {
    const bots = await ChatBot.find({ businessId: req.user.businessId });
    res.json({ bots: bots.map(serializeBot) });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.create = async (req, res) => {
  try {
    const payload = buildBotPayload(req.body);
    if (!payload.name || payload.keywords.length === 0 || !payload.fallbackMessage) {
      return res.status(400).json({ message: 'Name, keyword, and reply message are required' });
    }

    const bot = await ChatBot.create({ ...payload, businessId: req.user.businessId });
    res.status(201).json({ bot: serializeBot(bot) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const updates =
      Object.keys(req.body).length === 1 && typeof req.body.isActive === 'boolean'
        ? { isActive: req.body.isActive }
        : buildBotPayload(req.body);

    const bot = await ChatBot.findOneAndUpdate(
      { _id: req.params.id, businessId: req.user.businessId },
      updates,
      { new: true }
    );
    res.json({ bot: serializeBot(bot) });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.remove = async (req, res) => {
  try {
    await ChatBot.findOneAndDelete({ _id: req.params.id, businessId: req.user.businessId });
    res.json({ message: 'Bot deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.activate = async (req, res) => {
  try {
    await ChatBot.updateMany({ businessId: req.user.businessId }, { isActive: false });
    const bot = await ChatBot.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    res.json({ bot: serializeBot(bot), message: 'Bot activated' });
  } catch { res.status(500).json({ message: 'Server error' }); }
};
