/**
 * whatsapp-bot.js — WhatsApp Business API Cloud Function
 * Handles incoming webhook messages, auto-replies, and lead capture.
 */

const axios     = require('axios');
const { Firestore } = require('../firebase-config');

// ─── WhatsApp Business API Config ─────────────────────────────────────────────
const WA_API_VERSION  = process.env.WHATSAPP_API_VERSION || 'v19.0';
const WA_PHONE_ID     = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WA_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WA_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'nexus_ultra_verify_token';
const WA_API_BASE     = `https://graph.facebook.com/${WA_API_VERSION}/${WA_PHONE_ID}`;

// ─── Auto-Reply Commands ──────────────────────────────────────────────────────
const COMMAND_RESPONSES = {
  hello:  greeting => `👋 Hello ${greeting}! Welcome to Nexus Ultra.\n\nI'm your AI assistant. How can I help you today?\n\nReply:\n📋 *TOOLS* — See top AI tools\n💰 *PRICING* — View our plans\n🚀 *DEMO* — Try a free demo\n📞 *SUPPORT* — Get help`,
  hi:     greeting => COMMAND_RESPONSES.hello(greeting),
  tools:  () => `🤖 *Top AI Tools on Nexus Ultra:*\n\n1. ChatGPT — AI writing & coding\n2. Claude — Long-form content\n3. Midjourney — Image generation\n4. ElevenLabs — Voice synthesis\n5. Suno AI — Music creation\n\nExplore all 50+ tools: nexultra.app/tools`,
  pricing: () => `💰 *Nexus Ultra Pricing:*\n\n🌱 *Free* — $0/month\n• 50 AI generations\n• 20 AI tools\n\n⚡ *Pro* — $29/month\n• Unlimited generations\n• All 50+ tools\n• Analytics + API\n\n🏢 *Enterprise* — $99/month\n• Everything in Pro\n• 10 team seats\n• White-label\n\nStart free: nexultra.app`,
  demo:   () => `🚀 *Try Nexus Ultra Free!*\n\nGenerate your first AI content in 30 seconds:\n\n1. Visit: nexultra.app\n2. Click "Get Started Free"\n3. No credit card needed!\n\nOr reply *GENERATE* and tell me what content you need — I'll create a sample for you! ✨`,
  support: () => `📞 *Nexus Ultra Support:*\n\n📧 Email: support@nexultra.app\n💬 Live Chat: nexultra.app/chat\n📚 Docs: nexultra.app/docs\n\nOr describe your issue here and I'll help you! 🤝`,
  generate: () => `✨ *AI Content Demo*\n\nTell me what you'd like to create and I'll generate a sample!\n\nExample:\n"Write a tweet about AI tools for creators"\n\n(Our full platform generates blog posts, emails, YouTube scripts, social media content and more!)`,
};

// ─── Webhook Verification (GET) ───────────────────────────────────────────────
function handleWebhookVerification(req, res) {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WA_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: 'Webhook verification failed' });
}

