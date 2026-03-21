# Inventory Microservice - Setup Guide

## Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
cd inventory
npm install
```

### Step 2: Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

**CRITICAL**: Update JWT secrets to match your authentication service!

```env
JWT_ACCESS_SECRET=de588fe20781e422c067a2efa7ea675b094b1360b613581fdd024e67803c4e6b
JWT_REFRESH_SECRET=2c0a00165cef1213cc82d19186337578a56bf160f64b539ec4e2c6712567d639
```

Update MongoDB URI:

```env
MONGODB_URI=mongodb+srv://janitha:1218@cluster0.9v3utpm.mongodb.net/GreenCart-Inventory?appName=Cluster0
```

### Step 3: Start MongoDB (if using local)

```bash
# Using Docker
docker run -d -p 27017:27017 --name greencart-mongodb mongo:8.0

# Or use your existing MongoDB instance
```

### Step 4: Run the Service

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

### Step 5: Verify Service is Running

```bash
curl http://localhost:8082/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "inventory"
}
```

## Seed Initial Data

After starting the service, seed some categories and items:

### Create Categories

```bash
# Get admin token from authentication service first
export ADMIN_TOKEN="your-admin-jwt-token"

# Create Vegetables category
curl -X POST http://localhost:8082/categories \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vegetables",
    "description": "Fresh organic vegetables",
    "icon": "🥬",
    "slug": "vegetables"
  }'

# Create Fruits category
curl -X POST http://localhost:8082/categories \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fruits",
    "description": "Fresh seasonal fruits",
    "icon": "🍎",
    "slug": "fruits"
  }'

# Save the category IDs from responses for next step
```

### Create Inventory Items

```bash
# Replace CATEGORY_ID with actual ID from previous step
export CATEGORY_ID="your-category-id-here"

# Create Avocado item
curl -X POST http://localhost:8082/inventory \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Organic Avocado (4 pack)",
    "description": "Hand-picked from Badulla highlands",
    "sku": "GC-AVD-001",
    "category": "'$CATEGORY_ID'",
    "price": 890,
    "compareAtPrice": 1100,
    "stock": 25,
    "lowStockThreshold": 10,
    "unit": "Pack of 4",
    "weight": 500,
    "shelfLife": 7,
    "certifications": ["Organic", "Non-GMO"],
    "isActive": true
  }'
```

## Docker Setup

### Option 1: Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 2: Docker Build Only

```bash
# Build image
docker build -t greencart-inventory .

# Run container
docker run -d \
  -p 8082:8082 \
  --env-file .env \
  --name inventory-service \
  greencart-inventory
```

## Frontend Integration

### Update frontend environment

Add to `frontend/.env.local`:

```env
NEXT_PUBLIC_INVENTORY_API_URL=http://localhost:8082
```

### Update frontend API config

Edit `frontend/lib/api.ts`:

```typescript
export type ServiceName = "authentication" | "inventory" | "payment" | "notification";

export const serviceConfigs = [
  { name: "Authentication", key: "authentication" as const },
  { name: "Inventory", key: "inventory" as const },
  { name: "Payment", key: "payment" as const },
  { name: "Notification", key: "notification" as const }
];

export function getServiceBaseUrl(service: ServiceName): string | null {
  const serviceEnvMap: Record<ServiceName, string | undefined> = {
    authentication: process.env.NEXT_PUBLIC_AUTH_API_URL,
    inventory: process.env.NEXT_PUBLIC_INVENTORY_API_URL,
    payment: process.env.NEXT_PUBLIC_PAYMENT_API_URL,
    notification: process.env.NEXT_PUBLIC_NOTIFICATION_API_URL
  };
  // ... rest of function
}
```

### Create inventory API helpers

Create `frontend/lib/inventory-api.ts`:

```typescript
import { apiFetch } from './api';

