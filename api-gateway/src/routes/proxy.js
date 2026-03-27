'use strict';

const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config');

/**
 * Creates a proxy middleware for the given upstream service.
 *
 * @param {string} target   - The base URL of the upstream service.
 * @param {string} prefix   - The route prefix to strip (e.g. '/auth').
 * @returns {import('http-proxy-middleware').RequestHandler}
 */
function buildProxy(target, prefix) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    // Strip the prefix before forwarding to the upstream service.
    // e.g. /auth/login  ->  /login
    pathRewrite: { [`^${prefix}`]: '' },
    on: {
      error(err, req, res) {
        console.error(`[proxy] ${prefix} -> ${target} error:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({
            success: false,
            message: 'Bad gateway: upstream service is unavailable.',
            service: prefix.replace('/', ''),
          });
        }
      },
      proxyReq(proxyReq, req) {
        // Forward the client's real IP to the upstream service.
        const clientIp =
          req.headers['x-forwarded-for'] ?? req.socket?.remoteAddress ?? 'unknown';
        proxyReq.setHeader('X-Forwarded-For', clientIp);
        proxyReq.setHeader('X-Gateway-Source', 'green-cart-api-gateway');
      },
    },
  });
}

/**
 * Registers all proxy routes on the Express app.
 *
 * @param {import('express').Application} app
 */
function registerProxyRoutes(app) {
  app.use('/auth',         buildProxy(config.services.auth,         '/auth'));
  app.use('/inventory',    buildProxy(config.services.inventory,    '/inventory'));
  app.use('/payment',      buildProxy(config.services.payment,      '/payment'));
  app.use('/notification', buildProxy(config.services.notification, '/notification'));
}

module.exports = { registerProxyRoutes };
