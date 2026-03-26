/**
 * whatsapp.js — WhatsApp Business API Integration Module
 * Handles lead capture, template message sending, and notification preferences.
 */

const WHATSAPP_API_BASE = '/api/whatsapp';

// ─── WhatsApp Deep Link ───────────────────────────────────────────────────────
export function openWhatsAppChat(phoneNumber, message = '') {
  const encoded = encodeURIComponent(message);
  const url     = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encoded}`;
  window.open(url, '_blank', 'noopener');
}

// ─── Send Template Message (via backend) ─────────────────────────────────────
export async function sendTemplateMessage({ to, templateName, language = 'en', parameters = [] }) {
  if (!to || !templateName) throw new Error('Missing required parameters: to, templateName');

  const resp = await fetch(`${WHATSAPP_API_BASE}/send-template`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, templateName, language, parameters }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Failed to send message' }));
    throw new Error(err.error);
  }

  return resp.json();
}

// ─── Lead Capture Form ────────────────────────────────────────────────────────
export async function submitLeadForm(formData) {
  const { name, phone, email, interest } = formData;
  if (!name || !phone) throw new Error('Name and phone number are required');

  const resp = await fetch(`${WHATSAPP_API_BASE}/leads`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, email, interest, source: window.location.href }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Failed to capture lead' }));
    throw new Error(err.error);
  }

  return resp.json();
}

// ─── Notification Preferences ─────────────────────────────────────────────────
export const NotificationPrefs = {
  KEY: 'nexus_whatsapp_prefs',

  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '{}'); }
    catch { return {}; }
  },

  set(prefs) {
    localStorage.setItem(this.KEY, JSON.stringify({ ...this.get(), ...prefs }));
  },

  isEnabled(type) {
    return this.get()[type] !== false; // default: enabled
  },
};

// ─── WhatsApp Lead Capture Widget ─────────────────────────────────────────────
export function initLeadCaptureWidget(options = {}) {
  const {
    containerId = 'whatsappLeadWidget',
    phoneNumber = '',
    welcomeMessage = 'Hi! I found your AI platform and I\'m interested in learning more.',
  } = options;

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="whatsapp-widget">
      <div class="whatsapp-widget__header">
        <div class="whatsapp-widget__icon">
          <i class="fa-brands fa-whatsapp"></i>
        </div>
        <div>
          <strong>Chat on WhatsApp</strong>
          <p>Typically replies within minutes</p>
        </div>
      </div>
      <form class="whatsapp-widget__form" id="whatsappLeadForm">
        <div class="form-group">
          <label class="form-label">Your Name</label>
          <input type="text" class="form-input" id="whaName" placeholder="Full Name" required />
        </div>
        <div class="form-group">
          <label class="form-label">WhatsApp Number</label>
          <input type="tel" class="form-input" id="whaPhone" placeholder="+1 234 567 8900" required />
        </div>
        <div class="form-group">
          <label class="form-label">Email (optional)</label>
          <input type="email" class="form-input" id="whaEmail" placeholder="you@example.com" />
        </div>
        <div class="form-group">
          <label class="form-label">I'm interested in</label>
          <select class="form-select" id="whaInterest">
            <option value="content-generation">AI Content Generation</option>
            <option value="pro-plan">Pro Plan</option>
            <option value="enterprise">Enterprise Plan</option>
            <option value="api-access">API Access</option>
            <option value="general">General Information</option>
          </select>
        </div>
        <button type="submit" class="btn btn-whatsapp btn-block">
          <i class="fa-brands fa-whatsapp"></i> Start WhatsApp Chat
        </button>
      </form>
      <p class="whatsapp-widget__disclaimer">
        By clicking, you agree to be contacted via WhatsApp.
      </p>
    </div>
  `;

  // Add WhatsApp button styles if not present
  if (!document.getElementById('whatsapp-styles')) {
    const style = document.createElement('style');
    style.id    = 'whatsapp-styles';
    style.textContent = `
      .whatsapp-widget { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; }
      .whatsapp-widget__header { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; }
      .whatsapp-widget__icon { width: 48px; height: 48px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #fff; flex-shrink: 0; }
      .whatsapp-widget__header strong { display: block; margin-bottom: 2px; }
      .whatsapp-widget__header p { font-size: 0.8rem; color: var(--text-muted); margin: 0; }
      .btn-whatsapp { background: #25D366; color: #fff; border-color: #25D366; font-weight: 600; }
      .btn-whatsapp:hover { background: #1da851; }
      .whatsapp-widget__disclaimer { font-size: 0.75rem; color: var(--text-muted); text-align: center; margin-top: 12px; }
    `;
    document.head.appendChild(style);
  }

  document.getElementById('whatsappLeadForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting...';

    const name     = document.getElementById('whaName')?.value?.trim();
    const phone    = document.getElementById('whaPhone')?.value?.trim();
    const email    = document.getElementById('whaEmail')?.value?.trim();
    const interest = document.getElementById('whaInterest')?.value;

    try {
      // If phone number provided, save lead then open WhatsApp
      await submitLeadForm({ name, phone, email, interest }).catch(() => {});
      const message = `Hi! I'm ${name} and I'm interested in ${interest.replace(/-/g, ' ')} on Nexus Ultra. ${welcomeMessage}`;
      openWhatsAppChat(phoneNumber || phone, message);
    } catch (err) {
      console.warn('Lead capture error:', err);
      // Still open WhatsApp even if lead capture fails
      const message = `Hi! I'm ${name} and I'm interested in learning more about Nexus Ultra.`;
      if (phoneNumber) openWhatsAppChat(phoneNumber, message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-brands fa-whatsapp"></i> Start WhatsApp Chat';
    }
  });
}

