'use strict';

const cors    = require('cors');
const helmet  = require('helmet');
const config  = require('../config');

/**
 * Security middleware bundle:
 *  - helmet   → sets sensible HTTP security headers
 *  - cors     → restricts cross-origin requests to the configured frontend domain(s)
 */

const helmetMiddleware = helmet();

const corsMiddleware = cors({
  origin: config.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

module.exports = { helmetMiddleware, corsMiddleware };
