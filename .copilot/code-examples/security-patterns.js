/**
 * security-patterns.js
 * Copilot code-example: Input sanitisation and validation patterns
 * for Nexus Ultra Platforms.
 */

const xss = require('xss');

/**
 * Strips HTML/script tags from a string to prevent XSS.
 * @param {string} input - Raw input.
 * @returns {string}     - Sanitised string.
 */
function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  return xss(input.trim());
}

/**
 * Recursively sanitises all string values in a plain object.
 * @param {Object} obj - Input object.
 * @returns {Object}   - Object with sanitised string values.
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? sanitizeString(v) : v])
  );
}

/**
 * Express middleware that sanitises req.body in place.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

module.exports = { sanitizeString, sanitizeObject, sanitizeBody };
