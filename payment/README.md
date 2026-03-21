# Payment Service - Green Cart

Payment microservice for the Green Cart e-commerce platform. Handles payment session initiation, transaction status retrieval, and PayHere gateway webhook processing.

## Tech Stack

- **Runtime**: Node.js 22 (Alpine)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **API Gateway**: PayHere
- **Testing**: Vitest + Supertest
- **Linting**: ESLint + TypeScript

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local with your PayHere merchant credentials
```

### 3. Start development server
```bash
npm run dev
```

Server will run on `http://localhost:8083`.

## Available Scripts

- `npm run dev` — Start development server with hot reload (tsx watch)
- `npm run build` — Compile TypeScript to dist/
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
- `npm run typecheck` — Run TypeScript type checker
- `npm run test` — Run test suite
- `npm run test:coverage` — Run tests with coverage report

## API Endpoints

### Health Check
```
GET /health
```

### Payment Operations
```
POST /payment                      — Initiate payment session (requires JWT)
GET /payment/:transactionId        — Retrieve transaction status (requires JWT)
POST /payment/webhook/payhere      — PayHere callback handler (signature-verified)
```

## PayHere Integration

### Webhook Signature Verification

The service verifies all PayHere webhooks using MD5 signature validation:

```
md5(merchant_id + order_id + amount + status_code + secret_key)
```

This prevents tampering and ensures authenticity of payment notifications.

### Status Mapping

PayHere statuses are mapped to internal states:

| PayHere Code | Internal Status | Description              |
|--------------|-----------------|--------------------------|
| 2            | completed       | Payment successful       |
| 0, -1, -2, -3| failed          | Payment failed/declined  |
| Other        | pending         | Processing or unknown    |

## Environment Variables

Required:
- `MONGODB_URI` — MongoDB connection string
- `JWT_ACCESS_SECRET` — Secret for JWT validation (min 16 chars)
- `PAYHERE_MERCHANT_ID` — PayHere merchant ID
- `PAYHERE_SECRET_KEY` — PayHere API secret key
- `PAYHERE_WEBHOOK_SECRET` — PayHere webhook signature secret

Optional (with defaults):
- `PORT` — Server port (default: 8083)
- `NODE_ENV` — Environment (development, production, test)
- `CORS_ORIGINS` — Allowed CORS origins
- `RATE_LIMIT_*` — Rate limiting configuration
- `PAYHERE_API_URL` — PayHere API base URL (default: sandbox)
- `PAYMENT_CALLBACK_URL` — Your callback endpoint URL
- `PAYMENT_RETURN_URL` — Frontend redirect URL after payment

## Docker

### Build Image
```bash
docker build -t green-cart-payment:latest .
```

### Run Container
```bash
docker run -p 8083:8083 \
  -e MONGODB_URI=mongodb://mongo:27017/greencart-payment \
  -e JWT_ACCESS_SECRET=your-secret \
  -e PAYHERE_MERCHANT_ID=your-merchant-id \
  -e PAYHERE_SECRET_KEY=your-secret-key \
  -e PAYHERE_WEBHOOK_SECRET=your-webhook-secret \
  green-cart-payment:latest
```

## Testing

All endpoints require valid JWT tokens (except health check and webhook callback).

### Mock/Sandbox Testing

PayHere sandbox credentials:
```
Base URL: https://sandbox.payhere.lk
Merchant ID: Your sandbox merchant ID
```

To test webhook locally:
```bash
curl -X POST http://localhost:8083/payment/webhook/payhere \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "order_123",
    "merchant_id": "123456",
    "payment_id": "1234567890",
    "payhere_amount": "99.99",
    "payhere_currency": "USD",
    "status_code": "2",
    "md5sig": "calculated_hash_here"
  }'
```

## Error Codes

| Code                    | HTTP | Meaning                                  |
|-------------------------|------|------------------------------------------|
| UNAUTHORIZED            | 401  | Missing or invalid JWT token             |
| TOKEN_INVALID           | 401  | JWT token expired or tampered            |
| VALIDATION_ERROR        | 422  | Request body validation failed           |
| RATE_LIMITED            | 429  | Too many requests                        |
| FORBIDDEN               | 403  | Not transaction owner or invalid request |
| NOT_FOUND               | 404  | Transaction not found                    |
| INVALID_SIGNATURE       | 403  | PayHere webhook signature invalid        |
| AMOUNT_MISMATCH         | 400  | Webhook amount doesn't match transaction |

## CI/CD

The service is automatically built and tested on every push via GitHub Actions:
- Linting and type checking
- Build verification
- Dependency review
- SonarCloud SAST scan

See `.github/workflows/payment-ci.yml` for details.

## Deployment

Deploy to GCP Cloud Run:
```bash
gcloud run deploy green-cart-payment \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars MONGODB_URI=your-mongo-uri,PAYHERE_MERCHANT_ID=your-merchant-id,... \
  --memory 512Mi \
  --timeout 60
```

## Development Notes

### Idempotency

Payment creation is idempotent using a sha256 hash of `customerId:orderId`. Duplicate requests return the existing transaction instead of creating a new one.

### Webhook Processing

Webhook callbacks are idempotent — processing the same PayHere status multiple times will not duplicate state changes.

### Rate Limiting

Default: 10 requests per 60 seconds per IP address. Customize via `RATE_LIMIT_*` env vars.

## License

Part of Green Cart CTSE 2026 assignment. See root LICENSE file.
