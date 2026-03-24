const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const Business = require('../models/Business');

exports.verify = async (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  try {
    const business = token
      ? await Business.findOne({ 'metaApiConfig.webhookVerifyToken': token }).lean()
      : null;

    if (
      mode === 'subscribe' &&
      (token === process.env.META_WEBHOOK_VERIFY_TOKEN || business)
    ) {
      console.log('✅ WhatsApp webhook verified');
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ message: 'Forbidden' });
  } catch (err) {
    console.error('Webhook verify error:', err);
    return res.status(500).json({ message: 'Webhook verification failed' });
  }
};

exports.receive = async (req, res) => {
  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return res.sendStatus(404);
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const io = req.app.get('io');

    // Incoming message
    if (value?.messages) {
      const msg = value.messages[0];
      const from = msg.from; // Phone number
      const text = msg.text?.body || '';
      const phoneNumberId = value.metadata?.phone_number_id;
      const business = await Business.findOne({ whatsappPhoneNumberId: phoneNumberId });
      if (!business) {
        console.warn('Webhook received for unknown phone number ID:', phoneNumberId);
        return res.sendStatus(200);
      }

      // Find or create contact
      let contact = await Contact.findOne({ phone: `+${from}`, businessId: business._id });
      if (!contact) {
        contact = await Contact.create({
          name: value.contacts?.[0]?.profile?.name || `+${from}`,
          phone: `+${from}`, businessId: business._id,
          optIn: true, optInDate: new Date(), optInSource: 'inbound'
        });
      }

      // Find or create conversation
      let conversation = await Conversation.findOne({ contactId: contact._id, businessId: business._id });
      if (!conversation) {
        conversation = await Conversation.create({ businessId: business._id, contactId: contact._id, status: 'open', lastMessageAt: new Date() });
      }

      // Save message
      const message = await Message.create({
        businessId: business._id, contactId: contact._id,
        conversationId: conversation._id, direction: 'inbound',
        content: { text }, waMessageId: msg.id, status: 'delivered'
      });

      // Update conversation
      await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessage: text, lastMessageAt: new Date(),
        $inc: { unreadCount: 1 }, status: 'open'
      });

      // Emit real-time event
      if (io) {
        io.to(business._id.toString()).emit('new_message', { conversationId: conversation._id.toString(), message, contact });
      }
    }

    // Status updates
    if (value?.statuses) {
      const status = value.statuses[0];
      const statusMap = { sent: 'sent', delivered: 'delivered', read: 'read', failed: 'failed' };
      const updatedMessage = await Message.findOneAndUpdate({ waMessageId: status.id }, {
        status: statusMap[status.status] || status.status,
        ...(status.status === 'delivered' && { deliveredAt: new Date() }),
        ...(status.status === 'read' && { readAt: new Date() }),
      }, { new: true });
      if (io && updatedMessage?.businessId) {
        io.to(updatedMessage.businessId.toString()).emit('message_status_update', {
          waMessageId: status.id,
          status: statusMap[status.status] || status.status,
        });
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(500);
  }
};
