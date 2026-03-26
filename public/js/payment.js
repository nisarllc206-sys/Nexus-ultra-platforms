/**
 * payment.js — Stripe Payment Integration Module
 * Handles plan selection, checkout session creation, subscription management,
 * and webhook event processing.
 */

// ─── Configuration (set via environment variables on the server) ──────────────
const STRIPE_PUBLIC_KEY  = window.STRIPE_PUBLIC_KEY || 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY';
const PAYMENT_API_BASE   = '/api/payment';

// ─── Plan Definitions ─────────────────────────────────────────────────────────
export const PLANS = {
  free: {
    id:          'free',
    name:        'Free',
    priceMonthly: 0,
    priceAnnual:  0,
    features: [
      '50 AI generations/month',
      '20 AI tools',
      'Basic dashboard',
      'Community support',
      '5 saved favorites',
    ],
    limits: {
      generations: 50,
      tools:       20,
      favorites:   5,
    },
  },
  pro: {
    id:            'pro',
    name:          'Pro',
    priceMonthly:  29,
    priceAnnual:   23,
    stripePriceIds: {
      monthly: 'price_pro_monthly',
      annual:  'price_pro_annual',
    },
    features: [
      'Unlimited AI generations',
      'All 50+ AI tools',
      'Advanced analytics',
      'Priority support',
      'Unlimited favorites',
      'WhatsApp automation',
      'API access',
    ],
    limits: {
      generations: Infinity,
      tools:       Infinity,
      favorites:   Infinity,
    },
  },
  enterprise: {
    id:           'enterprise',
    name:         'Enterprise',
    priceMonthly: 99,
    priceAnnual:  79,
    stripePriceIds: {
      monthly: 'price_enterprise_monthly',
      annual:  'price_enterprise_annual',
    },
    features: [
      'Everything in Pro',
      '10 team seats',
      'Custom AI fine-tuning',
      'Dedicated account manager',
      'SLA 99.99% uptime',
      'White-label option',
    ],
    limits: {
      generations: Infinity,
      tools:       Infinity,
      favorites:   Infinity,
      seats:       10,
    },
  },
};

// ─── Stripe Loader ────────────────────────────────────────────────────────────
let stripeInstance = null;

async function getStripe() {
  if (stripeInstance) return stripeInstance;
  if (!window.Stripe) {
    await loadStripeScript();
  }
  stripeInstance = window.Stripe(STRIPE_PUBLIC_KEY);
  return stripeInstance;
}

function loadStripeScript() {
  return new Promise((resolve, reject) => {
    if (document.getElementById('stripe-js')) { resolve(); return; }
    const script  = document.createElement('script');
    script.id     = 'stripe-js';
    script.src    = 'https://js.stripe.com/v3/';
    script.onload = resolve;
    script.onerror= reject;
    document.head.appendChild(script);
  });
}

// ─── Create Checkout Session ──────────────────────────────────────────────────
export async function createCheckoutSession({ planId, billingPeriod = 'monthly', userId, email }) {
  const plan = PLANS[planId];
  if (!plan || planId === 'free') throw new Error('Invalid plan or free plan selected');

  const priceId = plan.stripePriceIds?.[billingPeriod];
  if (!priceId) throw new Error('Price ID not configured');

  const resp = await fetch(`${PAYMENT_API_BASE}/create-checkout-session`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ priceId, planId, userId, email, billingPeriod }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Failed to create checkout session' }));
    throw new Error(err.error);
  }

  return resp.json();
}

// ─── Redirect to Stripe Checkout ─────────────────────────────────────────────
export async function redirectToCheckout({ planId, billingPeriod = 'monthly', userId, email }) {
  try {
    const stripe  = await getStripe();
    const session = await createCheckoutSession({ planId, billingPeriod, userId, email });

    if (session.url) {
      window.location.href = session.url;
      return;
    }

    const { error } = await stripe.redirectToCheckout({ sessionId: session.id });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error('Checkout error:', err);
    showPaymentError(err.message);
  }
}

// ─── Get Current Plan ─────────────────────────────────────────────────────────
export function getCurrentPlan() {
  return localStorage.getItem('nexus_plan') || 'free';
}

// ─── Update Plan in Local State ───────────────────────────────────────────────
export function setCurrentPlan(planId) {
  localStorage.setItem('nexus_plan', planId);
  document.querySelectorAll('[data-plan-status]').forEach(el => {
    el.textContent = PLANS[planId]?.name || 'Free';
  });
}

