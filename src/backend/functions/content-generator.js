/**
 * content-generator.js — Cloud Function: POST /api/generate
 * Accepts prompt, contentType, model. Calls Claude API. Supports streaming.
 * Includes rate limiting and optional auth verification.
 */

const Anthropic  = require('@anthropic-ai/sdk');
const rateLimit  = require('express-rate-limit');
const { Auth, Firestore } = require('../firebase-config');

// ─── Anthropic Client ─────────────────────────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Supported Models ─────────────────────────────────────────────────────────
const ALLOWED_MODELS = new Set([
  'claude-3-5-sonnet-20241022',
  'claude-3-haiku-20240307',
  'claude-3-opus-20240229',
]);

// ─── Plan Limits ──────────────────────────────────────────────────────────────
const PLAN_LIMITS = {
  free:       50,
  pro:        Infinity,
  enterprise: Infinity,
};

// ─── Rate Limiter (IP-based) ──────────────────────────────────────────────────
const generateRateLimiter = rateLimit({
  windowMs:         60 * 60 * 1000, // 1 hour
  max:              100,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Too many requests. Please try again later.' },
});

// ─── Verify Auth Token (optional — degrade gracefully if not provided) ────────
async function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token     = authHeader.slice(7);
    const decoded   = await Auth.verifyIdToken(token);
    const profile   = await Firestore.getUserPlanAndUsage(decoded.uid);
    return { uid: decoded.uid, ...profile };
  } catch {
    return null;
  }
}

// ─── Check Usage Limit ────────────────────────────────────────────────────────
async function checkUsageLimit(user) {
  if (!user) return { allowed: true }; // anonymous — allow with IP rate limit
  const limit = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;
  if (limit === Infinity) return { allowed: true };
  if (user.monthlyUsage >= limit) {
    return { allowed: false, message: `Monthly limit of ${limit} reached on ${user.plan} plan. Upgrade for more.` };
  }
  return { allowed: true };
}

// ─── Input Validation ─────────────────────────────────────────────────────────
function validateInput(body) {
  const { prompt, contentType, model } = body;
  const errors = [];

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
    errors.push('prompt must be a non-empty string (min 3 characters)');
  }
  if (prompt && prompt.length > 10000) {
    errors.push('prompt exceeds maximum length of 10000 characters');
  }
  if (model && !ALLOWED_MODELS.has(model)) {
    errors.push(`model must be one of: ${[...ALLOWED_MODELS].join(', ')}`);
  }

  return errors;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
async function generateContentHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate input
  const validationErrors = validateInput(req.body);
  if (validationErrors.length) {
    return res.status(400).json({ error: validationErrors.join('; ') });
  }

  const {
    prompt,
    model        = 'claude-3-5-sonnet-20241022',
    contentType  = 'blog',
    stream       = false,
    maxTokens    = 2048,
  } = req.body;

  // Auth + usage check
  const user       = await getAuthenticatedUser(req);
  const { allowed, message: limitMsg } = await checkUsageLimit(user);
  if (!allowed) {
    return res.status(429).json({ error: limitMsg, code: 'USAGE_LIMIT_EXCEEDED' });
  }

  try {
    if (stream) {
      // ── Streaming Response ────────────────────────────────────────────
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const streamResp = await anthropic.messages.stream({
        model,
        max_tokens: maxTokens,
        messages:   [{ role: 'user', content: prompt }],
        system:     'You are an expert AI content creator. Generate high-quality, engaging content as requested. Be thorough, specific, and actionable.',
      });

      let fullContent = '';

      streamResp.on('text', (text) => {
        fullContent += text;
        res.write(`data: ${JSON.stringify({ delta: { text } })}\n\n`);
      });

      await streamResp.finalMessage();
      res.write('data: [DONE]\n\n');
      res.end();

      // Save to Firestore and update usage counter (non-blocking)
      if (user?.uid) {
        Firestore.incrementUsage(user.uid).catch(() => {});
        Firestore.saveContent(user.uid, {
          prompt:      prompt.slice(0, 500),
          contentType,
          model,
          content:     fullContent,
          wordCount:   fullContent.split(/\s+/).filter(Boolean).length,
        }).catch(() => {});
      }
    } else {
      // ── Standard Response ─────────────────────────────────────────────
      const response = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        messages:   [{ role: 'user', content: prompt }],
        system:     'You are an expert AI content creator. Generate high-quality, engaging content as requested. Be thorough, specific, and actionable.',
      });

      const content = response.content[0]?.text || '';

      if (user?.uid) {
        Firestore.incrementUsage(user.uid).catch(() => {});
        Firestore.saveContent(user.uid, {
          prompt: prompt.slice(0, 500),
          contentType,
          model,
          content,
          wordCount: content.split(/\s+/).filter(Boolean).length,
        }).catch(() => {});
      }

      return res.json({
        content,
        model,
        contentType,
        usage: response.usage,
      });
    }
  } catch (err) {
    console.error('Content generation error:', err);

    if (err.status === 401) {
      return res.status(500).json({ error: 'AI service authentication failed. Check ANTHROPIC_API_KEY.' });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: 'AI service rate limit exceeded. Please try again later.' });
    }
    if (err.status === 400) {
      return res.status(400).json({ error: 'Invalid request to AI service.' });
    }

    return res.status(500).json({ error: 'Content generation failed. Please try again.' });
  }
}

module.exports = {
  generateContentHandler,
  generateRateLimiter,
};
