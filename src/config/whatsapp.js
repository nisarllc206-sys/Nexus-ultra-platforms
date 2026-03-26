/**
 * whatsapp.js — WhatsApp Business API Configuration
 * Centralizes all WhatsApp API settings and message templates.
 * All secrets come from environment variables — never hardcoded.
 */

const WHATSAPP_CONFIG = {
  apiVersion:    process.env.WHATSAPP_API_VERSION      || 'v19.0',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID  || '',
  accessToken:   process.env.WHATSAPP_ACCESS_TOKEN     || '',
  verifyToken:   process.env.WHATSAPP_VERIFY_TOKEN     || 'nexus_ultra_verify_2025',
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',

  // WhatsApp API base URL
  get apiBaseUrl() {
    return `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`;
  },

  // Request headers
  get headers() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type':  'application/json',
    };
  },

  // Business profile info
  business: {
    name:        'Nexus Ultra',
    description: 'AI Creator Platform — 50+ AI tools, content generation, and creator automation.',
    website:     process.env.APP_BASE_URL || 'https://nexultra.app',
    email:       process.env.SUPPORT_EMAIL || 'support@nexultra.app',
  },

  // Approved message templates (must be registered in Meta Business Manager)
  templates: {
    welcome: {
      name:     'welcome_message',
      language: 'en_US',
      category: 'MARKETING',
      components: [
        {
          type: 'HEADER',
          format: 'TEXT',
          text:   'Welcome to Nexus Ultra! 🚀',
        },
        {
          type: 'BODY',
          text: 'Hi {{1}}, welcome to the AI platform built for creators!\n\nYour free account includes:\n✅ 50 AI content generations\n✅ Access to 20 AI tools\n✅ Creator dashboard\n\nVisit {{2}} to get started.',
        },
        {
          type: 'FOOTER',
          text: 'Reply STOP to opt out of marketing messages.',
        },
        {
          type:    'BUTTONS',
          buttons: [
            { type: 'URL',          text: 'Open Dashboard', url: 'https://nexultra.app/dashboard.html' },
            { type: 'QUICK_REPLY',  text: 'Explore Tools' },
          ],
        },
      ],
    },

    upgrade_reminder: {
      name:     'upgrade_reminder',
      language: 'en_US',
      category: 'MARKETING',
      components: [
        {
          type: 'BODY',
          text: 'Hey {{1}}! 👋 You\'ve been creating amazing content on Nexus Ultra.\n\nUpgrade to Pro for unlimited AI generations, all 50+ tools, and advanced analytics.\n\nSpecial offer: Get 20% off annual billing! 🎁',
        },
        {
          type:    'BUTTONS',
          buttons: [
            { type: 'URL', text: 'Upgrade Now', url: 'https://nexultra.app/index.html#pricing' },
          ],
        },
      ],
    },

    payment_confirmation: {
      name:     'payment_confirmation',
      language: 'en_US',
      category: 'UTILITY',
      components: [
        {
          type: 'BODY',
          text: 'Payment Confirmed! ✅\n\nHi {{1}}, your {{2}} subscription is now active.\n\nYou now have access to:\n⚡ Unlimited AI generations\n🤖 All 50+ AI tools\n📊 Advanced analytics\n\nAccess your dashboard: {{3}}',
        },
      ],
    },
  },

  // Auto-reply settings
  autoReply: {
    enabled: true,
    businessHoursOnly: false,
    outOfHoursMessage: 'Thanks for reaching out! Our team is currently offline. We\'ll respond within 24 hours. In the meantime, visit nexultra.app to explore our platform!',
  },
};

// ─── Validation ───────────────────────────────────────────────────────────────
function validateConfig() {
  const required = ['phoneNumberId', 'accessToken'];
  const missing  = required.filter(key => !WHATSAPP_CONFIG[key]);
  if (missing.length) {
    console.warn(`⚠️  WhatsApp config missing: ${missing.join(', ')}. Set environment variables.`);
    return false;
  }
  return true;
}

module.exports = {
  WHATSAPP_CONFIG,
  validateConfig,
};
