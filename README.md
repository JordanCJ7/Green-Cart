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
2. Choose a runtime stack for each service.
3. Implement APIs and OpenAPI specs in each `api-docs/` folder.
4. Build and run each service using its own `Dockerfile`.
5. Enable CI/CD workflows and deploy services independently.
