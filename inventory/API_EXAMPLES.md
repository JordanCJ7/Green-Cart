# API Examples - Inventory Microservice

## Table of Contents
1. [Authentication Setup](#authentication-setup)
2. [Categories](#categories)
3. [Inventory Items](#inventory-items)
4. [Stock Management](#stock-management)
5. [Availability Checks](#availability-checks)
6. [Advanced Queries](#advanced-queries)

## Authentication Setup

All admin operations require a JWT token from the authentication service.

```bash
# Login as admin to get token
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@greencart.com",
    "password": "Admin@123"
  }'

# Save the accessToken
export TOKEN="your-access-token-here"
```

## Categories

### Create Category (Admin Only)

```bash
curl -X POST http://localhost:8082/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vegetables",
    "description": "Fresh organic vegetables",
    "icon": "🥬",
    "slug": "vegetables",
    "isActive": true
  }'
```

**Response:**
```json
{
  "category": {
    "_id": "60a7f8c4f1e4d5001f8e9b1a",
    "name": "Vegetables",
    "description": "Fresh organic vegetables",
    "icon": "🥬",
    "slug": "vegetables",
    "isActive": true,
    "createdAt": "2026-03-09T10:30:00.000Z",
    "updatedAt": "2026-03-09T10:30:00.000Z"
  }
}
```

### Get All Categories (Public)

```bash
curl http://localhost:8082/categories
```

### Get Active Categories Only

```bash
curl http://localhost:8082/categories?activeOnly=true
```

### Get Category by ID

```bash
curl http://localhost:8082/categories/60a7f8c4f1e4d5001f8e9b1a
```

### Get Category by Slug

```bash
curl http://localhost:8082/categories/slug/vegetables
```

### Update Category (Admin Only)

```bash
curl -X PUT http://localhost:8082/categories/60a7f8c4f1e4d5001f8e9b1a \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Premium organic vegetables",
    "isActive": true
  }'
```

### Delete Category (Admin Only)

```bash
curl -X DELETE http://localhost:8082/categories/60a7f8c4f1e4d5001f8e9b1a \
  -H "Authorization: Bearer $TOKEN"
```

## Inventory Items

### Create Item (Admin Only)

```bash
curl -X POST http://localhost:8082/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Organic Avocado (4 pack)",
    "description": "Hand-picked organic Hass avocados from Badulla highlands",
    "sku": "GC-AVD-001",
    "category": "60a7f8c4f1e4d5001f8e9b1a",
    "price": 890,
    "compareAtPrice": 1100,
    "costPrice": 600,
    "stock": 25,
    "lowStockThreshold": 10,
    "unit": "Pack of 4",
    "weight": 500,
    "shelfLife": 7,
    "images": ["https://example.com/avocado1.jpg"],
    "certifications": ["Organic", "Non-GMO"],
    "isActive": true
  }'
```

**Response:**
```json
{
  "item": {
    "_id": "60a7f9c4f1e4d5001f8e9b2b",
    "name": "Organic Avocado (4 pack)",
    "description": "Hand-picked organic Hass avocados from Badulla highlands",
    "sku": "GC-AVD-001",
    "category": {
      "_id": "60a7f8c4f1e4d5001f8e9b1a",
      "name": "Fruits",
      "slug": "fruits"
    },
    "price": 890,
    "compareAtPrice": 1100,
    "costPrice": 600,
    "stock": 25,
    "lowStockThreshold": 10,
    "unit": "Pack of 4",
    "weight": 500,
    "shelfLife": 7,
    "images": ["https://example.com/avocado1.jpg"],
    "certifications": ["Organic", "Non-GMO"],
    "isActive": true,
    "sellerId": "user-id-from-token",
    "createdAt": "2026-03-09T10:35:00.000Z",
    "updatedAt": "2026-03-09T10:35:00.000Z"
  }
}
```

### Get All Items (Public)

```bash
# Basic query
curl http://localhost:8082/inventory

# With pagination
curl "http://localhost:8082/inventory?page=1&limit=20"
```

**Response:**
```json
{
  "items": [
    {
      "_id": "60a7f9c4f1e4d5001f8e9b2b",
      "name": "Organic Avocado (4 pack)",
      "sku": "GC-AVD-001",
      "price": 890,
      "stock": 25,
      "category": { "name": "Fruits" }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Item by ID

```bash
curl http://localhost:8082/inventory/60a7f9c4f1e4d5001f8e9b2b
```

### Get Item by SKU

```bash
curl http://localhost:8082/inventory/sku/GC-AVD-001
```

### Update Item (Admin Only)

```bash
curl -X PUT http://localhost:8082/inventory/60a7f9c4f1e4d5001f8e9b2b \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 850,
    "compareAtPrice": 1050,
    "lowStockThreshold": 15
  }'
```

### Delete Item (Admin Only)

```bash
curl -X DELETE http://localhost:8082/inventory/60a7f9c4f1e4d5001f8e9b2b \
  -H "Authorization: Bearer $TOKEN"
```

## Stock Management

### Increase Stock (Admin Only)

```bash
curl -X PATCH http://localhost:8082/inventory/60a7f9c4f1e4d5001f8e9b2b/stock \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 20,
    "type": "in",
    "reason": "Restock from supplier",
    "reference": "PO-2026-001",
    "notes": "Fresh delivery from farm"
  }'
```

**Response:**
```json
{
  "item": {
    "_id": "60a7f9c4f1e4d5001f8e9b2b",
    "name": "Organic Avocado (4 pack)",
    "stock": 45,
    ...
  }
}
```

### Decrease Stock (Admin Only)

```bash
curl -X PATCH http://localhost:8082/inventory/60a7f9c4f1e4d5001f8e9b2b/stock \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5,
    "type": "out",
    "reason": "Order fulfillment",
    "reference": "ORDER-GC-0042"
  }'
```

### Stock Adjustment (Admin Only)

```bash
# Positive adjustment (increase)
curl -X PATCH http://localhost:8082/inventory/60a7f9c4f1e4d5001f8e9b2b/stock \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 3,
    "type": "adjustment",
    "reason": "Found additional stock during inventory count"
  }'

# Negative adjustment (decrease)
curl -X PATCH http://localhost:8082/inventory/60a7f9c4f1e4d5001f8e9b2b/stock \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": -2,
    "type": "adjustment",
    "reason": "Damaged items removed"
  }'
```

### Get Transaction History (Authenticated)

```bash
curl http://localhost:8082/inventory/60a7f9c4f1e4d5001f8e9b2b/transactions \
  -H "Authorization: Bearer $TOKEN"

# With pagination
curl "http://localhost:8082/inventory/60a7f9c4f1e4d5001f8e9b2b/transactions?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "transactions": [
    {
      "_id": "60a7fac4f1e4d5001f8e9b3c",
      "item": "60a7f9c4f1e4d5001f8e9b2b",
      "type": "in",
      "quantity": 20,
      "previousStock": 25,
      "newStock": 45,
      "reason": "Restock from supplier",
      "reference": "PO-2026-001",
      "performedBy": "user-id",
      "createdAt": "2026-03-09T11:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Low Stock Items (Authenticated)

```bash
# Default threshold (from env)
curl http://localhost:8082/inventory/low-stock \
  -H "Authorization: Bearer $TOKEN"

# Custom threshold
curl "http://localhost:8082/inventory/low-stock?threshold=15" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "items": [
    {
      "_id": "60a7f9c4f1e4d5001f8e9b2b",
      "name": "Organic Avocado (4 pack)",
      "stock": 8,
      "lowStockThreshold": 10
    }
  ],
  "count": 1
}
```

## Availability Checks

### Check Single Item Availability (Public)

```bash
curl "http://localhost:8082/inventory/60a7f9c4f1e4d5001f8e9b2b/availability?quantity=5"
```

**Response:**
```json
{
  "available": true,
  "currentStock": 45
}
```

### Bulk Availability Check (Public)

```bash
curl -X POST http://localhost:8082/inventory/bulk-check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": "60a7f9c4f1e4d5001f8e9b2b", "quantity": 2},
      {"id": "60a7f9c4f1e4d5001f8e9b3c", "quantity": 1},
      {"id": "60a7f9c4f1e4d5001f8e9b4d", "quantity": 3}
    ]
  }'
```

**Response:**
```json
{
  "results": [
    {
      "id": "60a7f9c4f1e4d5001f8e9b2b",
      "available": true,
      "currentStock": 45,
      "error": null
    },
    {
      "id": "60a7f9c4f1e4d5001f8e9b3c",
      "available": true,
      "currentStock": 20,
      "error": null
    },
    {
      "id": "60a7f9c4f1e4d5001f8e9b4d",
      "available": false,
      "currentStock": 2,
      "error": null
    }
  ]
}
```

## Advanced Queries

### Filter by Category

```bash
curl "http://localhost:8082/inventory?category=60a7f8c4f1e4d5001f8e9b1a"
```

### Filter by Price Range

```bash
curl "http://localhost:8082/inventory?minPrice=500&maxPrice=1000"
```

### Filter In-Stock Items

```bash
curl "http://localhost:8082/inventory?inStock=true"
```

### Filter Low Stock Items (Public)

```bash
curl "http://localhost:8082/inventory?lowStock=true"
```

### Search Items

```bash
curl "http://localhost:8082/inventory?search=avocado"
```

### Filter by Active Status

```bash
curl "http://localhost:8082/inventory?isActive=true"
```

### Filter by Seller

```bash
curl "http://localhost:8082/inventory?sellerId=merchant-123"
```

### Combined Filters with Sorting

```bash
curl "http://localhost:8082/inventory?category=60a7f8c4f1e4d5001f8e9b1a&inStock=true&minPrice=500&maxPrice=2000&sort=-createdAt,name&page=1&limit=20"
```

**Sort options:**
- `name` - Sort by name ascending
- `-name` - Sort by name descending
- `price` - Sort by price ascending
- `-price` - Sort by price descending
- `createdAt` - Sort by creation date ascending
- `-createdAt` - Sort by creation date descending (newest first)
- `stock` - Sort by stock level
- Multiple: `-createdAt,name` - Sort by date desc, then name asc

### Pagination Examples

```bash
# First page (20 items)
curl "http://localhost:8082/inventory?page=1&limit=20"

# Second page
curl "http://localhost:8082/inventory?page=2&limit=20"

# Large page size (50 items)
curl "http://localhost:8082/inventory?page=1&limit=50"

# Note: limit is capped at MAX_PAGE_SIZE (100 by default)
```

## Error Handling

### Invalid Request

```bash
curl -X POST http://localhost:8082/inventory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "price": -100
  }'
```

**Response (422):**
```json
{
  "error": "Price must be non-negative. SKU is required. Category is required.",
  "code": "VALIDATION_ERROR"
}
```

### Unauthorized Access

```bash
curl -X POST http://localhost:8082/inventory \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (401):**
```json
{
  "error": "Missing or malformed Authorization header.",
  "code": "UNAUTHORIZED"
}
```

### Insufficient Stock

```bash
curl -X PATCH http://localhost:8082/inventory/ITEM_ID/stock \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 100,
    "type": "out"
  }'
```

**Response (400):**
```json
{
  "error": "Insufficient stock.",
  "code": "INSUFFICIENT_STOCK"
}
```

### Item Not Found

```bash
curl http://localhost:8082/inventory/invalid-id
```

**Response (404):**
```json
{
  "error": "Item not found.",
  "code": "ITEM_NOT_FOUND"
}
```

## Integration Examples

### Order Service Integration

When processing an order:

```javascript
// 1. Check availability
const availabilityResponse = await fetch('http://inventory:8082/inventory/bulk-check-availability', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: orderItems.map(item => ({
      id: item.productId,
      quantity: item.quantity
    }))
  })
});

