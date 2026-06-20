# Infrastructure, Deployment and DevOps

## Overview

This section specifies the infrastructure, deployment topology, and engineering operations
requirements for RoboCode.Africa. It defines how the platform is provisioned, delivered,
scaled, secured at the infrastructure layer, and kept available for students and teachers
across Africa. Coverage includes cloud region strategy, containerisation, Kubernetes
orchestration, environment management, CI/CD pipelines, infrastructure-as-code, release
strategies, configuration and secrets management, autoscaling, database high availability,
disaster recovery, CDN strategy, asset delivery, and automated per-tenant custom-domain
TLS onboarding.

All requirement identifiers in this section use the prefix **NFR-INF** (non-functional
infrastructure requirements). Operational-admin capabilities specified here (custom-domain
TLS onboarding) use the reserved sub-range **FR-ADM-300 through FR-ADM-399**, which is
disjoint from the School/Platform analytics range (FR-ADM-001 through FR-ADM-114) defined in
*Functional Requirements: Administration, Analytics and Reporting*. Security cross-references
use the **SR** prefix. MoSCoW priority notation is used throughout. References to other parts
of the System Specification Document are by section title and requirement ID.

---

## Cloud Architecture and Region Strategy

### Design Principles

RoboCode.Africa serves learners across sub-Saharan Africa as its primary market. Latency
and connectivity quality vary significantly by country and device. The cloud architecture
is therefore shaped by four non-negotiable constraints:

1. An Africa-region primary cluster (AWS `af-south-1` Cape Town or GCP `africa-south1`)
   to bring compute close to the majority user base.
2. A global CDN and edge network (Cloudflare or Amazon CloudFront) with African Points of
   Presence (PoPs) to cache and accelerate static assets and API responses.
3. Progressive loading and offline-first caching in the client to tolerate intermittent
   connectivity (see Accessibility, Internationalisation and Low-Bandwidth Design section).
4. A disaster-recovery region in a separate cloud geography (e.g., AWS `eu-west-1` or
   `us-east-1`) holding warm-standby services and database replicas.

### Region and PoP Layout

```
CLOUD REGION AND EDGE TOPOLOGY
══════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────┐
  │                   GLOBAL CDN / EDGE LAYER                       │
  │  Cloudflare / CloudFront                                        │
  │  PoPs: Johannesburg, Nairobi, Lagos, Cairo, London, Frankfurt   │
  │         New York, Singapore                                     │
  │  Caches: static assets, WASM bundles, public API responses,     │
  │           wokwi-elements, 3D model files, tenant branding CSDs  │
  └───────────────────────┬─────────────────────────────────────────┘
                          │ Cache miss → origin
                          ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │           PRIMARY CLUSTER — AWS af-south-1 (Cape Town)            │
  │                                                                    │
  │  ┌─────────────────────────────────────────────────────────────┐  │
  │  │  Kubernetes (EKS / GKE)  — Production Namespace             │  │
  │  │  API Gateway  │  Auth Service  │  Tenant Service            │  │
  │  │  Studio Service  │  LMS Service  │  Gamification Service    │  │
  │  │  Moderation Service  │  Notification Service                │  │
  │  │  Compile Microservice (WASM/AVR toolchain)                  │  │
  │  └─────────────────────────────────────────────────────────────┘  │
  │                                                                    │
  │  PostgreSQL (RDS / CloudSQL) — primary + read replicas            │
  │  Redis (ElastiCache / Memorystore) — cluster mode                 │
  │  S3-compatible object storage (S3 / GCS) — assets, projects       │
  └──────────────────────────────┬─────────────────────────────────────┘
                                 │ Async replication
                                 ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │         DR / WARM-STANDBY CLUSTER — AWS eu-west-1 (Ireland)       │
  │                                                                    │
  │  Kubernetes (EKS) — Staging / DR Namespace                        │
  │  PostgreSQL read replica (promoted on failover)                   │
  │  Redis replica (promoted on failover)                             │
  │  S3 cross-region replication (CRR) destination bucket             │
  └────────────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════════
```

### Region Selection Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-INF-001 | The production cluster **shall** be deployed in an Africa-region cloud zone (AWS `af-south-1` or GCP `africa-south1`) to achieve sub-100 ms API latency for the majority of South African, East African, and West African users. | Must | Measured via synthetic monitoring from Johannesburg, Nairobi, Lagos. |
| NFR-INF-002 | The CDN **shall** include PoPs in at least Johannesburg, Nairobi, and Lagos to serve cached static assets at under 30 ms round-trip for those metropolitan areas. | Must | Verified by p95 latency dashboards in Grafana. |
| NFR-INF-003 | A warm-standby cluster **shall** be maintained in a geographically separate region for disaster-recovery failover. | Must | See Disaster Recovery subsection. |
| NFR-INF-004 | The cloud provider **shall** be selected based on the availability of an Africa-region zone, pricing, and data-residency compliance for POPIA (South Africa) and Zimbabwe Cyber and Data Protection Act. | Must | Data containing South African residents must be stored in RSA or a compliant jurisdiction. |

---

## Containerisation and Kubernetes Orchestration

### Container Strategy

All backend services and the Next.js marketing/app shell are packaged as OCI-compliant
Docker images. Images are built on minimal base images (e.g., `node:20-alpine`) and
conform to a hardened baseline: no shell in production images where avoidable, non-root
user, read-only root filesystem, and pinned base image digests.

