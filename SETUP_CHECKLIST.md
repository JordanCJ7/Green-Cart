# Green-Cart System Setup Checklist

## ✅ Completed (Code/Infrastructure)

- [x] Frontend refactored to use direct service URLs
- [x] Backend CORS configured with simple defaults
- [x] All services pass TypeScript type checking
- [x] Frontend build passes without errors
- [x] Code committed and pushed to GitHub
- [x] Cleanup scripts created (`scripts/delete-api-gateway.*`)

## 📋 User Action Items (Required to Complete Setup)

### Step 1: Clean Up Old API Gateway (GCP Console)
- [ ] Go to GCP Console → API Gateway
- [ ] Navigate to **Gateways** tab
- [ ] Click `greencart-gateway` and **Delete** it
- [ ] Navigate to **APIs** tab
- [ ] Click `greencart-api`
- [ ] Navigate to **Configs** tab
- [ ] Select config `greencart-config-...` and **Delete** it
- [ ] Delete the API `greencart-api` itself
- [ ] Verify all resources are deleted

### Step 2: Configure Vercel Environment Variables
Add these 4 variables to your **Vercel Project Settings** → **Environment Variables**:

```
NEXT_PUBLIC_AUTH_API_URL
Value: https://green-cart-auth-service-574911690185.us-central1.run.app

NEXT_PUBLIC_INVENTORY_API_URL
Value: https://green-cart-inventory-service-574911690185.us-central1.run.app

NEXT_PUBLIC_PAYMENT_API_URL
Value: https://green-cart-payment-service-574911690185.us-central1.run.app

NEXT_PUBLIC_NOTIFICATION_API_URL
Value: https://green-cart-notification-service-574911690185.us-central1.run.app
```

- [ ] All 4 variables added to Vercel
- [ ] Trigger a manual redeployment in Vercel (or it will auto-deploy)

### Step 3: Update Backend CORS in Cloud Run
For **each of the 3 backend services** (auth, inventory, payment):

1. Go to **Cloud Run** → Click service name
2. Click **Edit & Deploy New Revision**
3. Under **Runtime settings** → **Environment variables**
4. Add/Update: `CORS_ORIGINS=https://[your-vercel-url].vercel.app`
   - Replace `[your-vercel-url]` with your actual Vercel domain
   - Example: `https://green-cart.vercel.app`
5. **Deploy** the revision

- [ ] Auth service CORS updated
- [ ] Inventory service CORS updated
- [ ] Payment service CORS updated

### Step 4: Test and Verify
- [ ] Visit your Vercel frontend URL
- [ ] Check if products load (API call test)
- [ ] Check browser console for any CORS or network errors
- [ ] Try logging in (auth service test)

## 🎯 Final Result

Once all steps above are completed:
✅ **Frontend** will call backend services directly via the URLs
✅ **No API Gateway** complexity
✅ **Simple configuration** - just environment variables
✅ **Fully functional** e-commerce platform

## 📝 Notes
- The old gateway deployment is no longer needed
- Direct service URLs are simpler and more maintainable
- CORS origins in backend must match your Vercel frontend URL
- All code changes are committed to `main` branch
