# Payment Service Integration & Demo Guide

This guide provides step-by-step instructions for testing and demoing the payment service with PayHere integration.

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js 22+
- MongoDB running on `localhost:27017` (or configure `MONGODB_URI` in `.env.local`)
- A valid JWT token from the authentication service

### 2. Setup
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Update PayHere credentials in .env.local
PAYHERE_MERCHANT_ID=your_sandbox_merchant_id
PAYHERE_SECRET_KEY=your_sandbox_secret_key
PAYHERE_WEBHOOK_SECRET=your_sandbox_webhook_secret
```

### 3. Start Development Server
```bash
npm run dev
```

Server runs on `http://localhost:8083`

## API Testing Flow

### Step 1: Get an Authentication Token

First, register or login via the authentication service:

```bash
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "user": { "_id": "...", "email": "...", "role": "customer" },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "..."
}
```

Save the `accessToken` and use it with `Bearer` prefix in the `Authorization` header.

### Step 2: Initiate a Payment Session

```bash
CUSTOMER_ID="put_user_id_here"
AUTH_TOKEN="put_accessToken_here"

curl -X POST http://localhost:8083/payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "orderId": "order_6613a1e2b9e4d50012abc123",
    "customerId": "'$CUSTOMER_ID'",
    "amount": 9999,
    "currency": "USD",
    "returnUrl": "http://localhost:3000/checkout/success",
    "items": [
      {
        "name": "Organic Bananas",
        "quantity": 2,
        "price": 4999
      }
    ]
  }'
```

Response (201 Created):
```json
{
  "transactionId": "txn_1710759296000_abc123xyz",
  "checkoutUrl": "https://sandbox.payhere.lk/pay/txn_1710759296000_abc123xyz",
  "status": "pending",
  "createdAt": "2026-03-18T12:34:56.000Z"
}
```

### Step 3: Get Payment Status

```bash
TRANSACTION_ID="txn_1710759296000_abc123xyz"

curl -X GET "http://localhost:8083/payment/$TRANSACTION_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

Response (200 OK):
```json
{
  "transactionId": "txn_1710759296000_abc123xyz",
  "orderId": "order_6613a1e2b9e4d50012abc123",
  "customerId": "customer_123",
  "amount": 9999,
  "currency": "USD",
  "status": "pending",
  "payHereId": null,
  "payHereStatus": null,
  "errorMessage": null,
  "createdAt": "2026-03-18T12:34:56.000Z",
  "updatedAt": "2026-03-18T12:34:56.000Z",
  "completedAt": null
}
```

### Step 4: Simulate PayHere Webhook Callback

When PayHere processes the payment, it sends a webhook callback. Simulate this:

```bash
# Generate valid PayHere signature
# Formula: md5(merchant_id + order_id + amount + status_code + secret)

ORDER_ID="order_6613a1e2b9e4d50012abc123"
AMOUNT="99.99"
STATUS_CODE="2"  # 2 = successful payment
MERCHANT_ID="8675309"  # From your .env.local PAYHERE_MERCHANT_ID
SECRET="your_payhere_webhook_secret"

# Use online MD5 tool or: echo -n "MERCHANT_ID+ORDER_ID+AMOUNT+STATUS_CODE+SECRET" | md5sum
# For demo, you may use a pre-calculated hash

curl -X POST http://localhost:8083/payment/webhook/payhere \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "'$ORDER_ID'",
    "merchant_id": "'$MERCHANT_ID'",
    "payment_id": "1234567890",
    "payhere_amount": "'$AMOUNT'",
    "payhere_currency": "USD",
    "status_code": "'$STATUS_CODE'",
    "md5sig": "calculated_hash_here"
  }'
```

Response (200 OK):
```json
{
  "received": true,
  "transactionId": "txn_1710759296000_abc123xyz",
  "message": "Payment status updated successfully"
}
```

### Step 5: Verify Updated Status

Check the payment status again:

```bash
curl -X GET "http://localhost:8083/payment/$TRANSACTION_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

Now status should be `completed`:
```json
{
  "...": "...",
  "status": "completed",
  "payHereId": "1234567890",
  "payHereStatus": "2",
  "completedAt": "2026-03-18T12:35:10.000Z"
}
```

## Error Scenarios

### Missing Authentication Token
```bash
curl -X POST http://localhost:8083/payment \
  -H "Content-Type: application/json" \
  -d '{ "orderId": "...", ... }'
```

Response (401 Unauthorized):
```json
{
  "error": "Missing or malformed Authorization header.",
  "code": "UNAUTHORIZED"
}
```

### Invalid Request Body (Validation Error)
```bash
curl -X POST http://localhost:8083/payment \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "orderId": "order_123",
    "customerId": "customer_123",
    "amount": 0,
    "currency": "USD",
    "returnUrl": "not-a-url"
  }'
```

Response (422 Validation Error):
```json
{
  "error": "Validation failed: amount: Amount must be greater than 0, returnUrl: Return URL must be a valid URL",
  "code": "VALIDATION_ERROR"
}
```

### Rate Limiting
```bash
# Make 11+ requests within 60 seconds
for i in {1..15}; do
  curl -X POST http://localhost:8083/payment \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{ ... }'
done
```