export interface InventoryItem {
  _id: string;
  name: string;
  description?: string;
  sku: string;
  category: {
    _id: string;
    name: string;
    slug: string;
    icon?: string;
  };
  price: number;
  compareAtPrice?: number;
  stock: number;
  lowStockThreshold: number;
  unit: string;
  weight?: number;
  images?: string[];
  certifications?: string[];
  isActive: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getInventoryItems(filters?: {
  category?: string;
  inStock?: boolean;
  lowStock?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<InventoryItem>> {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.inStock) params.set('inStock', 'true');
  if (filters?.lowStock) params.set('lowStock', 'true');
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.limit) params.set('limit', filters.limit.toString());

  return apiFetch('inventory', `/inventory?${params.toString()}`);
}

export async function getItemById(id: string): Promise<{ item: InventoryItem }> {
  return apiFetch('inventory', `/inventory/${id}`);
}

export async function getCategories(): Promise<{ categories: Array<any>; count: number }> {
  return apiFetch('inventory', '/categories');
}

export async function checkAvailability(
  id: string,
  quantity: number
): Promise<{ available: boolean; currentStock: number }> {
  return apiFetch('inventory', `/inventory/${id}/availability?quantity=${quantity}`);
}

export async function bulkCheckAvailability(
  items: Array<{ id: string; quantity: number }>
): Promise<{ results: Array<any> }> {
  return apiFetch('inventory', '/inventory/bulk-check-availability', {
    method: 'POST',
    body: JSON.stringify({ items })
  });
}
```

## Testing the Integration

### Test Category Creation

```bash
# Should return 401 without token
curl -X POST http://localhost:8082/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "slug": "test"}'

# Should succeed with admin token
curl -X POST http://localhost:8082/categories \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Category", "slug": "test-category"}'
```

### Test Public Endpoints

```bash
# Get all categories (no auth required)
curl http://localhost:8082/categories

# Get all inventory items (no auth required)
curl http://localhost:8082/inventory

# Search items
curl "http://localhost:8082/inventory?search=avocado"

# Filter by category
curl "http://localhost:8082/inventory?category=CATEGORY_ID&inStock=true"
```

### Test Stock Management

```bash
# Update stock (requires admin token)
curl -X PATCH http://localhost:8082/inventory/ITEM_ID/stock \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 10,
    "type": "in",
    "reason": "Restock",
    "reference": "PO-001"
  }'

# Get transaction history (requires auth)
curl http://localhost:8082/inventory/ITEM_ID/transactions \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get low stock items (requires auth)
curl http://localhost:8082/inventory/low-stock \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Troubleshooting

### Issue: "Cannot connect to MongoDB"

**Solution**: Check MongoDB is running and connection string is correct

```bash
# Test connection
mongosh "mongodb://localhost:27017/greencart_inventory"

# If using MongoDB Atlas, verify:
# 1. IP whitelist includes your IP
# 2. Database user credentials are correct
# 3. Network access is configured
```

### Issue: "JWT token invalid"

**Solution**: Ensure JWT secrets match authentication service

1. Copy secrets from `authentication/.env`
2. Paste into `inventory/.env`
3. Restart inventory service

### Issue: "Port 8082 already in use"

**Solution**: Change port or kill existing process

```bash
# Find process
lsof -ti:8082

# Kill process
kill -9 $(lsof -ti:8082)

# Or change PORT in .env
PORT=8083
```

### Issue: "Category not found" when creating items

**Solution**: Create categories first

```bash
# List existing categories
curl http://localhost:8082/categories

# Create category if none exist (see "Seed Initial Data" section above)
```

## Next Steps

1. **Integrate with Order Service**: Use bulk availability check before order placement
2. **Set up monitoring**: Track low stock alerts
3. **Configure CI/CD**: Deploy to cloud
4. **Add frontend pages**: Create product listing and detail pages
5. **Implement caching**: Add Redis for frequently accessed data

## Production Checklist

- [ ] Environment variables configured in cloud platform
- [ ] MongoDB connection uses secure credentials
- [ ] JWT secrets are strong and match auth service
- [ ] CORS_ORIGINS includes production frontend URL
- [ ] Rate limiting configured appropriately
- [ ] Health check endpoint accessible
- [ ] Monitoring and logging set up
- [ ] Backup strategy for MongoDB
- [ ] SSL/TLS configured for MongoDB connection
- [ ] Container image built and pushed to registry
- [ ] IAM roles configured with least privilege
- [ ] API documentation shared with team

## Support

For issues or questions:
1. Check API documentation: `api-docs/openapi.yaml`
2. Review error responses for debugging
3. Check service logs: `docker-compose logs inventory-service`
4. Verify environment configuration
5. Test with provided curl examples

Happy coding!
