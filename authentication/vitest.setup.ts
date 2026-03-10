// This file runs before any test module is imported.
// Set all required environment variables here so env.ts parses correctly.
process.env.PORT = "8081";
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://placeholder:27017/test"; // overridden per test suite
process.env.JWT_ACCESS_SECRET = "test-access-secret-at-least-16-chars";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-at-least-16-chars";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.RATE_LIMIT_WINDOW_MS = "900000";
process.env.RATE_LIMIT_MAX = "1000"; // raise limit so tests aren't blocked
process.env.CORS_ORIGINS = "http://localhost:3000";
