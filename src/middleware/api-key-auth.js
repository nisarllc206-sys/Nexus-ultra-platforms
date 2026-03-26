/**
 * api-key-auth.js
 * Middleware that validates API keys stored in Firestore.
 * Attaches key metadata and the owning userId to the request object.
 */

'use strict';

const admin = require('firebase-admin');

/**
 * Validates the API key supplied in the `x-api-key` header.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  try {
    const db = admin.firestore();
    const keyDoc = await db.collection('api_keys').doc(apiKey).get();

    if (!keyDoc.exists) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const keyData = keyDoc.data();

    if (!keyData.active) {
      return res.status(401).json({ error: 'API key is inactive' });
    }

    if (keyData.expiresAt && new Date() > keyData.expiresAt.toDate()) {
      return res.status(401).json({ error: 'API key expired' });
    }

    req.apiKey = keyData;
    req.userId = keyData.userId;

    next();
  } catch (error) {
    console.error('[validateApiKey] error:', error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = validateApiKey;
