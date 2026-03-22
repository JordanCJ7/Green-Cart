# Implementation Plan: CTSE Cloud Computing Assignment (2026)

## 1. Objective

Design and implement a secure, microservice-based E-Commerce prototype using DevOps and cloud-native practices.

The system contains four independently deployable services:

1. Authentication
2. Inventory
3. Payment
4. Notification

## 2. Cloud Decision and Feasibility

### Is Google Cloud feasible?

Yes. Google Cloud is fully feasible for this assignment and supports all core requirements:

- Independent deployment per microservice
- CI/CD automation
- IAM-based access control
- Container hosting with public endpoints
- Logging, monitoring, and security scanning support

### GCP vs AWS vs Azure (short decision)

- GCP is usually the fastest path for a 7-day prototype using `Cloud Run`.
- AWS is strong when assignment language expects AWS-specific terms like Security Groups and ECS/App Runner.
- Azure is strong for Microsoft-heavy stacks and smooth integration with GitHub and .NET.

For this repository, the implementation baseline will be GCP-first.

## 3. Architecture and Tech Stack (GCP-First)

- Architecture: Microservices with independent deployability
- Communication: REST APIs between services
- Security: DevSecOps + IAM least privilege
- Hosting: Managed containers

### Service-to-Platform Mapping

- Runtime host: `Cloud Run` (one service per microservice)
- Image registry: `Artifact Registry`
- CI/CD: `GitHub Actions` (build, scan, push, deploy)
- Secrets: `Secret Manager`
- Identity and access: `IAM` + dedicated service accounts per service
- Networking: HTTPS endpoints + ingress controls
- Observability: `Cloud Logging` + `Cloud Monitoring`

## 4. Execution Phases (7-Day Sprint)

### Phase 1: Repository Scaffolding and Shared Desig

1. Finalize mono-repo structure with:
	- `authentication/`, `inventory/`, `payment/`, `notification/`
	- `Dockerfile`, `.github/workflows/`, `api-docs/`, `.gitkeep` in each service
	- `shared/architecture/` and `shared/docs/`
2. Produce initial high-level architecture diagram in `shared/architecture/`.
3. Define service boundaries, data ownership, and API dependency map.

### Phase 2: Service Development and API Contracts

1. Create baseline service apps and health endpoints (`/health`).
2. Define OpenAPI specs in each `api-docs/` directory.
3. Implement core prototype logic:
	- Authentication: login/register/token validation
	- Inventory: product CRUD (create, list, get by id, update, delete) and stock check/update
	- Payment: payment request and status flow
	- Notification: send notification event endpoint
4. Add service-specific Dockerfiles with production-ready entry commands.

### Phase 3: DevSecOps and CI/CD Pipeline

1. Add GitHub Actions per service for:
	- Build and test
	- Docker image build
	- SAST/security scan (SonarCloud or Snyk)
	- Push image to Artifact Registry
2. Enforce branch checks before merge to `main`.
3. Store cloud credentials and secrets in GitHub Secrets and GCP Secret Manager.

### Phase 4: Cloud Deployment and Security Hardening 

1. Deploy each service independently to Cloud Run.
2. Configure IAM:
	- Separate service account per microservice
	- Least privilege roles only
3. Configure secure networking and exposure:
	- Public ingress only for required endpoints
	- Restrict internal-only service calls where possible
4. Enable logging and basic uptime/latency monitoring.

### Phase 5: Integration, Validation, and Demo Preparation 

1. Verify inter-service communication flows end-to-end.
2. Run smoke tests for all public endpoints.
3. Finalize documentation:
	- Architecture diagram
	- Security decisions
	- CI/CD flow summary
	- Challenges and trade-offs
4. Conduct a timed 10-minute viva dry run.

## 5. Minimum Technical Acceptance Criteria

1. Each service builds into a separate container image.
2. Each service deploys independently without redeploying others.
3. CI pipeline runs on every PR/push and includes security scan.
4. OpenAPI contracts exist for all services.
5. Public demo URLs are available for required service endpoints.

## 6. Final Deliverables

1. Public code repository with source, Dockerfiles, workflows, and API specs
2. Project report with architecture diagram and security rationale
3. Working cloud-hosted prototype accessible for live viva
