/**
 * payment-handler.js — Stripe Payment Cloud Function
 * Handles checkout session creation and webhook processing.
 */

const stripe    = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Firestore } = require('../firebase-config');

// ─── Plan → Price ID Mapping ─────────────────────────────────────────────────
const PRICE_IDS = {
  pro_monthly:        process.env.STRIPE_PRICE_PRO_MONTHLY        || 'price_pro_monthly',
  pro_annual:         process.env.STRIPE_PRICE_PRO_ANNUAL         || 'price_pro_annual',
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
  enterprise_annual:  process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL  || 'price_enterprise_annual',
};

// ─── Create Checkout Session ──────────────────────────────────────────────────
async function createCheckoutSession(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { priceId, planId, userId, email, billingPeriod = 'monthly' } = req.body;

  if (!priceId || !planId) {
    return res.status(400).json({ error: 'priceId and planId are required' });
  }

  try {
    const sessionParams = {
      mode:               'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price:    priceId,
        quantity: 1,
      }],
      success_url: `${process.env.APP_BASE_URL || 'https://your-domain.com'}/dashboard.html?payment=success&plan=${planId}`,
      cancel_url:  `${process.env.APP_BASE_URL  || 'https://your-domain.com'}/index.html#pricing`,
      metadata: {
        planId,
        userId:        userId || '',
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          planId,
          userId: userId || '',
        },
      },
      allow_promotion_codes: true,
    };

    // Pre-fill email if provided
    if (email) sessionParams.customer_email = email;

    // Attach to existing customer if userId maps to a Stripe customer
    if (userId) {
      const user = await Firestore.getUser(userId);
      if (user?.stripeCustomerId) {
        delete sessionParams.customer_email;
        sessionParams.customer = user.stripeCustomerId;
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create checkout session' });
  }
}

// ─── Create Customer Portal Session ──────────────────────────────────────────
async function createPortalSession(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const user = await Firestore.getUser(userId);
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer found for this user' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   user.stripeCustomerId,
      return_url: `${process.env.APP_BASE_URL || 'https://your-domain.com'}/dashboard.html`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('Portal session error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ─── Stripe Webhook Handler ───────────────────────────────────────────────────
async function handleWebhook(req, res) {
  const sig           = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  try {
    // req.body is the raw Buffer set by express.raw() on the /api/payment/webhook route
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature invalid: ${err.message}` });
  }

  try {
    await processWebhookEvent(event);
    return res.json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook event ${event.type}:`, err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// ─── Process Webhook Events ────────────────────────────────────────────────────
async function processWebhookEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId  = session.metadata?.userId;
      const planId  = session.metadata?.planId;

      if (userId && planId) {
        await Firestore.updateUser(userId, {
          plan:              planId,
          planStatus:        'active',
          stripeCustomerId:  session.customer,
        });
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const userId       = subscription.metadata?.userId;

      if (userId) {
        const planId = subscription.metadata?.planId || resolvePlanFromSubscription(subscription);
        await Firestore.saveSubscription(userId, {
          customerId:       subscription.customer,
          subscriptionId:   subscription.id,
          plan:             planId,
          status:           subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const userId       = subscription.metadata?.userId;

      if (userId) {
        await Firestore.updateUser(userId, {
          plan:       'free',
          planStatus: 'cancelled',
        });
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice  = event.data.object;
      const customer = invoice.customer;
      // Could log payment to analytics
      console.log(`Payment succeeded for customer: ${customer}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice  = event.data.object;
      const userId   = invoice.subscription_details?.metadata?.userId;
      if (userId) {
        await Firestore.updateUser(userId, { planStatus: 'past_due' });
      }
      break;
    }

    default:
      console.log(`Unhandled webhook event type: ${event.type}`);
  }
}

// ─── Resolve Plan from Subscription Price ────────────────────────────────────
function resolvePlanFromSubscription(subscription) {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  if (!priceId) return 'free';
  if (priceId.includes('enterprise')) return 'enterprise';
  if (priceId.includes('pro'))        return 'pro';
  return 'free';
}

module.exports = {
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
};
