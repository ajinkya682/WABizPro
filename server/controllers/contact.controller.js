const Contact = require('../models/Contact');

exports.getAll = async (req, res) => {
  try {
    const { search, tags, optIn, page = 1, limit = 50 } = req.query;
    const query = { businessId: req.user.businessId };
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
    if (tags) query.tags = { $in: tags.split(',') };
    if (optIn !== undefined) query.optIn = optIn === 'true';
    const contacts = await Contact.find(query).sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const total = await Contact.countDocuments(query);
    res.json({ contacts, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.getById = async (req, res) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, businessId: req.user.businessId });
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json({ contact });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.create = async (req, res) => {
  try {
    const { name, phone, email, tags, optIn, notes } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required' });
    const existing = await Contact.findOne({ phone, businessId: req.user.businessId });
    if (existing) return res.status(400).json({ message: 'Contact with this phone already exists' });
    const contact = await Contact.create({ name, phone, email, tags: tags || [], optIn: optIn !== false, notes, businessId: req.user.businessId, optInDate: new Date(), optInSource: 'manual' });
    res.status(201).json({ contact, message: 'Contact created successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate({ _id: req.params.id, businessId: req.user.businessId }, req.body, { new: true });
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json({ contact });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.remove = async (req, res) => {
  try {
    await Contact.findOneAndDelete({ _id: req.params.id, businessId: req.user.businessId });
    res.json({ message: 'Contact deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.addTag = async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate({ _id: req.params.id, businessId: req.user.businessId }, { $addToSet: { tags: req.body.tag } }, { new: true });
    res.json({ contact });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.removeTag = async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate({ _id: req.params.id, businessId: req.user.businessId }, { $pull: { tags: req.params.tag } }, { new: true });
    res.json({ contact });
  } catch { res.status(500).json({ message: 'Server error' }); }
};
