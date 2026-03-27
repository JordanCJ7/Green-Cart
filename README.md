# Green-Cart

## CTSE 2026 Microservices E-Commerce Platform

Green-Cart is a university assignment prototype for **Current Trends in Software Engineering (CTSE)** at **SLIIT**. It demonstrates a secure, microservice-based architecture with independent deployment, containerization, and CI/CD automation.

## Scope

- Architecture: microservices with clear service boundaries
- Delivery model: independently deployable services
- DevOps: GitHub Actions-based CI/CD
- DevSecOps: SAST scanning and IAM least-privilege principles
- Cloud target: GCP-first deployment path (portable to AWS/Azure)

## Services

- `authentication/`: user registration, login, token validation
- `inventory/`: product CRUD (add/update/delete/list/get by id) and stock operations
- `payment/`: payment initiation and transaction handling
- `notification/`: event notifications (email/SMS/push)
- `frontend/`: Next.js storefront UI for customer-facing flows

Each service contains its own `Dockerfile` and `api-docs/` so it can be built and deployed independently. CI workflows are centralized under the repository root `.github/workflows/`.

## Shared Assets

- `shared/architecture/`: architecture diagrams
- `shared/docs/`: shared technical and project documentation

## Repository Layout

```text
Green-Cart/
|-- .github/
|   \-- workflows/
|-- authentication/
|-- inventory/
|-- payment/
|-- notification/
|-- frontend/
|-- shared/
|   |-- architecture/
|   \-- docs/
|-- implementation_plan.md
|-- setup_microservices_structure.sh
\-- README.md
```

## Project Documents

- Implementation roadmap: `implementation_plan.md`
- Shared architecture output location: `shared/architecture/`
- Shared report notes and cross-service docs: `shared/docs/`

## Quick Start

1. Clone the repository.
2. Use `frontend/.env.example` as a template and create `frontend/.env.local`.
3. Implement APIs and OpenAPI specs in each `api-docs/` folder.
4. Build and run each service using its own `Dockerfile`.
5. Run frontend locally with `npm --prefix frontend run dev`.
6. Enable CI/CD workflows and deploy services independently.

## Frontend Deployment (Vercel)

1. Import this repository into Vercel.
2. Set the Vercel project Root Directory to `frontend`.
3. Keep defaults from `frontend/vercel.json` for install/build/dev commands.
4. Configure the Vercel environment variable for the API gateway URL:
   - `NEXT_PUBLIC_API_GATEWAY_URL`
5. Deploy backend services to GCP Cloud Run and expose them through GCP API Gateway.

## API Gateway Deployment (GitHub Actions)
1. Define the API Gateway OpenAPI spec in `shared/api-docs/gateway-openapi.yaml` with correct backend URLs.
2. Set up the GitHub Actions workflow for API Gateway deployment in `.github/workflows/api-gateway-deploy.yml` with necessary repository variables and secrets for GCP authentication.
3. Trigger the workflow to deploy the API Gateway configuration to GCP. 

- Gateway OpenAPI contract: `shared/api-docs/gateway-openapi.yaml`
- Rollout guide: `shared/docs/api-gateway-rollout.md`
- Automated gateway deployment workflow: `.github/workflows/api-gateway-deploy.yml`

Set these repository variables for the workflow:
- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_API_GATEWAY_API_ID`
- `GCP_API_GATEWAY_ID`

Set these repository secrets for OIDC authentication:
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_DEPLOYER_SERVICE_ACCOUNT`
