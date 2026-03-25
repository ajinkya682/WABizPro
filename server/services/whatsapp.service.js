const axios = require('axios');

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v23.0';

const normalizeRecipient = (phone = '') => phone.replace(/\D/g, '');

const isAxiosError = (error) => Boolean(error?.isAxiosError);

const extractWhatsAppErrorMessage = (error, fallbackMessage = 'WhatsApp request failed') => {
  if (!error) return fallbackMessage;

  if (isAxiosError(error)) {
    const providerError = error.response?.data?.error;
    if (providerError) {
      if (providerError.code === 190 && providerError.error_subcode === 463) {
        return 'Your Meta system user access token has expired. Generate a new token in Meta and save it in Settings.';
      }

      if (providerError.code === 190) {
        return 'Your Meta system user access token is invalid. Generate a valid token in Meta and save it in Settings.';
      }

      const parts = [providerError.message];
      if (providerError.error_user_title) parts.push(providerError.error_user_title);
      if (providerError.error_user_msg) parts.push(providerError.error_user_msg);
      if (providerError.code) parts.push(`code ${providerError.code}`);
      if (providerError.error_subcode) parts.push(`subcode ${providerError.error_subcode}`);
      return parts.filter(Boolean).join(' | ');
    }

    if (error.code === 'ECONNABORTED') return 'WhatsApp request timed out';
    if (error.message) return error.message;
  }

  return error.message || fallbackMessage;
};

const ensureMessagingConfig = (business, fields = ['token', 'phoneNumberId']) => {
  const missing = [];

  if (fields.includes('token') && !business?.whatsappAccessToken) missing.push('system user access token');
  if (fields.includes('phoneNumberId') && !business?.whatsappPhoneNumberId) missing.push('phone number ID');
  if (fields.includes('wabaId') && !business?.wabaId) missing.push('WhatsApp Business Account ID');

  if (missing.length > 0) {
    throw new Error(`Missing WhatsApp settings: ${missing.join(', ')}`);
  }
};

const getMapValue = (mapLike, key) => {
  if (!mapLike) return undefined;
  if (typeof mapLike.get === 'function') return mapLike.get(key);
  return mapLike[key];
};

const buildTemplateParameters = (template, contact) => {
  const bodyComponent = template.components?.find((component) => component.type === 'BODY');
  const matches = [...(bodyComponent?.text || '').matchAll(/\{\{(\d+)\}\}/g)];
  if (matches.length === 0) return undefined;

  const params = matches
    .map((match) => Number(match[1]))
    .filter((value, index, array) => Number.isInteger(value) && array.indexOf(value) === index)
    .sort((a, b) => a - b)
    .map((index) => {
      const fallbackValue =
        index === 1 ? contact.name :
        index === 2 ? contact.phone :
        index === 3 ? contact.email :
        undefined;
      const value =
        getMapValue(contact.attributes, String(index)) ||
        getMapValue(contact.attributes, `var${index}`) ||
        fallbackValue;

      if (!value) {
        throw new Error(`Missing template variable {{${index}}} for contact ${contact.phone}`);
      }

      return { type: 'text', text: String(value) };
    });

  return params.length > 0 ? [{ type: 'body', parameters: params }] : undefined;
};

const buildMetaTemplateComponents = (components = []) => (
  components
    .map((component) => {
      if (component.type === 'HEADER') {
        return {
          type: 'HEADER',
          format: component.format || 'TEXT',
          text: component.text,
        };
      }

      if (component.type === 'BODY') {
        return { type: 'BODY', text: component.text };
      }

      if (component.type === 'FOOTER') {
        return { type: 'FOOTER', text: component.text };
      }

      return null;
    })
    .filter(Boolean)
);

