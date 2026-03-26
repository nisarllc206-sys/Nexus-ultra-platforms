/**
 * server.js — Express API Server
 * Entry point for the Nexus Ultra backend.
 */

require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const path      = require('path');
const rateLimit = require('express-rate-limit');

const { generateContentHandler, generateRateLimiter } = require('./functions/content-generator');
const { createCheckoutSession, createPortalSession, handleWebhook } = require('./functions/payment-handler');
const { handleWebhookVerification, handleWebhookEvent, handleLeadCapture, sendTemplateMessage } = require('./functions/whatsapp-bot');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── General Rate Limiter (for all routes) ────────────────────────────────────
const generalRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             500,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many requests, please try again later.' },
  skip:            (req) => req.path === '/health',
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://js.stripe.com", "https://www.gstatic.com"],
      styleSrc:       ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc:        ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc:         ["'self'", "data:", "https:"],
      connectSrc:     ["'self'", "https://api.anthropic.com", "https://firestore.googleapis.com", "https://identitytoolkit.googleapis.com", "https://api.stripe.com"],
      frameSrc:       ["'self'", "https://js.stripe.com"],
      objectSrc:      ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.APP_BASE_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Stripe webhook needs raw body — must be before express.json()
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// All other routes get JSON parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static Files ────────────────────────────────────────────────────────────
app.use(generalRateLimiter);
app.use(express.static(path.join(__dirname, '../../public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
}));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:  'ok',
    version: process.env.npm_package_version || '1.0.0',
    uptime:  Math.floor(process.uptime()),
  });
});

// ─── Content Generation API ──────────────────────────────────────────────────
app.post('/api/generate', generateRateLimiter, generateContentHandler);

// ─── Payment API ─────────────────────────────────────────────────────────────
app.post('/api/payment/create-checkout-session', createCheckoutSession);
app.post('/api/payment/create-portal-session',   createPortalSession);
app.post('/api/payment/webhook',                 handleWebhook);

// ─── WhatsApp API ─────────────────────────────────────────────────────────────
app.get('/api/whatsapp/webhook',           handleWebhookVerification);
app.post('/api/whatsapp/webhook',          handleWebhookEvent);
app.post('/api/whatsapp/leads',            handleLeadCapture);
app.post('/api/whatsapp/send-template',    async (req, res) => {
  try {
    await sendTemplateMessage(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SPA Fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', {
    method:  req.method,
    path:    req.path,
    message: err.message,
    stack:   err.stack,
  });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   Nexus Ultra API Server              ║
║   Port: ${PORT}                           ║
║   Env:  ${process.env.NODE_ENV || 'development'}                 ║
╚═══════════════════════════════════════╝
  `);
});

module.exports = app;