```
IMAGE BUILD PIPELINE (per service)
═══════════════════════════════════════════════════════════
  Source code
      │
      ▼
  Docker multi-stage build
  ├── Stage 1 (builder): install deps, compile TypeScript,
  │   run unit tests, generate OpenAPI schema
  └── Stage 2 (runtime): copy dist/, install prod deps only,
      set USER nonroot, EXPOSE port, CMD
      │
      ▼
  OCI image → pushed to ECR / Artifact Registry
  (tagged: git SHA + semantic version + environment label)
═══════════════════════════════════════════════════════════
```

### Kubernetes Cluster Design

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-INF-010 | All platform services **shall** be orchestrated by Kubernetes (EKS or GKE) with a minimum of three worker nodes across three availability zones in the primary region. | Must | AZ spread enforced via pod topology spread constraints. |
| NFR-INF-011 | A dedicated node pool with higher CPU/memory allocations **shall** be configured for the compile microservice, which handles AVR/WASM toolchain builds and may exhibit bursty CPU demand. | Should | Node pool: `c6i.xlarge` class or equivalent. |
| NFR-INF-012 | Kubernetes namespaces **shall** segregate environments: `prod`, `staging`, `dev`. Namespace-level NetworkPolicies **shall** deny all inter-namespace traffic by default. | Must | Acceptance: `kubectl get networkpolicy` shows deny-all default in each namespace. |
| NFR-INF-013 | Each microservice **shall** define resource `requests` and `limits` in its Kubernetes Deployment manifest. No container may run without resource constraints. | Must | Enforced via OPA/Gatekeeper admission webhook. |
| NFR-INF-014 | Kubernetes RBAC **shall** be configured with least-privilege service accounts. Pods **shall not** use the default service account. | Must | SR-SEC cross-reference: Security, Privacy and Child Safety section. |
| NFR-INF-015 | Pod security standards **shall** enforce the `restricted` policy profile for all application workloads. | Must | Enforced via Kubernetes Pod Security Admission. |
| NFR-INF-016 | A service mesh (Istio or Linkerd) **shall** be deployed for mutual TLS (mTLS) between all in-cluster services, distributed tracing injection, and traffic management (retries, circuit breaking, timeouts). | Should | mTLS ensures no plain-text internal communication. |

### Kubernetes Manifest Conventions

All Kubernetes manifests are managed via Helm charts version-controlled alongside
application source code. Chart values files are environment-specific (`values-dev.yaml`,
`values-staging.yaml`, `values-prod.yaml`) and injected at deployment time. No
environment-specific configuration is baked into images.

---

## Environment Management

Three named environments are maintained. Each environment is isolated at the Kubernetes
namespace, database schema/instance, and DNS subdomain level.

```
ENVIRONMENT TOPOLOGY
══════════════════════════════════════════════════════════════════════

Environment   Cluster           Domain                  DB Instance
──────────────────────────────────────────────────────────────────────
dev           Local / CI        dev.robocode.africa     Shared dev
              (Minikube /       (branch-specific        RDS instance
              kind)             preview URLs)           (separate DB)
──────────────────────────────────────────────────────────────────────
staging       Primary cluster   staging.robocode.africa Staging RDS
              (af-south-1)      staging.<slug>.          (separate DB,
              staging namespace robocode.africa          prod-like data)
──────────────────────────────────────────────────────────────────────
prod          Primary cluster   robocode.africa          Production RDS
              (af-south-1)      <slug>.robocode.africa   primary +
              prod namespace    custom domains            replicas
══════════════════════════════════════════════════════════════════════
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-INF-020 | Production, staging, and development environments **shall** be logically isolated with separate databases, Redis clusters, S3 buckets, and DNS entries. | Must | Infrastructure state stored per-environment in Terraform workspaces. |
| NFR-INF-021 | Pull-request (PR) environments **shall** be automatically provisioned on PR open and destroyed on PR merge/close. They **shall** run on the dev cluster with a unique URL (`pr-<n>.dev.robocode.africa`). | Should | Supports rapid iteration and QA without impacting staging. |
| NFR-INF-022 | Staging **shall** be a production-equivalent environment (same Docker image tags, same Kubernetes config, production-like anonymised data) used for pre-release integration testing and load testing. | Must | Data anonymisation pipeline verified before every staging refresh. |
| NFR-INF-023 | No production credentials, keys, or PII **shall** be present in dev or staging environments. | Must | Enforced by separate Vault namespaces and automated secret scanning. |

---

## CI/CD Pipeline

### Pipeline Architecture

The CI/CD pipeline runs on GitHub Actions. Every code change to a service triggers a
fully automated build, test, security scan, and deploy sequence. Deployments to production
require a successful staging deployment and a manual approval gate.

```
CI/CD PIPELINE — STAGE-BY-STAGE VIEW
══════════════════════════════════════════════════════════════════════

  Developer push / PR open
         │
         ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  CI: Code Quality and Security                               │
  │  ├── Lint (ESLint, Prettier check)                           │
  │  ├── Type check (tsc --noEmit)                               │
  │  ├── Unit tests (Jest, Vitest) with coverage gate (≥80%)     │
  │  ├── Integration tests (service + DB, Testcontainers)        │
  │  ├── SAST scan (CodeQL / Semgrep)                            │
  │  ├── Dependency audit (npm audit, Snyk / OWASP Dep-Check)    │
  │  └── Secret scan (Gitleaks / Trufflehog)                     │
  └────────────────────────┬─────────────────────────────────────┘
                           │ All gates pass
                           ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  Build and Publish                                           │
  │  ├── Docker multi-stage build (per changed service)         │
  │  ├── Image vulnerability scan (Trivy / Grype)               │
  │  ├── Push OCI image to ECR (tagged: git-SHA + env label)    │
  │  └── Generate SBOM (CycloneDX)                              │
  └────────────────────────┬─────────────────────────────────────┘
                           │
                           ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  Deploy to Dev / PR Environment                              │
  │  ├── helm upgrade --install (dev namespace)                  │
  │  ├── Smoke tests (k6 / Playwright E2E subset)               │
  │  └── Preview URL posted to PR as GitHub comment             │
  └────────────────────────┬─────────────────────────────────────┘
                           │ Merge to main branch
                           ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  Deploy to Staging                                           │
  │  ├── helm upgrade --install (staging namespace)              │
  │  ├── Full E2E test suite (Playwright)                        │
  │  ├── Load test (k6, target: 500 concurrent users)           │
  │  ├── DAST scan (OWASP ZAP)                                  │
  │  └── Release candidate tagged in ECR                        │
  └────────────────────────┬─────────────────────────────────────┘
                           │ Manual approval gate
                           │ (Tech Lead + Release Manager)
                           ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  Deploy to Production (blue-green / canary)                  │
  │  ├── Helm upgrade with canary weight (10% → 50% → 100%)     │
  │  ├── Automated canary analysis (error rate, p99 latency)     │
  │  ├── Argo Rollouts or Flagger controller manages promotion   │
  │  ├── Automatic rollback on SLO breach                        │
  │  └── Deployment event posted to observability dashboard      │
  └──────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════════
