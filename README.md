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
- `inventory/`: product catalog and stock operations
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
4. Configure these Vercel environment variables to point at deployed backend URLs:
   - `NEXT_PUBLIC_AUTH_API_URL`
   - `NEXT_PUBLIC_INVENTORY_API_URL`
   - `NEXT_PUBLIC_PAYMENT_API_URL`
   - `NEXT_PUBLIC_NOTIFICATION_API_URL`
5. Deploy backend services separately to GCP Cloud Run from their own service folders.
