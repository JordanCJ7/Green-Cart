# Script to clean up the old API Gateway deployment
# Usage: .\scripts\delete-api-gateway.ps1

$PROJECT_ID = "green-cart-authentication"
$API_ID = "greencart-api"
$REGION = "us-central1"

Write-Host "🗑️  Cleaning up API Gateway resources..." -ForegroundColor Yellow

Write-Host "1️⃣  Deleting API configs..." -ForegroundColor Cyan

# Get all configs for the API and delete them
try {
    $configs = gcloud api-gateway api-configs list `
        --api=$API_ID `
        --project=$PROJECT_ID `
        --format="value(name)" `
        --quiet
    
    if ($configs) {
        foreach ($config in $configs) {
            Write-Host "  Deleting config: $config"
            gcloud api-gateway api-configs delete $config `
                --api=$API_ID `
                --project=$PROJECT_ID `
                --quiet
        }
    } else {
        Write-Host "  No configs found"
    }
} catch {
    Write-Host "  Error listing/deleting configs: $_"
}

Write-Host "2️⃣  Deleting API..." -ForegroundColor Cyan
try {
    gcloud api-gateway apis delete $API_ID `
        --project=$PROJECT_ID `
        --quiet
    Write-Host "  API deleted successfully"
} catch {
    Write-Host "  Error deleting API: $_"
}

Write-Host "3️⃣  Deleting Gateway (if exists)..." -ForegroundColor Cyan
try {
    $GATEWAY_ID = "greencart-api"
    gcloud api-gateway gateways delete $GATEWAY_ID `
        --location=$REGION `
        --project=$PROJECT_ID `
        --quiet
    Write-Host "  Gateway deleted successfully"
} catch {
    Write-Host "  Gateway already deleted or doesn't exist"
}

Write-Host ""
Write-Host "✅ Cleanup complete! Old API Gateway resources removed." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify in GCP Console that resources are deleted"
Write-Host "2. Add these 4 env vars to Vercel:"
Write-Host "   - NEXT_PUBLIC_AUTH_API_URL=https://green-cart-auth-service-574911690185.us-central1.run.app"
Write-Host "   - NEXT_PUBLIC_INVENTORY_API_URL=https://green-cart-inventory-service-574911690185.us-central1.run.app"
Write-Host "   - NEXT_PUBLIC_PAYMENT_API_URL=https://green-cart-payment-service-574911690185.us-central1.run.app"
Write-Host "   - NEXT_PUBLIC_NOTIFICATION_API_URL=https://green-cart-notification-service-574911690185.us-central1.run.app"
Write-Host "3. Update backend CORS in Cloud Run for each service with your Vercel URL"
