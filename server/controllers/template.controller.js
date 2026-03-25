const Template = require('../models/Template');
const Business = require('../models/Business');
const {
  findMetaTemplateByNameAndLanguage,
  submitTemplateForApproval,
  syncTemplateStatuses,
} = require('../services/whatsapp.service');

const getStoredLanguage = (template = {}) => template.language || template.localeCode || 'en_US';

const upsertTemplateFromMeta = async ({ businessId, draft, metaTemplate }) => {
  const resolvedLanguage = metaTemplate.language || draft.language;
  const resolvedStatus = metaTemplate.status || 'PENDING';

  return Template.findOneAndUpdate(
    {
      businessId,
      name: metaTemplate.name || draft.name,
      $or: [
        { localeCode: resolvedLanguage },
        { language: resolvedLanguage },
      ],
    },
    {
      $set: {
        category: metaTemplate.category || draft.category,
        localeCode: resolvedLanguage,
        components:
          Array.isArray(metaTemplate.components) && metaTemplate.components.length > 0
            ? metaTemplate.components
            : draft.components,
        status: resolvedStatus,
        waTemplateId: metaTemplate.id,
        approvedAt: resolvedStatus === 'APPROVED' ? new Date() : null,
      },
      $unset: {
        language: '',
      },
      $setOnInsert: {
        businessId,
        name: metaTemplate.name || draft.name,
        submittedAt: new Date(),
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};

const getExistingTemplateMessage = (template) => (
  `Template "${template.name}" already exists for ${getStoredLanguage(template)} and is ${template.status}.`
);

const getSyncedTemplateMessage = (template) => (
  `Template "${template.name}" already exists in Meta for ${getStoredLanguage(template)}. It has been synced into WABiz instead of creating a duplicate.`
);

exports.getAll = async (req, res) => {
  try {
    const { category, status } = req.query;
    const query = { businessId: req.user.businessId };
    if (category) query.category = category;
    if (status) query.status = status;
    let templates = await Template.find(query).sort({ createdAt: -1 });

    const business = await Business.findById(req.user.businessId).lean();
    if (business?.whatsappAccessToken && business?.wabaId && templates.length > 0) {
      try {
        const currentTemplates = new Map(
          templates.map((template) => [template._id.toString(), template.toObject()])
        );
        const syncedTemplates = await syncTemplateStatuses({
          business,
          templates: [...currentTemplates.values()],
        });

        const updates = syncedTemplates
          .filter((template) => (
            template.metaStatus &&
            template.metaStatus !== 'MISSING' &&
            (
              template.status !== currentTemplates.get(template._id.toString())?.status ||
              template.waTemplateId !== currentTemplates.get(template._id.toString())?.waTemplateId ||
              getStoredLanguage(template) !== getStoredLanguage(currentTemplates.get(template._id.toString()))
            )
          ))
          .map((template) => ({
            updateOne: {
              filter: { _id: template._id, businessId: req.user.businessId },
              update: {
                $set: {
                  status: template.status,
                  waTemplateId: template.waTemplateId,
                  localeCode: getStoredLanguage(template),
                  approvedAt: template.status === 'APPROVED' ? new Date() : null,
                },
                $unset: {
                  language: '',
                },
              },
            },
          }));

        if (updates.length > 0) {
          await Template.bulkWrite(updates);
        }

        templates = syncedTemplates;
      } catch (error) {
        console.error('Template status sync error:', error.message);
      }
    }

    res.json({ templates });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.create = async (req, res) => {
  try {
    const { name, category, language, components } = req.body;
    if (!name || !components) return res.status(400).json({ message: 'Name and components are required' });
    if (name !== name.toLowerCase()) return res.status(400).json({ message: 'Template name must be lowercase' });

    const draft = {
      name,
      category,
      language,
      components,
    };

    const existingTemplate = await Template.findOne({
      businessId: req.user.businessId,
      name: draft.name,
      $or: [
        { localeCode: draft.language },
        { language: draft.language },
      ],
    });
    if (existingTemplate) {
      return res.status(200).json({
        template: existingTemplate,
        message: getExistingTemplateMessage(existingTemplate),
      });
    }

    const business = await Business.findById(req.user.businessId);
    if (!business) return res.status(404).json({ message: 'Business not found' });

    const existingMetaTemplate = await findMetaTemplateByNameAndLanguage({
      business,
      name: draft.name,
      language: draft.language,
    });
    if (existingMetaTemplate) {
      const template = await upsertTemplateFromMeta({
        businessId: req.user.businessId,
        draft,
        metaTemplate: existingMetaTemplate,
      });

      return res.status(200).json({
        template,
        message: getSyncedTemplateMessage(template),
      });
    }

    let metaTemplate;
    try {
      metaTemplate = await submitTemplateForApproval({
        business,
        template: draft,
      });
    } catch (err) {
      if (err.code === 100 && err.subcode === 2388024) {
        const duplicateMetaTemplate = await findMetaTemplateByNameAndLanguage({
          business,
          name: draft.name,
          language: draft.language,
        });

        if (duplicateMetaTemplate) {
          const template = await upsertTemplateFromMeta({
            businessId: req.user.businessId,
            draft,
            metaTemplate: duplicateMetaTemplate,
          });

          return res.status(200).json({
            template,
            message: getSyncedTemplateMessage(template),
          });
        }
      }

      throw err;
    }

    const template = await Template.create({
      businessId: req.user.businessId,
      name: draft.name,
      category: draft.category,
      localeCode: draft.language,
      components: draft.components,
      status: metaTemplate.status || 'PENDING',
      waTemplateId: metaTemplate.id,
      submittedAt: new Date(),
      approvedAt: metaTemplate.status === 'APPROVED' ? new Date() : undefined,
    });

    res.status(201).json({
      template,
      message:
        template.status === 'APPROVED'
          ? 'Template approved and ready to use'
          : `Template submitted to Meta with status ${template.status}`,
    });
  } catch (err) {
    const statusCode = /missing|token|whatsapp|meta|template/i.test(err.message || '') ? 400 : 500;
    res.status(statusCode).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updatePayload = { ...req.body };
    if (updatePayload.language) {
      updatePayload.localeCode = updatePayload.language;
      delete updatePayload.language;
    }

    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, businessId: req.user.businessId, status: { $in: ['PENDING', 'REJECTED'] } },
      {
        $set: updatePayload,
        $unset: { language: '' },
      },
      { new: true }
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