```

### CI/CD Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-INF-030 | The CI pipeline **shall** execute all lint, type-check, unit, and integration tests on every push to any branch. A red pipeline **shall** block merge to `main`. | Must | GitHub branch protection rules with required status checks. |
| NFR-INF-031 | The pipeline **shall** perform SAST (static application security testing) on every PR using CodeQL or Semgrep, and **shall** block merge on any high-severity finding. | Must | SR cross-reference: Security, Privacy and Child Safety section. |
| NFR-INF-032 | Every built container image **shall** be scanned for known CVEs (Trivy or equivalent). Images with critical CVEs **shall** not be deployed to staging or production. | Must | CVE gate: CRITICAL = 0, HIGH ≤ 3 with approved exceptions. |
| NFR-INF-033 | A software bill of materials (SBOM) in CycloneDX format **shall** be generated and stored in the artifact registry for each production image. | Should | Supports supply-chain auditability. |
| NFR-INF-034 | Secret scanning (Gitleaks or Trufflehog) **shall** run as a pre-commit hook and as a CI gate. Any detected secret **shall** halt the pipeline and alert the security team. | Must | Zero-tolerance policy for secrets in SCM. |
| NFR-INF-035 | Deployment to production **shall** require a named manual approval from a Tech Lead or Release Manager, recorded in the GitHub Actions audit log. | Must | Separates automated CI from human-authorised CD. |
| NFR-INF-036 | The total elapsed time from `git push` to a deployed staging environment **shall** not exceed 20 minutes under normal load. | Should | Measured as a CI KPI in the observability dashboard. |

---

## Infrastructure as Code (IaC)

All cloud resources are defined, versioned, and applied through Terraform. No cloud
resources may be created manually (via console) in staging or production; all changes
must pass through the IaC pipeline.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-INF-040 | All cloud infrastructure (VPCs, subnets, security groups, EKS clusters, RDS instances, ElastiCache, S3 buckets, IAM roles, Route 53 records, ACM certificates) **shall** be defined in Terraform HCL modules under version control. | Must | Repository: `robocode-infra` (separate from application code). |
| NFR-INF-041 | Terraform state **shall** be stored remotely in an S3 backend (or GCS bucket) with DynamoDB (or Cloud Spanner) state locking and AES-256 server-side encryption. | Must | State bucket access restricted to CI service account and senior engineers. |
| NFR-INF-042 | Terraform workspaces **shall** be used to manage per-environment state isolation (`dev`, `staging`, `prod`). | Must | `terraform workspace select prod` before any production apply. |
| NFR-INF-043 | `terraform plan` output **shall** be posted as a PR comment for every IaC change. Production applies **shall** require manual approval in the GitHub Actions workflow. | Must | Prevents surprise infrastructure changes. |
| NFR-INF-044 | Drift detection **shall** run on a nightly schedule: `terraform plan` in read-only mode against production and **shall** alert the on-call engineer if detected drift exceeds an approved baseline. | Should | Catches out-of-band changes. |

---

## Blue-Green and Canary Release Strategy

Production deployments use a canary-first strategy managed by Argo Rollouts or the
Flagger operator. Blue-green promotion is available for critical breaking changes that
cannot be canaried.

```
CANARY RELEASE FLOW (single service example)
══════════════════════════════════════════════════════════════════════

  prod namespace (current: blue = v1.5.0)
  ┌───────────────────────────────────────────┐
  │  Service (stable)                         │
  │  └─> Pod set: v1.5.0 (100% traffic)       │
  └───────────────────────────────────────────┘
         │  Deploy v1.6.0 canary
         ▼
  ┌───────────────────────────────────────────┐
  │  Argo Rollouts analysis                   │
  │  Step 1: canary 10% weight                │
  │    analysis: error rate < 0.5%,           │
  │             p99 latency < 300 ms          │
  │    wait: 5 min                            │
  │  Step 2: canary 50% weight                │
  │    analysis: same metrics, 10 min        │
  │  Step 3: promote → 100% (v1.6.0 stable)  │
  │           retire v1.5.0 pods              │
  └───────────────────────────────────────────┘
         │  Metric breach at any step
         ▼  → automatic rollback to v1.5.0
