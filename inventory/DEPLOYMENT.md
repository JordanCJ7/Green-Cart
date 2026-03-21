# Inventory Microservice - Deployment Guide

## Cloud Deployment Options

### Google Cloud Platform (GCP) - Cloud Run

#### Prerequisites
- GCP account with billing enabled
- gcloud CLI installed
- Docker installed

#### Step 1: Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

#### Step 2: Set Environment Variables

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export SERVICE_NAME="greencart-inventory"
```

#### Step 3: Create Secrets in Secret Manager

```bash
# Create MongoDB URI secret
echo -n "your-mongodb-uri" | \
  gcloud secrets create INVENTORY_MONGODB_URI --data-file=-

# Create JWT secrets
echo -n "your-jwt-access-secret" | \
  gcloud secrets create JWT_ACCESS_SECRET --data-file=-

echo -n "your-jwt-refresh-secret" | \
  gcloud secrets create JWT_REFRESH_SECRET --data-file=-
```

#### Step 4: Build and Push Container Image

```bash
# Navigate to inventory directory
cd inventory

# Build and submit to Container Registry
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}
```

#### Step 5: Deploy to Cloud Run

```bash
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8082 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars PORT=8082,NODE_ENV=production,CORS_ORIGINS=https://your-frontend.com,LOW_STOCK_THRESHOLD=10,DEFAULT_PAGE_SIZE=20,MAX_PAGE_SIZE=100 \
  --set-secrets MONGODB_URI=INVENTORY_MONGODB_URI:latest,JWT_ACCESS_SECRET=JWT_ACCESS_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest
```

#### Step 6: Get Service URL

```bash
gcloud run services describe ${SERVICE_NAME} \
  --region ${REGION} \
  --format 'value(status.url)'
```

### AWS - Elastic Container Service (ECS) with Fargate

#### Prerequisites
- AWS account with IAM permissions
- AWS CLI installed
- Docker installed

#### Step 1: Create ECR Repository

```bash
aws ecr create-repository --repository-name greencart-inventory
```

#### Step 2: Build and Push Image

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t greencart-inventory .

# Tag image
docker tag greencart-inventory:latest \
  ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/greencart-inventory:latest

# Push image
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/greencart-inventory:latest
```

#### Step 3: Create Task Definition

Create `task-definition.json`:

```json
{
  "family": "greencart-inventory",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "inventory",
      "image": "${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/greencart-inventory:latest",
      "portMappings": [
        {
          "containerPort": 8082,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "PORT", "value": "8082"},
        {"name": "NODE_ENV", "value": "production"},
        {"name": "CORS_ORIGINS", "value": "https://your-frontend.com"}
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:${AWS_ACCOUNT_ID}:secret:inventory/mongodb-uri"
        },
        {
          "name": "JWT_ACCESS_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:${AWS_ACCOUNT_ID}:secret:jwt-access-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/greencart-inventory",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Step 4: Create ECS Cluster and Service

```bash
# Create cluster
aws ecs create-cluster --cluster-name greencart-cluster

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster greencart-cluster \
  --service-name inventory-service \
  --task-definition greencart-inventory \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### Azure - Container Apps

#### Prerequisites
- Azure account with active subscription
- Azure CLI installed

#### Step 1: Create Resource Group

```bash
az group create --name greencart-rg --location eastus
```

#### Step 2: Create Container Registry

```bash
az acr create --resource-group greencart-rg \
  --name greencartregistry \
  --sku Basic

# Login to ACR
az acr login --name greencartregistry
```

#### Step 3: Build and Push Image

```bash
# Build and push
az acr build --registry greencartregistry \
  --image greencart-inventory:latest .
```

#### Step 4: Create Container App Environment

```bash
az containerapp env create \
  --name greencart-env \
  --resource-group greencart-rg \
  --location eastus
```

#### Step 5: Deploy Container App

```bash
az containerapp create \
  --name inventory-service \
  --resource-group greencart-rg \
  --environment greencart-env \
  --image greencartregistry.azurecr.io/greencart-inventory:latest \
  --target-port 8082 \
  --ingress external \
  --registry-server greencartregistry.azurecr.io \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 0 \
  --max-replicas 5 \
  --env-vars \
    PORT=8082 \
    NODE_ENV=production \
    CORS_ORIGINS=https://your-frontend.com \
  --secrets \
    mongodb-uri=your-mongodb-uri \
    jwt-access-secret=your-jwt-access-secret
```

## Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Set up database user
4. Configure network access (add cloud provider IPs)

### Step 2: Get Connection String

```
mongodb+srv://username:password@cluster.mongodb.net/GreenCart-Inventory?retryWrites=true&w=majority
```

### Step 3: Create Database and Collections

MongoDB will automatically create the database and collections on first write.

Initial collections:
- `categories` - Product categories
- `inventoryitems` - Inventory items
- `transactions` - Stock transaction history

## CI/CD Pipeline (GitHub Actions)

The repository already includes CI/CD workflows. To enable deployment:

### Step 1: Add GitHub Secrets

Go to repository Settings > Secrets and add:

For GCP:
- `GCP_PROJECT_ID`
- `GCP_SA_KEY` (Service Account JSON key)
- `GCP_REGION`