Response (429 Too Many Requests):
```json
{
  "error": "Too many payment requests from this IP. Please try again later.",
  "code": "RATE_LIMITED"
}
```

### Invalid PayHere Signature (Webhook)
```bash
curl -X POST http://localhost:8083/payment/webhook/payhere \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "...",
    "merchant_id": "...",
    "payment_id": "...",
    "payhere_amount": "...",
    "payhere_currency": "USD",
    "status_code": "2",
    "md5sig": "wrong_signature_hash"
  }'
```

Response (403 Forbidden):
```json
{
  "error": "Invalid PayHere signature",
  "code": "INVALID_SIGNATURE"
}
```

## Testing with Postman/Insomnia

1. Create a collection with the following requests:
   - **GET** `/health` — No auth required
   - **POST** `/payment` — Create payment (requires Bearer token)
   - **GET** `/payment/{transactionId}` — Check status (requires Bearer token)
   - **POST** `/payment/webhook/payhere` — Simulate webhook

2. Set environment variables:
   ```
   base_url = http://localhost:8083
   auth_url = http://localhost:8081
   access_token = <from login response>
   customer_id = <from auth service>
   transaction_id = <from initiate payment response>
   ```

3. Use pre-request scripts to automatically set `Authorization: Bearer {{access_token}}`

## Unit Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test -- --watch
```

Current test coverage:
- PayHere signature verification (valid/invalid)
- Status code mapping (2→completed, 0/-1/-2/-3→failed, other→pending)
- Idempotency key generation

## Integration Testing (Manual)

1. **Full Payment Flow Test**
   - Create JWT token via auth service
   - Initiate payment → get transaction ID
   - Simulate webhook callback with valid signature
   - Verify status updated to "completed"

2. **Idempotency Test**
   - Create two payments with same customerId + orderId
   - Second request returns existing transaction (no duplicate created)

3. **Webhook Idempotency Test**
   - Send same webhook payload twice
   - Second request updates same transaction (no state corruption)

4. **Security Test**
   - Send webhook with tampered signature hash
   - Request rejected with 403 INVALID_SIGNATURE
   - Transaction status remains unchanged

## Production Deployment

### Environment Variables for Production
```bash
NODE_ENV=production
MONGODB_URI=<production-mongodb-uri>
JWT_ACCESS_SECRET=<strong-random-secret-min-16-chars>
PAYHERE_MERCHANT_ID=<live-merchant-id>
PAYHERE_SECRET_KEY=<live-secret-key>
PAYHERE_WEBHOOK_SECRET=<live-webhook-secret>
PAYHERE_API_URL=https://www.payhere.lk  # Production URL (not sandbox)
PAYMENT_CALLBACK_URL=<your-public-domain>/payment/webhook/payhere
PAYMENT_RETURN_URL=<your-frontend-domain>/checkout/success
CORS_ORIGINS=<frontend-domain>
```

### Deploy to GCP Cloud Run
```bash
# From payment/ directory
gcloud run deploy green-cart-payment \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars MONGODB_URI=$MONGODB_URI,PAYHERE_MERCHANT_ID=$PAYHERE_MERCHANT_ID,... \
  --memory 512Mi \
  --timeout 60
```

## Troubleshooting

### MongoDB Connection Fails
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
Solution: Ensure MongoDB is running. Start with:
```bash
mongod  # or use Docker: docker run -d -p 27017:27017 mongo:latest
```

### JWT Token Invalid
```
Error: "Invalid or expired access token."
```
Solution: 
- Token may be expired (15 min lifetime)
- Use `refresh` endpoint from auth service to get new token
- Ensure `JWT_ACCESS_SECRET` matches between auth and payment services

### Rate Limiting Blocks Requests
```
Error: "Too many payment requests from this IP. Please try again later."
```
Solution:
- Wait 60 seconds (default window)
- Reduce `RATE_LIMIT_MAX` in `.env.local` if needed
- Or whitelist IP using middleware modifications

### Webhook Signature Mismatch
```
Error: "Invalid PayHere signature"
```
Solution:
- Verify `PAYHERE_WEBHOOK_SECRET` matches PayHere dashboard
- Ensure MD5 hash calculation is correct (order: merchant_id + order_id + amount + status_code + secret)
- Check amount format (99.99 as string, not 9999 as cents)

## Success Criteria for Viva Demo

✅ POST /payment returns 201 with transactionId and checkoutUrl  
✅ GET /payment/{transactionId} returns 200 with current status  
✅ Health check returns 200 with service status  
✅ Webhook callback updates transaction status correctly  
✅ Invalid signature rejected with 403  
✅ Missing JWT returns 401  
✅ Build compiles without errors  
✅ Tests pass  
✅ OpenAPI spec matches implementation  
✅ Docker image builds successfully  

## Notes

- Payment service is stateless (scales horizontally)
- All transactions stored in MongoDB with timestamps and audit trail
- Webhook processing is idempotent (safe for retries)
- Rate limiting per IP address (not per user)
- Future enhancements: emit events to notification service, support refund workflows, add webhook signature replay protection