══════════════════════════════════════════════════════════════════════
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-INF-050 | All production service deployments **shall** use a canary release strategy with a minimum of two weighted steps (10% and 50%) before full promotion. | Must | Argo Rollouts or Flagger; canary analysis based on Prometheus metrics. |
| NFR-INF-051 | Automated rollback **shall** be triggered if the canary error rate exceeds 0.5% or p99 latency exceeds the service SLO by 20% during any analysis window. | Must | SLOs defined per service in the Observability section. |
| NFR-INF-052 | A full blue-green deployment path (two complete parallel environments, instant DNS/LB cut-over) **shall** be available as an alternative release mode for database-schema migrations or other breaking changes requiring atomic cut-over. | Should | Activated manually by Release Manager. |
| NFR-INF-053 | Rollback to the previous stable version **shall** complete within 5 minutes of the rollback decision, whether triggered automatically or manually. | Must | Verified in staging environment load-test drills. |

---

## Configuration and Secrets Management

Configuration and secrets are strictly separated. Application configuration (non-secret)
is stored in Kubernetes ConfigMaps and Helm values. Secrets are stored in HashiCorp Vault
(self-hosted on Kubernetes, or HCP Vault) and injected into pods via the Vault Agent
Sidecar Injector or the Vault Secrets Operator.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-INF-060 | No secret (database password, JWT signing key, API key, SMTP credential, OAuth client secret) **shall** be stored in source control, Helm values files, Docker images, or environment-variable literals in Kubernetes manifests. | Must | Gitleaks CI gate + OPA admission webhook denying manifests with plaintext env secrets. |
| NFR-INF-061 | All secrets **shall** be stored in HashiCorp Vault with per-environment namespaces. Vault access **shall** use Kubernetes service-account-bound dynamic credentials with short TTLs (≤24 h for DB credentials, ≤1 h for transient tokens). | Must | Dynamic DB credentials via Vault Database secrets engine. |
| NFR-INF-062 | Environment-specific configuration (feature flags, third-party endpoint URLs, log levels) **shall** be managed as Kubernetes ConfigMaps or via a central feature-flag service, not hardcoded in images. | Must | Allows config changes without image rebuild. |
| NFR-INF-063 | Tenant-specific secrets (custom-domain TLS private keys, school SSO client secrets) **shall** be stored in Vault under a per-tenant path (`secret/tenants/<tenant-id>/...`) with access policies scoped to the Tenant Service only. | Must | See Multi-Tenancy section (FR-TEN). |
| NFR-INF-064 | All Vault access **shall** be audit-logged. Access logs **shall** be shipped to the centralised logging stack (see Observability, Logging, Monitoring and Support section). | Must | Satisfies audit requirements for child-data handling. |

---

## Autoscaling

RoboCode Studio simulation runs entirely on the client; the backend serves API requests,
WebSocket sessions, and compilation jobs. Load profiles are uneven — spikes occur at
school lesson start times and competition events.

