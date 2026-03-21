# Green-Cart Inventory Microservice

Production-ready inventory management microservice for the Green-Cart e-commerce platform.

## Features

### Core Functionality
- Complete CRUD operations for inventory items
- Stock management with transaction history
- Category-based product organization
- Advanced search and filtering
- Pagination support for large datasets
- Low stock alerts and monitoring
- SKU-based item lookup

### Advanced Features
- Real-time stock availability checking
- Bulk availability verification for order processing
- Comprehensive transaction logging
- Price comparison and cost tracking
- Product certification tracking
- Multi-image support per product
- Seller-based inventory segmentation

### Security
- JWT-based authentication
- Role-based authorization (Admin/User)
- Rate limiting protection
- Input validation and sanitization
- Secure error handling

### DevOps & Cloud-Ready
- Dockerized deployment
- Multi-stage build optimization
- Health check endpoints
- MongoDB with Mongoose ODM
- Environment-based configuration
- Production-grade error handling

## Tech Stack

- **Runtime**: Node.js 22.x
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Language**: TypeScript
- **Validation**: Zod
- **Authentication**: JWT (jsonwebtoken)
- **API Documentation**: OpenAPI 3.1

## Prerequisites

- Node.js 20.x or higher
- MongoDB 8.0 or higher
- npm or yarn

## Installation

### 1. Clone and Install Dependencies

```bash
cd inventory
npm install
```

### 2. Environment Setup

Create a `.env` file in the inventory directory:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
PORT=8082
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/greencart_inventory
JWT_ACCESS_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
CORS_ORIGINS=http://localhost:3000
LOW_STOCK_THRESHOLD=10
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

**Important**: Use the same JWT secrets as your authentication service!

### 3. Run Locally

#### Development Mode
```bash
npm run dev
```

#### Production Build
```bash
npm run build
npm start
```

## Docker Deployment

### Build and Run with Docker

```bash
docker build -t greencart-inventory .
docker run -p 8082:8082 --env-file .env greencart-inventory
```

### Docker Compose (Recommended)

```bash
docker-compose up -d
```

This will start:
- MongoDB container
- Inventory service container

## API Documentation

Full OpenAPI specification available at: `api-docs/openapi.yaml`

### Base URL
- **Local**: `http://localhost:8082`
- **Production**: `https://your-domain.com`

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "inventory"
}
```

## API Endpoints

### Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/categories` | Admin | Create category |
| GET | `/categories` | Public | Get all categories |
| GET | `/categories/:id` | Public | Get category by ID |
| GET | `/categories/slug/:slug` | Public | Get category by slug |
| PUT | `/categories/:id` | Admin | Update category |
| DELETE | `/categories/:id` | Admin | Delete category |

### Inventory Items

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/inventory` | Admin | Create inventory item |
| GET | `/inventory` | Public | Get all items (with filters) |
| GET | `/inventory/low-stock` | Auth | Get low stock items |
| GET | `/inventory/:id` | Public | Get item by ID |
| GET | `/inventory/sku/:sku` | Public | Get item by SKU |
| PUT | `/inventory/:id` | Admin | Update item |
| DELETE | `/inventory/:id` | Admin | Delete item |
| PATCH | `/inventory/:id/stock` | Admin | Update stock |
| GET | `/inventory/:id/transactions` | Auth | Get transaction history |
| GET | `/inventory/:id/availability` | Public | Check availability |
| POST | `/inventory/bulk-check-availability` | Public | Bulk check availability |

## Example Requests

### Create Category

```bash
curl -X POST http://localhost:8082/categories \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vegetables",
    "description": "Fresh organic vegetables",
    "icon": "🥬",
    "slug": "vegetables",
    "isActive": true
  }'
```

### Create Inventory Item

```bash
curl -X POST http://localhost:8082/inventory \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Organic Avocado (4 pack)",
    "description": "Hand-picked organic Hass avocados",
    "sku": "GC-AVD-001",
    "category": "CATEGORY_ID_HERE",
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

### Get All Items with Filters

```bash
curl "http://localhost:8082/inventory?page=1&limit=20&category=CATEGORY_ID&inStock=true&sort=-createdAt"
```

### Update Stock

```bash
curl -X PATCH http://localhost:8082/inventory/ITEM_ID/stock \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 10,
    "type": "in",
    "reason": "Restock from supplier",
    "reference": "PO-2026-001"
  }'
```

### Check Availability

```bash
curl "http://localhost:8082/inventory/ITEM_ID/availability?quantity=5"
```

### Bulk Check Availability

```bash
curl -X POST http://localhost:8082/inventory/bulk-check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"id": "ITEM_ID_1", "quantity": 3},
      {"id": "ITEM_ID_2", "quantity": 5}
    ]
  }'
```

## Query Filters

### Inventory Items Filters

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Sort fields (prefix with `-` for descending, e.g., `-createdAt,name`)
- `category` - Filter by category ID
- `isActive` - Filter by active status (true/false)
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `inStock` - Show only in-stock items (true/false)
- `lowStock` - Show only low stock items (true/false)
- `search` - Full-text search in name and description
- `sellerId` - Filter by seller ID

## Integration with Other Microservices

### Order Service Integration

When an order is placed, the Order service should:

1. **Check Availability** (before order confirmation):
```javascript
const response = await fetch('http://inventory:8082/inventory/bulk-check-availability', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [
      { id: 'item1', quantity: 2 },
      { id: 'item2', quantity: 1 }
    ]
  })
});
```

