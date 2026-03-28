/**
 * rate-limiter.js
 * Express rate-limiting middleware using Redis for distributed state.
 * Provides three tiers: general API, authentication, and public endpoints.
 */

'use strict';

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD
});

redisClient.on('error', (err) => {
  console.error('[RedisClient] connection error:', err.message);
});

/**
 * General API limiter — 100 requests per 15 minutes per IP.
 */
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict auth limiter — 5 failed attempts per 15 minutes per IP.
 * Successful requests do not count toward the limit.
 */
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Loose public limiter — 30 requests per minute per IP.
 */
const publicLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:public:'
  }),
  windowMs: 60 * 1000,
  max: 30,
  message: 'Rate limit exceeded. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { apiLimiter, authLimiter, publicLimiter };