```
AUTOSCALING TIERS
══════════════════════════════════════════════════════════════════════

  Component               Scaling Mechanism        Metric Trigger
  ──────────────────────────────────────────────────────────────────
  API Gateway             HPA                      CPU ≥ 60%,
                                                   RPS > 1000/pod
  Auth Service            HPA                      CPU ≥ 60%
  Compile Microservice    HPA + KEDA               Queue depth
                          (queue-based)            (Redis Stream)
  WebSocket Gateway       HPA                      Active connections
                          + connection shedding    > 2000/pod
  LMS / Studio Service    HPA                      CPU ≥ 60%
  PostgreSQL read         RDS Auto-scaling          Storage + IOPS
  replicas
  Redis                   ElastiCache cluster      Memory ≥ 75%
                          shard auto-scaling
  CDN (Cloudflare)        Automatic (managed)      N/A
  ──────────────────────────────────────────────────────────────────

  Cluster-level:  Kubernetes Cluster Autoscaler (or Karpenter)
                  adds/removes worker nodes in response to pending pods.
  Minimum replicas in prod: 2 per service (AZ redundancy)
  Maximum replicas (API gateway): 20 pods
══════════════════════════════════════════════════════════════════════
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-INF-070 | All stateless backend services **shall** be configured with Horizontal Pod Autoscaler (HPA) policies targeting CPU utilisation ≤ 60% and/or custom metrics where appropriate. | Must | HPA manifest committed per service. |
| NFR-INF-071 | The compile microservice **shall** use KEDA (Kubernetes Event-Driven Autoscaling) to scale based on the Redis Stream queue depth for pending compilation jobs. | Should | Prevents unbounded queue growth during lesson bursts. |
| NFR-INF-072 | The Kubernetes Cluster Autoscaler (or Karpenter) **shall** be configured to add worker nodes when pods remain in `Pending` state for more than 2 minutes and to remove underutilised nodes (CPU < 20% for 10 min). | Must | Node group min: 3, max: 20 in production. |
| NFR-INF-073 | Scale-out **shall** complete within 90 seconds from metric threshold breach for pod-level HPA, and within 5 minutes for cluster-level node provisioning. | Must | Validated in load-test exercises. |
| NFR-INF-074 | Scale-in **shall** use a conservative cooldown period (10 min after last scale event) to avoid oscillation during lesson periods. | Should | Configurable per service. |

---

## Database High Availability, Replicas, and Backups

### PostgreSQL HA Design

```
POSTGRESQL HIGH-AVAILABILITY TOPOLOGY
══════════════════════════════════════════════════════════════════════

  af-south-1 (primary region)
  ┌──────────────────────────────────────────────────────┐
  │  RDS PostgreSQL Multi-AZ (or Cloud SQL HA)           │
  │                                                      │
  │   AZ-a: Primary instance  ←→  AZ-b: Standby         │
  │   (sync replication — automatic failover < 60 s)     │
  │                                                      │
  │   AZ-c: Read replica (async)                         │
  │   └── Used for analytics queries and reports         │
  └──────────────────────────────────────────────────────┘
           │ Async cross-region replication
           ▼
  eu-west-1 (DR region)
  ┌──────────────────────────────────────────────────────┐
  │  RDS Read Replica (promotable)                       │
  │  RPO: ≤ 5 minutes of data lag                        │
  │  Promoted to primary on regional failover            │
  └──────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════════
```

### Database Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-INF-080 | PostgreSQL **shall** be deployed in Multi-AZ configuration in the primary region with synchronous standby and automatic failover completing within 60 seconds. | Must | Verified by simulated AZ failure in staging. |
| NFR-INF-081 | At least one read replica **shall** be deployed in the primary region to serve analytical and reporting queries, isolating read traffic from the primary write instance. | Must | Application services that perform heavy read queries directed to replica endpoint. |
| NFR-INF-082 | Automated daily snapshots **shall** be retained for 30 days. Continuous WAL archiving (point-in-time recovery, PITR) **shall** be enabled with a retention window of 7 days. | Must | RTO for data restore: ≤ 4 h; RPO: ≤ 5 min. |
| NFR-INF-083 | Database backups **shall** be encrypted at rest (AES-256) and stored in a separate S3 bucket with cross-region replication to the DR region. | Must | Backup bucket access restricted to the database service role only. |
| NFR-INF-084 | Database restore drills **shall** be executed quarterly in the staging environment, verifying that a full restore from backup completes within the RTO target and that data integrity is confirmed by automated checksums. | Must | Results documented and signed off by the Engineering Lead. |
| NFR-INF-085 | PostgreSQL Row-Level Security (RLS) policies **shall** be applied to all tenant-sensitive tables, enforced at the database engine level regardless of application-layer filtering. | Must | Cross-reference: Multi-Tenancy section (FR-TEN) and Data Architecture section. |

### Redis HA

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-INF-086 | Redis **shall** be deployed in cluster mode with a minimum of three shards and one replica per shard in the primary region. | Must | ElastiCache Redis Cluster or Upstash Redis. |
| NFR-INF-087 | Redis persistence (RDB snapshots + AOF) **shall** be enabled for the session store and leaderboard data. Leaderboard data loss in excess of 1 minute is unacceptable. | Must | AOF fsync: `everysec`. |

---

## Disaster Recovery

### DR Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Recovery Point Objective (RPO) | ≤ 5 minutes | Maximum data loss: 5 min of WAL not yet replicated to DR region. |
| Recovery Time Objective (RTO) | ≤ 4 hours | Time from declared disaster to full production serving. |
| DR test frequency | Quarterly | Full failover drill in staging; partial simulation in prod (read-only validation). |
| Notification to users | ≤ 15 minutes | Automated status-page update and email to School Admins on major incident. |

### DR Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-INF-090 | A documented disaster-recovery runbook **shall** exist and be version-controlled, covering: regional failover, database promotion, DNS re-pointing, and comms to tenants. | Must | Runbook reviewed and tested quarterly. |
| NFR-INF-091 | The DR cluster **shall** run a warm-standby of all critical services with the same Docker image tags as production, kept synchronised via Helm GitOps (Argo CD). | Must | Allows RTO to be met without cold-start build times. |
| NFR-INF-092 | DNS failover (Route 53 health checks or Cloudflare failover routing) **shall** automatically re-route traffic to the DR region within 5 minutes of primary-region health checks failing. | Must | DNS TTL on primary: ≤ 60 s for critical A/CNAME records. |
| NFR-INF-093 | S3 object storage **shall** have Cross-Region Replication (CRR) enabled, replicating to the DR region bucket with versioning and delete-marker replication. | Must | Ensures project files, assets, and 3D models are available post-failover. |
| NFR-INF-094 | After failover to the DR region, RoboCode Studio's simulation capabilities **shall** remain fully functional (client-side RSE is unaffected; compile microservice must be available in DR). | Must | Compile microservice must be included in warm standby. |

---

## CDN and Caching Strategy

### CDN Architecture

Static assets, WASM bundles, 3D model files, wokwi-elements packages, and tenant design
tokens are the highest-volume content types. These are cache-first and served from CDN
edge nodes. Dynamic API responses follow a cache-aside pattern with short TTLs.

```
CDN CACHING TIERS
══════════════════════════════════════════════════════════════════════

  Content Type                   Cache Location      TTL         Notes
  ────────────────────────────────────────────────────────────────────
  Studio SPA JS/CSS bundles      CDN edge            1 year      Content-hash filenames
  WASM toolchain binary          CDN edge            1 year      Versioned path
  wokwi-elements JS/CSS          CDN edge            1 year      Pinned version in URL
  3D model files (.glb/.gltf)    CDN edge            30 days     CacheControl: immutable
  Tenant branding CSS tokens     CDN edge            1 hour      Invalidated on brand update
  Component catalogue JSON       CDN edge            24 hours    Invalidated on lib release
  Avatar / profile images        CDN edge (S3 origin) 7 days     CDN + browser cache
  Public project thumbnails      CDN edge (S3 origin) 1 day      On-demand generation
  GraphQL POST responses         Redis (L2)          30–300 s    Per-query; vary by user/tenant
  REST GET responses (public)    CDN edge            60 s        Vary: Accept-Encoding
  Real-time WebSocket traffic    Not cached          N/A         Socket.IO, bypasses CDN
  ────────────────────────────────────────────────────────────────────
  Browser service worker:        IndexedDB /         Session +   Offline-first for Studio
  (client-side, L3 cache)        Cache API           background  assets and last project
  ────────────────────────────────────────────────────────────────────
