/**
 * input-validator.js
 * Request validation and input sanitisation middleware.
 * Uses express-validator for schema validation and xss for output encoding.
 */

'use strict';

const { body, validationResult } = require('express-validator');
const xss = require('xss');

/**
 * Sanitises a single string value against XSS payloads.
 *
 * @param {string} data - Raw input string.
 * @returns {string}    - Sanitised string.
 */
function sanitizeInput(data) {
  if (typeof data === 'string') {
    return xss(data);
  }
  return data;
}

/**
 * Validation chain + error-handling middleware for content creation endpoints.
 * Validates `title` (1–500 chars) and `content` (1–10 000 chars).
 *
 * @type {Array<import('express').RequestHandler>}
 */
const validateContentInput = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1-500 characters')
    .custom((value) => {
      if (sanitizeInput(value) !== value) {
        throw new Error('Invalid characters detected in title');
      }
      return true;
    }),

  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must be between 1-10000 characters')
    .custom((value) => {
      if (sanitizeInput(value) !== value) {
        throw new Error('Invalid characters detected in content');
      }
      return true;
    }),

  /**
   * Collects express-validator errors and responds with 400 if any exist.
   * @param {import('express').Request}  req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = { validateContentInput, sanitizeInput };
