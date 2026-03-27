'use strict';

const morgan = require('morgan');
const config = require('../config');

/**
 * HTTP request logger.
 * Uses 'combined' format in production (structured, includes remote addr)
 * and 'dev' format in development (coloured, concise).
 */
const loggerMiddleware = morgan(config.nodeEnv === 'production' ? 'combined' : 'dev');

module.exports = { loggerMiddleware };
