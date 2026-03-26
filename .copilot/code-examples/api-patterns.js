/**
 * api-patterns.js
 * Copilot code-example: Express API handler patterns
 * for Nexus Ultra Platforms.
 */

const express = require('express');
const router = express.Router();

/**
 * Standard success response helper.
 * @param {import('express').Response} res
 * @param {Object} data    - Payload to send.
 * @param {number} [status=200] - HTTP status code.
 */
function sendSuccess(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

/**
 * Standard error response helper.
 * @param {import('express').Response} res
 * @param {string} message - Error description.
 * @param {number} [status=500] - HTTP status code.
 */
function sendError(res, message, status = 500) {
  res.status(status).json({ success: false, error: message });
}

/**
 * Example CRUD route — GET /items/:id
 */
router.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: fetch item from database
    sendSuccess(res, { id, name: 'Example item' });
  } catch (error) {
    console.error('[GET /items/:id] error:', error.message);
    sendError(res, 'Failed to retrieve item');
  }
});

module.exports = { router, sendSuccess, sendError };