══════════════════════════════════════════════════════════════════════
```

### CDN Requirements

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-INF-100 | All static assets **shall** be served through a CDN (Cloudflare or CloudFront) with at least one African PoP. Cache-hit ratio for static assets **shall** exceed 95% in steady state. | Must | Measured via CDN analytics; cache miss rate alerted if > 5%. |
| NFR-INF-101 | Content-addressable asset filenames (content-hash in filename) **shall** be used for all bundled JS, CSS, and WASM files, enabling immutable CDN caching with `Cache-Control: max-age=31536000, immutable`. | Must | Applied by Next.js/webpack build pipeline by default. |
| NFR-INF-102 | CDN cache invalidation **shall** be automatable via the CI/CD pipeline on deployment. Full invalidation **shall** complete within 5 minutes globally. | Must | Cloudflare Cache Purge API or CloudFront invalidation batch. |
| NFR-INF-103 | The CDN **shall** terminate TLS at the edge (TLS 1.2 minimum, TLS 1.3 preferred) with HSTS headers (`max-age=31536000; includeSubDomains; preload`). | Must | Security requirement; cross-reference Security section (SR). |
| NFR-INF-104 | CDN origin requests to the backend **shall** use private origin-pull credentials (e.g., Cloudflare Origin CA certificate or CloudFront Origin Access Control) so that the origin is not publicly reachable. | Must | Prevents origin bypass attacks. |

### Asset Delivery

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-INF-110 | The initial JavaScript payload for RoboCode Studio **shall** be code-split such that the critical above-the-fold path (sign-in, dashboard) loads under 200 KB (gzip) over a 3G connection. | Must | Lighthouse/WebPageTest budget. See Accessibility section (NFR-A11Y). |
| NFR-INF-111 | 3D model files (.glb) for components **shall** be compressed with Draco mesh compression and delivered with Brotli/gzip content-encoding. | Should | Reduces asset size 60–80% vs uncompressed. |
| NFR-INF-112 | The Service Worker **shall** pre-cache core Studio assets on first load and serve them from the Cache API on subsequent visits, enabling the simulation canvas and editor to be functional while offline. | Should | See Accessibility and Low-Bandwidth section. |

---

## Automated Per-Tenant Custom-Domain TLS Onboarding

When a School Admin configures a custom domain (e.g., `code.exampleschool.ac.zw`), the
platform must automatically provision, validate, and renew a TLS certificate for that
domain without manual intervention. The process uses the ACME protocol (Let's Encrypt or
ZeroSSL) with HTTP-01 or DNS-01 challenge validation.

```
CUSTOM-DOMAIN TLS ONBOARDING FLOW
══════════════════════════════════════════════════════════════════════

  School Admin enters custom domain in Tenant Settings UI
         │
         ▼
  Tenant Service validates FQDN format, checks for conflicts
         │
         ▼
  Platform generates ACME DNS-01 challenge record value
  and displays to School Admin:
  ┌─────────────────────────────────────────────────────┐
  │ Add CNAME:  code.exampleschool.ac.zw               │
  │             → proxy.robocode.africa                │
  │ Add TXT:   _acme-challenge.code.exampleschool.ac.zw│
  │             → <challenge-token>                    │
  └─────────────────────────────────────────────────────┘
         │  School Admin adds DNS records at their registrar
         ▼
  Platform polls DNS propagation (15-min intervals, up to 48 h)
         │  DNS records confirmed
         ▼
  ACME client (cert-manager on Kubernetes) requests certificate
  from Let's Encrypt / ZeroSSL via DNS-01 or HTTP-01 challenge
         │  Certificate issued
         ▼
  Certificate and private key stored in Vault
  (path: secret/tenants/<tenant-id>/tls)
  Kubernetes Secret created in the ingress namespace
  NGINX / Envoy Ingress updated with new SNI entry
  Tenant record updated: custom_domain_status = ACTIVE
         │
         ▼
  Tenant custom domain serving HTTPS with valid certificate
  Auto-renewal triggered 30 days before expiry via cert-manager

