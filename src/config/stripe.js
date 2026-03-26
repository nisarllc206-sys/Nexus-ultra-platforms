/**
 * stripe.js — Stripe Configuration
 * Centralizes Stripe initialization and plan/price configuration.
 * All secrets come from environment variables — never hardcoded.
 */

const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️  STRIPE_SECRET_KEY is not set. Payment features will be disabled.');
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
      appInfo: {
        name:    'Nexus Ultra',
        version: '1.0.0',
        url:     'https://nexultra.app',
      },
    })
  : null;

// ─── Plan and Price Configuration ─────────────────────────────────────────────
const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY',
  webhookSecret:  process.env.STRIPE_WEBHOOK_SECRET,

  prices: {
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY        || 'price_pro_monthly_placeholder',
      annual:  process.env.STRIPE_PRICE_PRO_ANNUAL         || 'price_pro_annual_placeholder',
    },
    enterprise: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly_placeholder',
      annual:  process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL  || 'price_enterprise_annual_placeholder',
    },
  },

  plans: {
    free: {
      name:  'Free',
      price: 0,
      limits: { generations: 50, tools: 20, favorites: 5 },
    },
    pro: {
      name:     'Pro',
      monthly:  2900,  // cents
      annual:   2300,  // cents per month, billed annually
      limits:   { generations: Infinity, tools: Infinity, favorites: Infinity },
    },
    enterprise: {
      name:     'Enterprise',
      monthly:  9900,  // cents
      annual:   7900,  // cents per month, billed annually
      limits:   { generations: Infinity, tools: Infinity, favorites: Infinity, seats: 10 },
    },
  },

  successUrl: `${process.env.APP_BASE_URL || 'https://nexultra.app'}/dashboard.html?payment=success&plan={planId}`,
  cancelUrl:  `${process.env.APP_BASE_URL  || 'https://nexultra.app'}/index.html#pricing`,
};

// ─── Helper: Resolve plan from Stripe price ID ────────────────────────────────
function resolvePlanFromPriceId(priceId) {
  const { prices } = STRIPE_CONFIG;
  if ([prices.enterprise.monthly, prices.enterprise.annual].includes(priceId)) return 'enterprise';
  if ([prices.pro.monthly, prices.pro.annual].includes(priceId)) return 'pro';
  return 'free';
}

// ─── Helper: Get price ID for a plan and billing period ──────────────────────
function getPriceId(planId, billingPeriod = 'monthly') {
  return STRIPE_CONFIG.prices[planId]?.[billingPeriod] || null;
}

module.exports = {
  stripe,
  STRIPE_CONFIG,
  resolvePlanFromPriceId,
  getPriceId,
};
