# Green Cart Notification Service

Notification microservice for in-app notifications with optional email delivery and internal service-to-service publishing.

## Features

- JWT-protected user notification API
- Internal API-key protected publish endpoint for other microservices
- Per-user notification listing, filtering, unread counts, and stats
- Mark-as-read, mark-all-read, delete, and clear operations
- Optional SMTP email send on internal publish calls
- OpenAPI documentation in api-docs/openapi.yaml

## Environment Variables

See .env.example. Required in most environments:

- PORT
- NODE_ENV
- MONGODB_URI
- JWT_ACCESS_SECRET
- CORS_ORIGINS
- INTERNAL_API_KEY (required for /internal/notifications)

Optional:

- RATE_LIMIT_WINDOW_MS
- RATE_LIMIT_MAX
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASSWORD
- SMTP_FROM
- AUTHENTICATION_SERVICE_URL
- INVENTORY_SERVICE_URL
- PAYMENT_SERVICE_URL

## Scripts

- npm run dev
- npm run build
- npm run start
- npm run typecheck
- npm run test

## API Overview

- GET /health
- POST /notifications
- GET /notifications
- GET /notifications/unread
- GET /notifications/stats
- PATCH /notifications/:notificationId/read
- PATCH /notifications/read-all
- DELETE /notifications/:notificationId
- DELETE /notifications/clear
- POST /internal/notifications
