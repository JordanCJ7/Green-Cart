#!/bin/bash

# Script to clean up the old API Gateway deployment
# Usage: ./scripts/delete-api-gateway.sh

set -e

PROJECT_ID="green-cart-authentication"
API_ID="greencart-api"
REGION="us-central1"

echo "🗑️  Cleaning up API Gateway resources..."

# Authenticate to GCP (if needed)
# gcloud auth login
# gcloud config set project $PROJECT_ID

echo "1️⃣  Deleting API configs..."
# Get all configs for the API and delete them
gcloud api-gateway api-configs list \
  --api=$API_ID \
  --project=$PROJECT_ID \
  --format="value(name)" | while read config; do
  echo "  Deleting config: $config"
  gcloud api-gateway api-configs delete "$config" \
    --api=$API_ID \
    --project=$PROJECT_ID \
    --quiet
done

echo "2️⃣  Deleting API..."
# Delete the API itself
gcloud api-gateway apis delete $API_ID \
  --project=$PROJECT_ID \
  --quiet

echo "3️⃣  Deleting Gateway (if exists)..."
# Try to delete gateway too
GATEWAY_ID="greencart-api"
gcloud api-gateway gateways delete $GATEWAY_ID \
  --location=$REGION \
  --project=$PROJECT_ID \
  --quiet 2>/dev/null || echo "  Gateway already deleted or doesn't exist"

echo "✅ Cleanup complete! Old API Gateway resources removed."
echo ""
echo "Next steps:"
echo "1. Verify in GCP Console that resources are deleted"
echo "2. Add these 4 env vars to Vercel:"
echo "   - NEXT_PUBLIC_AUTH_API_URL=https://green-cart-auth-service-574911690185.us-central1.run.app"
echo "   - NEXT_PUBLIC_INVENTORY_API_URL=https://green-cart-inventory-service-574911690185.us-central1.run.app"
echo "   - NEXT_PUBLIC_PAYMENT_API_URL=https://green-cart-payment-service-574911690185.us-central1.run.app"
echo "   - NEXT_PUBLIC_NOTIFICATION_API_URL=https://green-cart-notification-service-574911690185.us-central1.run.app"
echo "3. Update backend CORS in Cloud Run for each service"
