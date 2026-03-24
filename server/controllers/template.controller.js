const Template = require('../models/Template');

exports.getAll = async (req, res) => {
  try {
    const { category, status } = req.query;
    const query = { businessId: req.user.businessId };
    if (category) query.category = category;
    if (status) query.status = status;
    const templates = await Template.find(query).sort({ createdAt: -1 });
    res.json({ templates });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.create = async (req, res) => {
  try {
    const { name, category, language, components } = req.body;
    if (!name || !components) return res.status(400).json({ message: 'Name and components are required' });
    if (name !== name.toLowerCase()) return res.status(400).json({ message: 'Template name must be lowercase' });
    const template = await Template.create({
      name,
      category,
      language,
      components,
      businessId: req.user.businessId,
      status: 'APPROVED',
      submittedAt: new Date(),
      approvedAt: new Date(),
    });
    res.status(201).json({ template, message: 'Template created and ready to use' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, businessId: req.user.businessId, status: { $in: ['PENDING', 'REJECTED'] } },
      req.body, { new: true }
    );
    if (!template) return res.status(404).json({ message: 'Template not found or cannot be edited' });
    res.json({ template });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.remove = async (req, res) => {
  try {
    await Template.findOneAndDelete({ _id: req.params.id, businessId: req.user.businessId });
    res.json({ message: 'Template deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
};
