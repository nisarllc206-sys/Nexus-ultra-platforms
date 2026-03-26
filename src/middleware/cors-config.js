/**
 * cors-config.js
 * CORS configuration for the Nexus Ultra Platforms API.
 * Restricts origins to known production domains.
 */

'use strict';

const cors = require('cors');

const ALLOWED_ORIGINS = [
  'https://nexus-ultra.com',
  'https://app.nexus-ultra.com',
  'https://admin.nexus-ultra.com'
];

const corsOptions = {
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  maxAge: 3600
};

module.exports = cors(corsOptions);