// ─── Floating WhatsApp Button ─────────────────────────────────────────────────
export function initFloatingWhatsAppButton(phoneNumber, message = 'Hi! I\'d like to learn more about Nexus Ultra.') {
  if (!phoneNumber) return;
  const btn = document.createElement('a');
  btn.href  = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  btn.target= '_blank';
  btn.rel   = 'noopener noreferrer';
  btn.id    = 'floatingWhatsapp';
  btn.innerHTML = '<i class="fa-brands fa-whatsapp"></i>';
  btn.style.cssText = `
    position: fixed; bottom: 24px; left: 24px; z-index: 9998;
    width: 56px; height: 56px; border-radius: 50%;
    background: #25D366; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.75rem; box-shadow: 0 4px 16px rgba(37,211,102,0.5);
    transition: transform 0.2s, box-shadow 0.2s; text-decoration: none;
  `;
  btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.1)'; btn.style.boxShadow = '0 6px 24px rgba(37,211,102,0.7)'; });
  btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = '0 4px 16px rgba(37,211,102,0.5)'; });
  document.body.appendChild(btn);
}

// ─── Automated Response Templates ─────────────────────────────────────────────
export const MESSAGE_TEMPLATES = {
  welcome: {
    name: 'welcome_message',
    text: (name) => `👋 Welcome to Nexus Ultra, ${name}! We're excited to have you here.\n\n🚀 Get started by exploring our 50+ AI tools directory or generating your first piece of content.\n\nReply *HELP* for assistance or *TOOLS* to see top AI tools.`,
  },
  upgrade_reminder: {
    name: 'upgrade_reminder',
    text: (name) => `Hey ${name}! 👋\n\nYou've been using Nexus Ultra's free plan — amazing!\n\nUpgrade to Pro for:\n✅ Unlimited AI generations\n✅ All 50+ AI tools\n✅ Advanced analytics\n✅ Priority support\n\nGet 20% off with annual billing 👉 nexus.ultra/upgrade`,
  },
  content_tip: {
    name: 'content_tip',
    text: () => `💡 Pro Tip: Use specific, detailed prompts to get better AI-generated content.\n\nInstead of: "Write a blog post about AI"\nTry: "Write a 1000-word blog post about the top 5 AI tools for freelance copywriters in 2025, with specific examples and pricing"\n\nThe more context you provide, the better the output! 🎯`,
  },
};