2. **Decrease Stock** (after order confirmation):
```javascript
await fetch(`http://inventory:8082/inventory/${itemId}/stock`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    quantity: orderQuantity,
    type: 'out',
    reason: 'Order placed',
    reference: orderId
  })
});
```

### Frontend Integration

Update your frontend `lib/api.ts` to include inventory endpoints:

```typescript
export async function getInventoryItems(filters?: {
  category?: string;
  inStock?: boolean;
  search?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.category) params.set('category', filters.category);
  if (filters?.inStock) params.set('inStock', 'true');
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page) params.set('page', filters.page.toString());

  return apiFetch('inventory', `/inventory?${params.toString()}`);
}

export async function getItemById(id: string) {
  return apiFetch('inventory', `/inventory/${id}`);
}

export async function checkAvailability(id: string, quantity: number) {
  return apiFetch('inventory', `/inventory/${id}/availability?quantity=${quantity}`);
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid request data
- `ITEM_NOT_FOUND` - Item not found
- `CATEGORY_NOT_FOUND` - Category not found
- `INSUFFICIENT_STOCK` - Not enough stock available
- `INVALID_ADJUSTMENT` - Stock adjustment would result in negative stock
- `RATE_LIMITED` - Too many requests

## Testing

```bash
npm run test
npm run test:coverage
```

## Code Quality

```bash
npm run lint
npm run typecheck
```

## Project Structure

```
inventory/
├── src/
│   ├── config/
│   │   └── env.ts              # Environment configuration
│   ├── controllers/
│   │   ├── category.controller.ts
│   │   └── inventory.controller.ts
│   ├── errors/
│   │   └── AppError.ts         # Custom error class
│   ├── middleware/
│   │   ├── authenticate.ts     # JWT authentication
│   │   ├── errorHandler.ts    # Global error handler
│   │   └── rateLimiter.ts     # Rate limiting
│   ├── models/
│   │   ├── Category.ts         # Category schema
│   │   ├── InventoryItem.ts   # Inventory item schema
│   │   └── Transaction.ts     # Transaction log schema
│   ├── routes/
│   │   ├── category.ts        # Category routes
│   │   └── inventory.ts       # Inventory routes
│   ├── services/
│   │   ├── category.service.ts
│   │   └── inventory.service.ts
│   ├── validation/
│   │   └── inventorySchemas.ts # Zod validation schemas
│   ├── app.ts                 # Express app setup
│   └── index.ts               # Entry point
├── api-docs/
│   └── openapi.yaml           # OpenAPI specification
├── .dockerignore
├── .env.example
├── .eslintrc.json
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
├── README.md
└── tsconfig.json
```

## Database Schema

### Category
```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  description: String,
  icon: String,
  slug: String (required, unique, indexed),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### InventoryItem
```javascript
{
  _id: ObjectId,
  name: String (required, indexed),
  description: String,
  sku: String (required, unique, indexed),
  category: ObjectId (ref: Category, required, indexed),
  price: Number (required, min: 0),
  compareAtPrice: Number (min: 0),
  costPrice: Number (min: 0),
  stock: Number (required, default: 0, min: 0),
  lowStockThreshold: Number (required, default: 10, min: 0),
  unit: String (required),
  weight: Number (min: 0),
  shelfLife: Number (min: 0),
  images: [String],
  certifications: [String],
  isActive: Boolean (default: true, indexed),
  sellerId: String (indexed),
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction
```javascript
{
  _id: ObjectId,
  item: ObjectId (ref: InventoryItem, required, indexed),
  type: String (enum: ['in', 'out', 'adjustment'], required),
  quantity: Number (required),
  previousStock: Number (required),
  newStock: Number (required),
  reason: String,
  reference: String (indexed),
  performedBy: String (indexed),
  notes: String,
  createdAt: Date
}
```

## Cloud Deployment

### GCP Cloud Run

1. **Build and push image**:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/greencart-inventory
```

2. **Deploy to Cloud Run**:
```bash
gcloud run deploy greencart-inventory \
  --image gcr.io/PROJECT_ID/greencart-inventory \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars PORT=8082,NODE_ENV=production \
  --set-secrets MONGODB_URI=MONGODB_URI:latest,JWT_ACCESS_SECRET=JWT_ACCESS_SECRET:latest
```

### AWS ECS / Azure Container Apps

Follow similar containerized deployment patterns using the provided Dockerfile.

## Monitoring

- Health endpoint: `GET /health`
- Monitor transaction logs for stock movement patterns
- Set up alerts for low-stock items
- Track API response times and error rates

## Security Best Practices

- Always use HTTPS in production
- Rotate JWT secrets regularly
- Use MongoDB authentication in production
- Implement API rate limiting (configured)
- Validate all user inputs (implemented)
- Use principle of least privilege for IAM roles
- Never commit `.env` files to version control
- Regularly update dependencies

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB is running
mongosh "mongodb://localhost:27017/greencart_inventory"

# Verify connection string in .env
```

### Authentication Errors
```bash
# Ensure JWT secrets match authentication service
# Check token format: Bearer <token>
```

### Port Already in Use
```bash
# Change PORT in .env or kill existing process
lsof -ti:8082 | xargs kill
```

## Contributing

1. Follow TypeScript strict mode
2. Add validation for all endpoints
3. Write tests for new features
4. Update OpenAPI documentation
5. Follow existing code structure

## License

MIT License - See LICENSE file

## Contact

For questions or support, contact the Green-Cart CTSE Team.
