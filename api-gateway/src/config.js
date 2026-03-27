'use strict';

require('dotenv').config();

/**
 * Centralised configuration for the API Gateway.
 * All values are read once at startup; the process exits early if a required
 * variable is missing so failures surface immediately.
 */

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`[config] Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

const config = {
  port: parseInt(process.env.PORT ?? '8080', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  // Upstream service base URLs (no trailing slash)
  services: {
    auth:         requireEnv('AUTH_SERVICE_URL'),
    inventory:    requireEnv('INVENTORY_SERVICE_URL'),
    payment:      requireEnv('PAYMENT_SERVICE_URL'),
    notification: requireEnv('NOTIFICATION_SERVICE_URL'),
  },

  // Comma-separated list of allowed CORS origins, e.g. "https://green-cart.vercel.app"
  corsOrigins: (process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim()),
};

module.exports = config;
