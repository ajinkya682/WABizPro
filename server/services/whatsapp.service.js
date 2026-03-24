const axios = require('axios');

const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION || 'v23.0';

const normalizeRecipient = (phone = '') => phone.replace(/\D/g, '');

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

const sendTemplateMessage = async ({ business, template, contact }) => {
  if (!business?.whatsappAccessToken || !business?.whatsappPhoneNumberId) {
    throw new Error('WhatsApp access token or phone number ID is missing in Settings');
  }

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
  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${business.whatsappAccessToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  return response.data;
};

const sendTextMessage = async ({ business, contact, text }) => {
  if (!business?.whatsappAccessToken || !business?.whatsappPhoneNumberId) {
    throw new Error('WhatsApp access token or phone number ID is missing in Settings');
  }

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
  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${business.whatsappAccessToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  return response.data;
};

module.exports = {
  sendTemplateMessage,
  sendTextMessage,
};