For AWS:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_ACCOUNT_ID`

For Azure:
- `AZURE_CREDENTIALS`
- `AZURE_REGISTRY_NAME`
- `AZURE_RESOURCE_GROUP`

### Step 2: Create Deployment Workflow

Create `.github/workflows/inventory-deploy.yml`:

```yaml
name: Deploy Inventory to GCP

on:
  push:
    branches:
      - main
    paths:
      - 'inventory/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Build and Deploy
        run: |
          cd inventory
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/inventory
          gcloud run deploy inventory \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/inventory \
            --platform managed \
            --region ${{ secrets.GCP_REGION }} \
            --allow-unauthenticated
```

## Monitoring and Logging

### GCP Cloud Logging

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}" \
  --limit 50 \
  --format json

# Set up log-based alerts
gcloud logging metrics create inventory_errors \
  --description="Inventory service errors" \
  --log-filter='resource.type="cloud_run_revision" AND severity>=ERROR'
```

### Health Monitoring

Set up uptime checks:

```bash
# Create health check
gcloud monitoring uptime create http inventory-health \
  --display-name="Inventory Service Health" \
  --resource-type=URL \
  --host=$(gcloud run services describe inventory --format='value(status.url)' | sed 's|https://||') \
  --path=/health
```

### Performance Monitoring

Monitor key metrics:
- Request latency (p50, p95, p99)
- Error rate
- Request rate
- Memory usage
- CPU usage

## Security Best Practices

### 1. Use Secrets Manager

Store sensitive data in cloud secrets:
- MongoDB connection strings
- JWT secrets
- API keys

### 2. Enable IAM Authentication

For GCP:
```bash
# Create service account for Cloud Run
gcloud iam service-accounts create inventory-service

# Grant minimal permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:inventory-service@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Configure Security Groups/Firewall

- Only allow HTTPS traffic (443)
- Restrict MongoDB access to cloud IPs
- Enable VPC/Private networking if available

### 4. Enable HTTPS Only

Ensure all endpoints use HTTPS in production:
```env
CORS_ORIGINS=https://your-frontend.com
```

### 5. Regular Security Updates

```bash
# Update dependencies
npm audit fix

# Rebuild and redeploy
docker build -t inventory:latest .
```

## Scaling Configuration

### Auto-scaling Parameters

GCP Cloud Run:
```bash
--min-instances 0 \
--max-instances 10 \
--cpu-throttling \
--concurrency 80
```

AWS ECS:
```json
{
  "serviceAutoscaling": {
    "minCapacity": 1,
    "maxCapacity": 10,
    "targetValue": 70,
    "scaleInCooldown": 300,
    "scaleOutCooldown": 60
  }
}
```

### Load Testing

Test with artillery or ab:

```bash
# Install artillery
npm install -g artillery

# Create load test config
cat > load-test.yml <<EOF
config:
  target: "https://your-inventory-url.com"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - get:
          url: "/inventory"
      - get:
          url: "/categories"
EOF

# Run test
artillery run load-test.yml
```

## Troubleshooting

### Common Issues

#### 1. Container Fails to Start

Check logs:
```bash
# GCP
gcloud run services logs read inventory

# AWS
aws logs tail /ecs/greencart-inventory --follow

# Azure
az containerapp logs show --name inventory-service
```

#### 2. MongoDB Connection Fails

- Verify connection string
- Check network access whitelist
- Ensure database user has permissions

#### 3. Health Check Fails

Test locally:
```bash
curl https://your-service-url.com/health
```

Should return:
```json
{"status":"ok","service":"inventory"}
```

## Cost Optimization

### GCP Cloud Run
- Use min-instances: 0 for dev environments
- Set appropriate memory/CPU limits
- Enable request-based scaling

### AWS ECS
- Use Fargate Spot for non-critical workloads
- Right-size task resources
- Enable cluster auto-scaling

### MongoDB Atlas
- Use M0 (free tier) for development
- Upgrade to M10+ for production
- Enable auto-scaling for storage

## Backup and Disaster Recovery

### MongoDB Backup

MongoDB Atlas provides automatic backups:
- Point-in-time recovery
- Continuous backups
- Automated snapshots

Manual backup:
```bash
mongodump --uri="mongodb+srv://..." --out=/backup/
```

### Service Rollback

GCP:
```bash
# List revisions
gcloud run revisions list --service inventory

# Rollback to previous
gcloud run services update-traffic inventory \
  --to-revisions PREVIOUS_REVISION=100
```

## Post-Deployment Checklist

- [ ] Service health check returns 200
- [ ] MongoDB connection successful
- [ ] JWT authentication working
- [ ] All endpoints accessible
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Secrets stored securely
- [ ] Logging configured
- [ ] Monitoring alerts set up
- [ ] Auto-scaling enabled
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Frontend updated with new URL
- [ ] Load testing completed

## Support and Maintenance

### Regular Tasks
- Monitor error rates daily
- Review performance metrics weekly
- Update dependencies monthly
- Security audit quarterly
- Backup verification quarterly

### Emergency Contacts
- On-call engineer: [Contact]
- DevOps team: [Contact]
- Database admin: [Contact]

---

For detailed API documentation, see `api-docs/openapi.yaml`
For setup instructions, see `SETUP.md`
For API examples, see `API_EXAMPLES.md`