══════════════════════════════════════════════════════════════════════
```

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| FR-ADM-300 | The platform **shall** automate TLS certificate provisioning for tenant custom domains using cert-manager on Kubernetes and the ACME protocol (Let's Encrypt or ZeroSSL). | Must | See Multi-Tenancy section (FR-TEN-060 through FR-TEN-075). |
| FR-ADM-301 | The Tenant Settings UI **shall** display the required DNS records (CNAME pointing to the platform origin, and the ACME challenge TXT record) immediately after a custom domain is submitted. | Must | Instructions localised to English, with option to show DNS provider-specific steps. |
| FR-ADM-302 | The platform **shall** poll for DNS propagation of the required records at configurable intervals and update the tenant domain status to `DNS_PENDING`, `CHALLENGE_PENDING`, `ACTIVE`, or `FAILED` with a human-readable message. | Must | Status visible to School Admin on the Tenant Settings page. |
| FR-ADM-303 | Certificate auto-renewal **shall** be triggered by cert-manager no later than 30 days before expiry and **shall** complete without any manual action or service disruption. | Must | Let's Encrypt certificates expire at 90 days; 30-day renewal window is standard. |
| FR-ADM-304 | TLS private keys for tenant custom domains **shall** be stored exclusively in Vault and **shall never** be written to persistent disk, SCM, or application database. | Must | Vault dynamic secret rotation eligible. |
| FR-ADM-305 | The Ingress layer (NGINX Ingress Controller or Envoy/Istio Gateway) **shall** support dynamic SNI routing so that new tenant certificates become active within 60 seconds of being written to the Kubernetes Secret, without requiring an Ingress controller restart. | Must | Verified by end-to-end test in staging. |
| FR-ADM-306 | If certificate issuance fails (DNS not propagated, ACME rate limit, challenge failure), the platform **shall** notify the School Admin by email with a plain-language explanation and suggested remediation steps. | Must | Notification via Notification Service. |

---

## Cost Management and Optimisation

Cost is a material concern for a platform targeting the African education market where
budgets are constrained. Infrastructure is designed for cost efficiency without sacrificing
the performance and availability required by child-safety and educational obligations.

| ID | Requirement | Priority | Acceptance / Notes |
|----|-------------|----------|--------------------|
| NFR-INF-120 | Cloud resource costs **shall** be tagged with `project`, `environment`, `service`, and `tenant` labels to enable per-tenant and per-service cost attribution. | Must | AWS Cost Explorer / GCP Billing dashboards segmented by tag. |
| NFR-INF-121 | Spot / preemptible instances **shall** be used for non-critical, stateless, fault-tolerant workloads (e.g., compile microservice batch jobs, CI runners). On-demand instances **shall** be reserved for stateful services and production API replicas. | Should | 50–80% cost reduction for eligible workloads. |
| NFR-INF-122 | Reserved instance or committed-use discounts **shall** be applied to the production PostgreSQL instance and the baseline (minimum) Kubernetes node count after 3 months of stable load data. | Should | Typically 30–40% saving vs on-demand. |
| NFR-INF-123 | S3 Intelligent-Tiering **shall** be applied to object storage buckets holding student project files and 3D model assets to automatically reduce storage cost for infrequently accessed objects. | Should | No retrieval penalty for Intelligent-Tiering frequent-access tier. |
| NFR-INF-124 | A monthly cloud cost budget alert **shall** be configured in the cloud provider console. An alert **shall** be sent to the Super Admin when forecast spend exceeds 80% of the monthly budget. | Must | Prevents billing surprises; tied to billing integration. |
| NFR-INF-125 | PR environments and ephemeral dev workloads **shall** be automatically torn down (Terraform destroy / Helm uninstall) when the PR is merged or closed, and no later than 48 hours after last commit. | Should | Prevents zombie environments from accruing cost. |

---

## Summary Requirements Table

The following table collects all infrastructure and DevOps requirement IDs defined in this
section for traceability. Cross-reference to the Requirements Traceability and
Verification section.

| ID | Description (short) | Priority |
|----|---------------------|----------|
| NFR-INF-001 | Africa-region primary cluster (af-south-1) | Must |
| NFR-INF-002 | CDN with African PoPs (Johannesburg, Nairobi, Lagos) | Must |
| NFR-INF-003 | Warm-standby DR cluster in separate region | Must |
| NFR-INF-004 | Cloud provider data-residency compliance (POPIA, Zimbabwe) | Must |
| NFR-INF-010 | Kubernetes EKS/GKE, 3 AZ, 3 worker nodes minimum | Must |
| NFR-INF-011 | Dedicated node pool for compile microservice | Should |
| NFR-INF-012 | Namespace isolation: prod / staging / dev | Must |
| NFR-INF-013 | Resource requests/limits on all containers | Must |
| NFR-INF-014 | Least-privilege Kubernetes RBAC per pod | Must |
| NFR-INF-015 | Pod security restricted profile | Must |
| NFR-INF-016 | Service mesh (mTLS, tracing, circuit breaking) | Should |
| NFR-INF-020 | Environment isolation (DB, Redis, S3, DNS) | Must |
| NFR-INF-021 | PR preview environments auto-provisioned | Should |
| NFR-INF-022 | Staging is production-equivalent | Must |
| NFR-INF-023 | No prod credentials in dev/staging | Must |
| NFR-INF-030 | CI gates on every push | Must |
| NFR-INF-031 | SAST on every PR | Must |
| NFR-INF-032 | Container image CVE scan | Must |
| NFR-INF-033 | SBOM (CycloneDX) per production image | Should |
| NFR-INF-034 | Secret scanning (Gitleaks) | Must |
| NFR-INF-035 | Manual approval gate for production deploy | Must |
| NFR-INF-036 | CI to staging elapsed time ≤ 20 min | Should |
| NFR-INF-040 | All infra in Terraform HCL | Must |
| NFR-INF-041 | Remote Terraform state with locking | Must |
| NFR-INF-042 | Terraform workspaces per environment | Must |
| NFR-INF-043 | Terraform plan as PR comment | Must |
| NFR-INF-044 | Nightly drift detection | Should |
| NFR-INF-050 | Canary releases (10% → 50% → 100%) | Must |
| NFR-INF-051 | Automated rollback on SLO breach | Must |
| NFR-INF-052 | Blue-green option for breaking changes | Should |
| NFR-INF-053 | Rollback completes within 5 minutes | Must |
| NFR-INF-060 | No secrets in SCM/images/manifests | Must |
| NFR-INF-061 | HashiCorp Vault for all secrets | Must |
| NFR-INF-062 | Config via ConfigMaps / feature flags | Must |
| NFR-INF-063 | Per-tenant secrets path in Vault | Must |
| NFR-INF-064 | Vault access audit-logged | Must |
| NFR-INF-070 | HPA on all stateless services | Must |
| NFR-INF-071 | KEDA for compile queue scaling | Should |
| NFR-INF-072 | Cluster Autoscaler / Karpenter | Must |
| NFR-INF-073 | Pod scale-out ≤ 90 s, node ≤ 5 min | Must |
| NFR-INF-074 | Scale-in conservative cooldown (10 min) | Should |
| NFR-INF-080 | PostgreSQL Multi-AZ, failover ≤ 60 s | Must |
| NFR-INF-081 | Read replica for analytics | Must |
| NFR-INF-082 | Daily snapshots 30-day retention, PITR 7 days | Must |
| NFR-INF-083 | Backup encryption + cross-region copy | Must |
| NFR-INF-084 | Quarterly restore drills | Must |
| NFR-INF-085 | PostgreSQL RLS on tenant-sensitive tables | Must |
| NFR-INF-086 | Redis cluster mode (3 shards + replicas) | Must |
| NFR-INF-087 | Redis persistence (RDB + AOF) | Must |
| NFR-INF-090 | DR runbook version-controlled | Must |
| NFR-INF-091 | DR warm-standby services (same image tags) | Must |
| NFR-INF-092 | DNS failover within 5 min of health-check fail | Must |
| NFR-INF-093 | S3 Cross-Region Replication to DR | Must |
| NFR-INF-094 | Studio simulation functional post-failover | Must |
| NFR-INF-100 | CDN cache-hit ratio > 95% for static assets | Must |
| NFR-INF-101 | Content-hash filenames for immutable caching | Must |
| NFR-INF-102 | Cache invalidation ≤ 5 min on deploy | Must |
| NFR-INF-103 | TLS 1.2+ at CDN edge, HSTS | Must |
| NFR-INF-104 | Private origin-pull credentials | Must |
| NFR-INF-110 | Critical path JS ≤ 200 KB (gzip) over 3G | Must |
| NFR-INF-111 | Draco-compressed 3D models + Brotli delivery | Should |
| NFR-INF-112 | Service Worker pre-caches Studio assets | Should |
| FR-ADM-300 | Automated ACME TLS for custom domains | Must |
| FR-ADM-301 | DNS record instructions in Tenant Settings UI | Must |
| FR-ADM-302 | DNS propagation polling + domain status display | Must |
| FR-ADM-303 | Auto-renewal ≥ 30 days before expiry | Must |
| FR-ADM-304 | TLS private keys only in Vault | Must |
| FR-ADM-305 | Dynamic SNI routing, cert active ≤ 60 s | Must |
| FR-ADM-306 | Email notification on cert issuance failure | Must |
| NFR-INF-120 | Cost tagging (project/env/service/tenant) | Must |
| NFR-INF-121 | Spot instances for batch/CI workloads | Should |
| NFR-INF-122 | Reserved instances for stable baseline | Should |
| NFR-INF-123 | S3 Intelligent-Tiering for project files | Should |
| NFR-INF-124 | Monthly cost budget alerts to Super Admin | Must |
| NFR-INF-125 | PR environments auto-destroyed on merge | Should |