const { results } = await availabilityResponse.json();
const allAvailable = results.every(r => r.available);

if (!allAvailable) {
  throw new Error('Some items are out of stock');
}

// 2. Decrease stock for each item
for (const item of orderItems) {
  await fetch(`http://inventory:8082/inventory/${item.productId}/stock`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      quantity: item.quantity,
      type: 'out',
      reason: 'Order placed',
      reference: orderId
    })
  });
}
```

### Frontend Product Listing

```javascript
// Fetch products with filters
const response = await fetch(
  'http://localhost:8082/inventory?' + new URLSearchParams({
    category: selectedCategory,
    inStock: 'true',
    page: currentPage.toString(),
    limit: '20',
    sort: '-createdAt'
  })
);

const { items, pagination } = await response.json();

// Display items and pagination
```

## Rate Limiting

Default limits:
- 100 requests per 15 minutes per IP
- Configurable via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`

**Rate limit exceeded response (429):**
```json
{
  "error": "Too many requests from this IP. Please try again later.",
  "code": "RATE_LIMITED"
}
```

## Testing Checklist

- [ ] Categories CRUD operations
- [ ] Inventory items CRUD operations
- [ ] Stock increase/decrease/adjustment
- [ ] Transaction history logging
- [ ] Low stock alerts
- [ ] Availability checks (single and bulk)
- [ ] Search and filtering
- [ ] Pagination
- [ ] Authentication and authorization
- [ ] Error handling
- [ ] Rate limiting