const syncTemplateStatuses = async ({ business, templates }) => {
  if (!Array.isArray(templates) || templates.length === 0) return templates;
  ensureMessagingConfig(business, ['token', 'wabaId']);

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${business.wabaId}/message_templates`;
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${business.whatsappAccessToken}`,
    },
    params: {
      fields: 'id,name,status,language,category',
      limit: 250,
    },
    timeout: 30000,
  });

  const templateMap = new Map();
  for (const metaTemplate of response.data?.data || []) {
    const languageKey = String(metaTemplate.language || '').toLowerCase();
    templateMap.set(`${metaTemplate.name}:${languageKey}`, metaTemplate);
    templateMap.set(metaTemplate.name, metaTemplate);
  }

  return templates.map((template) => {
    const metaTemplate =
      (template.waTemplateId && (response.data?.data || []).find((item) => item.id === template.waTemplateId)) ||
      templateMap.get(`${template.name}:${String(template.language || '').toLowerCase()}`) ||
      templateMap.get(template.name);

    if (!metaTemplate) return { ...template, metaStatus: 'MISSING' };

    return {
      ...template,
      waTemplateId: metaTemplate.id || template.waTemplateId,
      status: metaTemplate.status || template.status,
      language: metaTemplate.language || template.language,
      category: metaTemplate.category || template.category,
      metaStatus: metaTemplate.status || template.status,
    };
  });
};

const submitTemplateForApproval = async ({ business, template }) => {
  ensureMessagingConfig(business, ['token', 'wabaId']);

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${business.wabaId}/message_templates`;
  const payload = {
    name: template.name,
    category: template.category,
    language: template.language,
    components: buildMetaTemplateComponents(template.components),
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${business.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    throw new Error(extractWhatsAppErrorMessage(error, 'Failed to submit template to Meta'));
  }
};

const ensureTemplateCanSend = async ({ business, template }) => {
  ensureMessagingConfig(business, ['token', 'wabaId']);

  const [metaTemplate] = await syncTemplateStatuses({ business, templates: [template] });
  if (!metaTemplate || metaTemplate.metaStatus === 'MISSING') {
    throw new Error(
      `Template "${template.name}" was not found in your WhatsApp Business account. Create or sync it in Meta first.`
    );
  }

  if (metaTemplate.status !== 'APPROVED') {
    throw new Error(
      `Template "${template.name}" is ${metaTemplate.status} in Meta. Wait until it is APPROVED before launching this campaign.`
    );
  }

  return metaTemplate;
};

const sendTemplateMessage = async ({ business, template, contact }) => {
  ensureMessagingConfig(business, ['token', 'phoneNumberId']);

  const recipient = normalizeRecipient(contact.phone);
  if (!recipient) {
    throw new Error(`Invalid recipient phone number for contact ${contact._id}`);
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'template',
    template: {
      name: template.name,
      language: { code: template.language || 'en' },
    },
  };

  const components = buildTemplateParameters(template, contact);
  if (components) payload.template.components = components;

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${business.whatsappPhoneNumberId}/messages`;
  let response;
  try {
    response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${business.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  } catch (error) {
    throw new Error(extractWhatsAppErrorMessage(error, 'WhatsApp template send failed'));
  }

  return response.data;
};

const sendTextMessage = async ({ business, contact, text }) => {
  ensureMessagingConfig(business, ['token', 'phoneNumberId']);

  const recipient = normalizeRecipient(contact.phone);
  if (!recipient) {
    throw new Error(`Invalid recipient phone number for contact ${contact._id}`);
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'text',
    text: { body: text, preview_url: false },
  };

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${business.whatsappPhoneNumberId}/messages`;
  let response;
  try {
    response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${business.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  } catch (error) {
    throw new Error(extractWhatsAppErrorMessage(error, 'WhatsApp text send failed'));
  }

  return response.data;
};

module.exports = {
  ensureTemplateCanSend,
  extractWhatsAppErrorMessage,
  sendTemplateMessage,
  sendTextMessage,
  submitTemplateForApproval,
  syncTemplateStatuses,
};
