'use strict';

const express = require('express');
const config  = require('./config');
const { helmetMiddleware, corsMiddleware } = require('./middleware/security');
const { loggerMiddleware }                 = require('./middleware/logger');
const { registerProxyRoutes }              = require('./routes/proxy');

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(helmetMiddleware);
app.use(corsMiddleware);
// Handle CORS pre-flight on every route
app.options('*', corsMiddleware);
app.use(loggerMiddleware);

// ─── Health Check ─────────────────────────────────────────────────────────────
// Exposed at /health so Cloud Run can verify the container is alive.
app.get('/health', (_req, res) => {
  res.status(200).json({
    status:  'ok',
    service: 'green-cart-api-gateway',
    uptime:  Math.floor(process.uptime()),
  });
});

// ─── Proxy Routes ─────────────────────────────────────────────────────────────
registerProxyRoutes(app);

// ─── 404 Catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found on gateway.' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
// Guard behind require.main so that importing this module in tests does not
// start a real server and hang/flake the test process.
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`[gateway] API Gateway listening on port ${config.port} (${config.nodeEnv})`);
    console.log(`[gateway] CORS origins: ${config.corsOrigins.join(', ')}`);
    console.log('[gateway] Upstream services:');
    Object.entries(config.services).forEach(([name, url]) => {
      console.log(`          /${name.padEnd(12)} -> ${url}`);
    });
  });
}

module.exports = app; // exported for testing
