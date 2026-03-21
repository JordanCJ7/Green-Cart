# Inventory Microservice - Quick Start (2 Minutes)

## 1. Install & Configure (30 seconds)

```bash
cd inventory
npm install
cp .env.example .env
```

**IMPORTANT**: The `.env` file is already configured with:
- MongoDB Atlas connection (same as auth service)
- JWT secrets (matching auth service)
- Correct port (8082)

## 2. Start Service (10 seconds)

```bash
npm run dev
```

✅ Service running on: **http://localhost:8082**

## 3. Verify (5 seconds)

```bash
curl http://localhost:8082/health
```

Expected: `{"status":"ok","service":"inventory"}`

## 4. Test API (1 minute)

### Get admin token first:

```bash
# Login to auth service (port 8081)
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@123"}'

# Save the accessToken
export TOKEN="paste-token-here"
```

### Create a category:

```bash
curl -X POST http://localhost:8082/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fruits",
    "slug": "fruits",
    "icon": "🍎"
  }'
```

### Create an inventory item:

```bash
# Replace CATEGORY_ID with ID from previous response
curl -X POST http://localhost:8082/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Organic Avocado (4 pack)",
    "sku": "GC-AVD-001",
    "category": "CATEGORY_ID_HERE",
    "price": 890,
    "stock": 25,
    "unit": "Pack of 4"
  }'
```

### Get all items (no auth needed):

```bash
curl http://localhost:8082/inventory
```

## 5. Frontend Integration (30 seconds)

The service is already configured to work with your frontend!

Just ensure `frontend/.env.local` has:
```env
NEXT_PUBLIC_INVENTORY_API_URL=http://localhost:8082
```

Use the provided client library:
```typescript
import { getInventoryItems, getCategories } from '@/lib/inventory-api';

// Get all items
const { items, pagination } = await getInventoryItems({
  inStock: true,
  page: 1,
  limit: 20
});

// Get categories
const { categories } = await getCategories();
```

## Done! 🎉

Your inventory service is running and ready to use.

## Common Commands

```bash
# Development mode (hot reload)
npm run dev

# Production build
npm run build
npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Docker
docker-compose up -d

# View logs
docker-compose logs -f inventory-service
```

## Quick API Reference

### Public Endpoints (No Auth)
- `GET /health` - Health check
- `GET /categories` - All categories
- `GET /inventory` - All items
- `GET /inventory/:id` - Item by ID
- `GET /inventory/sku/:sku` - Item by SKU

### Admin Endpoints (Requires Token)
- `POST /categories` - Create category
- `POST /inventory` - Create item
- `PATCH /inventory/:id/stock` - Update stock
- `GET /inventory/low-stock` - Low stock alerts

## Need Help?

1. **Setup issues?** → See `SETUP.md`
2. **API usage?** → See `API_EXAMPLES.md`
3. **Deployment?** → See `DEPLOYMENT.md`
4. **Full docs?** → See `README.md`

## Port Reference

- **Authentication**: 8081
- **Inventory**: 8082  ← You are here
- **Payment**: 8083
- **Notification**: 8084
- **Frontend**: 3000

---

**Status**: ✅ Fully Configured & Ready
**Database**: MongoDB Atlas (shared with auth)
**Authentication**: JWT (configured)
**Documentation**: Complete