// ─── Webhook Event Handler (POST) ────────────────────────────────────────────
async function handleWebhookEvent(req, res) {
  try {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
      return res.status(404).json({ error: 'Not a WhatsApp webhook' });
    }

    // Process each entry
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;

        const value    = change.value;
        const messages = value.messages || [];
        const contacts = value.contacts || [];

        for (const message of messages) {
          await processIncomingMessage(message, contacts, value);
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// ─── Process Incoming Message ─────────────────────────────────────────────────
async function processIncomingMessage(message, contacts, value) {
  const from      = message.from;
  const messageId = message.id;
  const contact   = contacts.find(c => c.wa_id === from);
  const name      = contact?.profile?.name || 'there';
  const type      = message.type;

  console.log(`Message from ${from} (${name}): type=${type}`);

  // Mark message as read
  await markMessageRead(messageId).catch(() => {});

  // Save lead to Firestore
  await Firestore.saveLead({
    phone:    from,
    name,
    source:   'whatsapp',
    type:     'inbound_message',
    messageType: type,
  }).catch(() => {});

  if (type === 'text') {
    const text = message.text?.body?.toLowerCase().trim() || '';
    await processTextMessage(from, text, name);
  } else if (type === 'interactive') {
    await processInteractiveMessage(from, message.interactive, name);
  } else {
    await sendTextMessage(from, `Thanks for your message, ${name}! 😊 Reply *HELP* or *TOOLS* to get started with Nexus Ultra.`);
  }
}

// ─── Process Text Message ─────────────────────────────────────────────────────
async function processTextMessage(to, text, name) {
  // Command routing
  for (const [command, handler] of Object.entries(COMMAND_RESPONSES)) {
    if (text.startsWith(command)) {
      return sendTextMessage(to, handler(name));
    }
  }

  // Default: echo with helpful options
  return sendTextMessage(to, `Hi ${name}! 👋 I received your message.\n\nI'm Nexus Ultra's AI assistant. Here's how I can help:\n\n📋 *TOOLS* — Top 50+ AI tools\n💰 *PRICING* — View plans\n🚀 *DEMO* — Free trial\n📞 *SUPPORT* — Get help\n\nOr visit nexultra.app to explore everything! ✨`);
}

// ─── Process Interactive Message ──────────────────────────────────────────────
async function processInteractiveMessage(to, interactive, name) {
  const type    = interactive.type;
  const replyId = type === 'button_reply'
    ? interactive.button_reply?.id
    : interactive.list_reply?.id;

  const responses = {
    explore_tools: () => COMMAND_RESPONSES.tools(),
    view_pricing:  () => COMMAND_RESPONSES.pricing(),
    get_demo:      () => COMMAND_RESPONSES.demo(),
    get_support:   () => COMMAND_RESPONSES.support(),
  };

  const handler = responses[replyId];
  if (handler) {
    return sendTextMessage(to, handler());
  }
  return sendTextMessage(to, `Thanks for your response, ${name}! Reply *HELP* for assistance.`);
}

// ─── Send Text Message ────────────────────────────────────────────────────────
async function sendTextMessage(to, body, preview = false) {
  if (!WA_ACCESS_TOKEN || !WA_PHONE_ID) {
    console.warn('WhatsApp API not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.');
    return;
  }

  return axios.post(`${WA_API_BASE}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type:    'individual',
    to,
    type: 'text',
    text: { body, preview_url: preview },
  }, {
    headers: { Authorization: `Bearer ${WA_ACCESS_TOKEN}` },
  });
}

// ─── Send Template Message ────────────────────────────────────────────────────
async function sendTemplateMessage({ to, templateName, language = 'en', parameters = [] }) {
  if (!WA_ACCESS_TOKEN || !WA_PHONE_ID) {
    console.warn('WhatsApp API not configured.');
    return;
  }

  const components = parameters.length ? [{
    type:       'body',
    parameters: parameters.map(p => ({ type: 'text', text: String(p) })),
  }] : [];

  return axios.post(`${WA_API_BASE}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name:     templateName,
      language: { code: language },
      components,
    },
  }, {
    headers: { Authorization: `Bearer ${WA_ACCESS_TOKEN}` },
  });
}

// ─── Mark Message as Read ─────────────────────────────────────────────────────
async function markMessageRead(messageId) {
  if (!WA_ACCESS_TOKEN || !WA_PHONE_ID) return;
  return axios.post(`${WA_API_BASE}/messages`, {
    messaging_product: 'whatsapp',
    status:     'read',
    message_id: messageId,
  }, {
    headers: { Authorization: `Bearer ${WA_ACCESS_TOKEN}` },
  });
}

// ─── Send Lead Capture Notification ──────────────────────────────────────────
async function handleLeadCapture(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, phone, email, interest, source } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' });

  try {
    const leadId = await Firestore.saveLead({ name, phone, email, interest, source });

    // Send welcome message to the lead's WhatsApp
    await sendTextMessage(phone,
      `Welcome to Nexus Ultra, ${name}! 🎉\n\nThank you for your interest in ${interest || 'our platform'}.\n\nA team member will reach out shortly, or you can get started right now at nexultra.app — it's completely free! 🚀`
    ).catch(() => {});

    return res.json({ success: true, leadId });
  } catch (err) {
    console.error('Lead capture error:', err);
    return res.status(500).json({ error: 'Failed to capture lead' });
  }
}

module.exports = {
  handleWebhookVerification,
  handleWebhookEvent,
  sendTextMessage,
  sendTemplateMessage,
  handleLeadCapture,
};