// ─── Check Feature Access ─────────────────────────────────────────────────────
export function canUseFeature(feature) {
  const planId = getCurrentPlan();
  const plan   = PLANS[planId] || PLANS.free;

  const featureMap = {
    unlimited_generations: plan.limits.generations === Infinity,
    advanced_analytics:    planId === 'pro' || planId === 'enterprise',
    whatsapp_automation:   planId === 'pro' || planId === 'enterprise',
    api_access:            planId === 'pro' || planId === 'enterprise',
    team_seats:            planId === 'enterprise',
    white_label:           planId === 'enterprise',
  };

  return featureMap[feature] ?? true;
}

// ─── Enforce Usage Limit ──────────────────────────────────────────────────────
export function checkGenerationLimit() {
  const plan  = getCurrentPlan();
  const limit = PLANS[plan]?.limits?.generations || 50;
  if (limit === Infinity) return true;

  const used = parseInt(localStorage.getItem('nexus_usage_count') || '0');
  if (used >= limit) {
    showUpgradePrompt(`You've used all ${limit} generations on the ${PLANS[plan]?.name} plan. Upgrade to continue.`);
    return false;
  }
  return true;
}

// ─── UI: Show Upgrade Prompt ──────────────────────────────────────────────────
export function showUpgradePrompt(message) {
  const existing = document.getElementById('upgradePromptBanner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id    = 'upgradePromptBanner';
  banner.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; padding: 16px 20px; border-radius: 16px;
    box-shadow: 0 8px 32px rgba(99,102,241,0.5);
    max-width: 360px; display: flex; gap: 12px; align-items: flex-start;
    animation: slideInRight 0.3s ease;
  `;
  banner.innerHTML = `
    <i class="fa-solid fa-bolt" style="font-size:1.2rem;margin-top:2px;"></i>
    <div style="flex:1;">
      <strong style="display:block;margin-bottom:6px;">Upgrade Required</strong>
      <p style="font-size:0.8rem;opacity:0.9;margin-bottom:12px;">${message}</p>
      <a href="index.html#pricing" style="
        display:inline-block;background:rgba(255,255,255,0.2);color:#fff;
        padding:6px 14px;border-radius:8px;font-size:0.8rem;font-weight:600;
        text-decoration:none;transition:background 0.2s;
      ">View Plans →</a>
    </div>
    <button onclick="this.closest('#upgradePromptBanner').remove()" style="
      background:none;border:none;color:#fff;opacity:0.7;cursor:pointer;
      font-size:1rem;padding:0;line-height:1;
    ">✕</button>
  `;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 8000);
}

// ─── UI: Show Payment Error ───────────────────────────────────────────────────
function showPaymentError(message) {
  alert(`Payment error: ${message || 'An unexpected error occurred. Please try again.'}`);
}

// ─── Handle Checkout Buttons ──────────────────────────────────────────────────
export function initPaymentButtons() {
  const isBillingAnnual = () => document.getElementById('billingToggle')?.checked || false;

  document.querySelectorAll('[data-plan][data-price-id]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.preventDefault();
      const planId = btn.dataset.plan;
      if (!planId || planId === 'free') {
        window.location.href = 'dashboard.html';
        return;
      }

      const billingPeriod = isBillingAnnual() ? 'annual' : 'monthly';
      const userCache     = JSON.parse(localStorage.getItem('nexus_user_cache') || '{}');

      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';

      try {
        await redirectToCheckout({
          planId,
          billingPeriod,
          userId: userCache.uid   || null,
          email:  userCache.email || null,
        });
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  });
}

// ─── Handle Stripe Webhook Result ────────────────────────────────────────────
export function handlePaymentSuccess() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'success') {
    const plan = params.get('plan') || 'pro';
    setCurrentPlan(plan);
    showSuccessBanner(`🎉 Welcome to ${PLANS[plan]?.name || 'Pro'}! Your account has been upgraded.`);
    window.history.replaceState({}, '', window.location.pathname);
  }
}

function showSuccessBanner(message) {
  const banner   = document.createElement('div');
  banner.style.cssText = `
    position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:9999;
    background:var(--color-success);color:#fff;padding:14px 24px;border-radius:12px;
    box-shadow:0 8px 32px rgba(16,185,129,0.4);font-weight:600;text-align:center;
    animation:fadeInDown 0.3s ease;
  `;
  banner.textContent = message;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 5000);
}

// ─── Auto-initialize on load ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initPaymentButtons();
  handlePaymentSuccess();
});
