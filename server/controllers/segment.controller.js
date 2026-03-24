const Segment = require('../models/Segment');
const Contact = require('../models/Contact');

const resolveSegmentContacts = async (businessId, filters, logicOperator) => {
  const query = { businessId };
  const conditions = filters.map(f => {
    if (f.field === 'tags') return f.operator === 'contains' ? { tags: f.value } : { tags: { $ne: f.value } };
    if (f.field === 'optIn') return { optIn: f.value === 'true' };
    if (f.field === 'lastContacted') return f.operator === 'gt' ? { lastContacted: { $gte: new Date(f.value) } } : { lastContacted: { $lte: new Date(f.value) } };
    return {};
  }).filter(c => Object.keys(c).length > 0);
  if (conditions.length > 0) query[logicOperator === 'OR' ? '$or' : '$and'] = conditions;
  return Contact.countDocuments(query);
};

exports.getAll = async (req, res) => {
  try {
    const segments = await Segment.find({ businessId: req.user.businessId }).sort({ createdAt: -1 });
    res.json({ segments });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.create = async (req, res) => {
  try {
    const { name, description, filters, logicOperator } = req.body;
    if (!name) return res.status(400).json({ message: 'Segment name is required' });
    const contactCount = await resolveSegmentContacts(req.user.businessId, filters || [], logicOperator || 'AND');
    const segment = await Segment.create({ name, description, filters: filters || [], logicOperator: logicOperator || 'AND', contactCount, businessId: req.user.businessId, lastRefreshed: new Date() });
    res.status(201).json({ segment, message: 'Segment created' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Segment.findOneAndDelete({ _id: req.params.id, businessId: req.user.businessId });
    res.json({ message: 'Segment deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
};
