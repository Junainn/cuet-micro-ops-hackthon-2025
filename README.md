# Async Job Processing System

> Production-grade distributed job queue built with Redis, BullMQ, and MinIO storage

Built using the **CUET MicroOps Hackathon 2025** challenge as a foundation. Team placed **top 10**; this repository represents my personal implementation focused on understanding async architectures and distributed systems.

## Overview

A scalable async job processing system that handles long-running tasks (10-120s) without blocking HTTP requests. Demonstrates production patterns for job queues, worker processes, and secure file delivery.

**Key Metrics:**
- API response time: <200ms (non-blocking)
- Concurrent request handling: 50+ connections
- Retry strategy: 3 attempts with exponential backoff
- Status cache: 10-second TTL
- File access: Presigned URLs with 10-minute expiry

---

## What I Implemented

<table>
<tr><td>

**Core Architecture**
- ✅ Redis + BullMQ job queue
- ✅ Separate worker process
- ✅ Job state management in Redis
- ✅ Async job lifecycle (queued → processing → completed)
- ✅ Cache-aside pattern for status queries

</td><td>

**Storage & Security**
- ✅ MinIO S3-compatible storage integration
- ✅ Presigned URL generation
- ✅ Job ownership validation
- ✅ Rate limiting (environment-aware)
- ✅ Request ID tracking

</td></tr>
<tr><td>

**Infrastructure**
- ✅ Docker Compose multi-service setup
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Service orchestration (Redis + MinIO)
- ✅ Environment configuration with Zod

</td><td>

**Testing & Quality**
- ✅ Custom E2E test suite (32+ assertions)
- ✅ Load testing with autocannon
- ✅ CI service health checks
- ✅ Lint + format automation

</td></tr>
</table>

### Pre-Configured Tools (Integrated, Not Built)

📦 **OpenTelemetry + Jaeger** - Distributed tracing  
📦 **Sentry** - Error tracking  
📦 **Base Docker structure** - Enhanced with MinIO + workers

---

## Architecture

### System Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /v1/download/initiate
     ▼
┌──────────────────┐
│   API Service    │ ◀── Returns jobId immediately (<200ms)
└────┬─────────────┘
     │ Enqueue job
     ▼
┌──────────────────┐
│  Redis (BullMQ)  │ ◀── Job queue + state management
└────┬─────────────┘
     │ Worker polls queue
     ▼
┌──────────────────┐
│  Worker Process  │ ◀── Async processing (10-120s)
└────┬─────────────┘
     │ Store result
     ▼
┌──────────────────┐
│  MinIO Storage   │ ◀── S3-compatible object storage
└──────────────────┘
     │
     ▼
Client polls /v1/download/status/:jobId
Client gets /v1/download/result/:jobId → Presigned URL
```

### Component Breakdown

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Service** | Hono + Node.js 24 | Non-blocking HTTP endpoints, job orchestration |
| **Job Queue** | Redis + BullMQ | Distributed job queue with retry/backoff |
| **Worker** | BullMQ Worker | Background processing, state updates |
| **Cache** | Redis (TTL) | 10s cache for status queries (reduce load) |
| **Storage** | MinIO | S3-compatible storage for job results |
| **Observability** | OTEL + Jaeger | Distributed tracing (pre-configured) |
| **Error Tracking** | Sentry | Exception capture (pre-configured) |

---

## Quick Start

### Prerequisites

- Node.js 24+
- Docker & Docker Compose

### Run Locally

```bash
# Clone repository
git clone https://github.com/yourusername/cuet-micro-ops-hackthon-2025.git
cd cuet-micro-ops-hackthon-2025

# Install dependencies
npm install

# Start all services (API, Worker, Redis, MinIO, Jaeger)
docker compose -f docker/compose.dev.yml up --build
```

### Services Available

| Service | URL | Purpose |
|---------|-----|---------|
| API | http://localhost:3000 | REST API endpoints |
| API Docs | http://localhost:3000/doc | OpenAPI documentation |
| MinIO Console | http://localhost:9001 | Object storage UI (admin/admin) |
| Jaeger UI | http://localhost:16686 | Distributed tracing dashboard |

---

## API Endpoints

### Core Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/v1/download/initiate` | Create async job, returns jobId | `x-user-id` |
| `GET` | `/v1/download/status/:jobId` | Poll job status (cached 10s) | `x-user-id` |
| `GET` | `/v1/download/result/:jobId` | Get presigned download URL | `x-user-id` |
| `POST` | `/v1/download/check` | Check file availability in S3 | - |
| `GET` | `/health` | Service health (storage check) | - |

### Example Usage

**1. Initiate Download Job:**
```bash
curl -X POST http://localhost:3000/v1/download/initiate \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -d '{"file_ids": [10000, 20000, 30000]}'
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "totalFileIds": 3,
  "estimatedTime": "30-90 seconds"
}
```

**2. Poll Job Status:**
```bash
curl http://localhost:3000/v1/download/status/550e8400-e29b-41d4-a716-446655440000 \
  -H "x-user-id: user123"
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": {
    "processed": 2,
    "total": 3
  },
  "updatedAt": "2026-01-02T10:30:45Z"
}
```

**3. Get Result:**
```bash
curl http://localhost:3000/v1/download/result/550e8400-e29b-41d4-a716-446655440000 \
  -H "x-user-id: user123"
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "downloadUrl": "http://minio:9000/downloads/results/job-550e8400.txt?X-Amz-Signature=...",
  "expiresIn": 600
}
```

---

## Testing

### Run E2E Tests

```bash
# Start services in background
docker compose -f docker/compose.dev.yml up -d

# Run test suite (32+ assertions)
npm run test:e2e
```

**Test Coverage:**
- ✅ API endpoint responses
- ✅ Input validation (Zod schemas)
- ✅ Security headers (HSTS, CSP, X-Frame-Options)
- ✅ Rate limiting
- ✅ Request ID propagation
- ✅ Job lifecycle (queued → completed)

### Load Testing

```bash
# Start server
npm run start

# 50 concurrent connections, 15 second duration
autocannon -c 50 -d 15 http://localhost:3000/v1/download/status/test-job
```

---

## Tech Stack

### Core Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 24 | Native TypeScript support (`--experimental-transform-types`) |
| **Framework** | Hono | Fast, lightweight web framework |
| **Queue** | BullMQ | Redis-based job queue with advanced features |
| **Storage** | MinIO | Self-hosted S3-compatible object storage |
| **Database** | Redis | Job state + cache + queue backend |
| **Container** | Docker Compose | Multi-service orchestration |
| **Tracing** | OpenTelemetry + Jaeger | Distributed tracing (pre-configured) |
| **Errors** | Sentry | Error tracking (pre-configured) |
| **Validation** | Zod | Runtime type validation + OpenAPI schemas |
| **Testing** | Custom + Autocannon | E2E tests + load testing |
| **CI/CD** | GitHub Actions | Automated lint/test/build |

---

## Project Structure

```
.
├── src/
│   ├── index.ts                 # API service (895 lines)
│   ├── redis.ts                 # Redis client with retry strategy
│   ├── queues/
│   │   └── download.queue.ts    # BullMQ queue setup
│   ├── workers/
│   │   └── download.worker.ts   # Background job processor
│   └── storage/
│       └── minio.ts             # S3-compatible storage client
├── scripts/
│   ├── e2e-test.ts              # End-to-end test suite
│   └── run-e2e.ts               # Test runner with server lifecycle
├── docker/
│   ├── compose.dev.yml          # Dev environment (hot reload)
│   ├── compose.prod.yml         # Production environment
│   ├── Dockerfile.dev           # Development container
│   └── Dockerfile.prod          # Production container
├── .github/
│   └── workflows/
│       └── ci.yml               # CI pipeline (lint → test → build)
├── HACKATHON_CHALLENGE.md       # Original challenge description
└── README.md                    # This file
```

---

## Key Implementation Details

### 1. Job Queue with Retry Strategy

**Worker Configuration** ([src/workers/download.worker.ts](src/workers/download.worker.ts)):
```typescript
attempts: 3,
backoff: { type: "exponential", delay: 5000 }
// Retry delays: 5s → 10s → 20s
```

**Lock Duration:**
```typescript
lockDuration: 60000  // 60 seconds
// Prevents duplicate processing in distributed systems
```

### 2. Cache-Aside Pattern

**Status Endpoint** ([src/index.ts](src/index.ts)):
```typescript
// Check cache first (10s TTL)
const cached = await redis.get(`cache:job:status:${jobId}`);
if (cached) return JSON.parse(cached);

// Cache miss → fetch from Redis hash
const jobStatus = await redis.hgetall(`job:${jobId}`);
await redis.setex(cacheKey, 10, JSON.stringify(response));
```

### 3. Job Ownership Validation

**Security Check** ([src/index.ts](src/index.ts)):
```typescript
const userId = c.req.header("x-user-id");
const job = await redis.hgetall(`job:${jobId}`);

if (job.ownerId !== userId) {
  return c.json({ error: "Forbidden" }, 403);
}
```

### 4. Presigned URL Generation

**Secure File Access** ([src/index.ts](src/index.ts)):
```typescript
const url = await minio.presignedGetObject(bucket, resultKey, 600);
// 10-minute expiry, no credentials needed
```

### 5. Environment-Aware Rate Limiting

**Adaptive Limits** ([src/index.ts](src/index.ts)):
```typescript
limit: env.NODE_ENV === "production" ? 100 : 1000
// Dev: 1000 req/min (don't block yourself)
// Prod: 100 req/min (prevent abuse)
```

---

## CI/CD Pipeline

**GitHub Actions Workflow** ([.github/workflows/ci.yml](.github/workflows/ci.yml)):

```yaml
Lint Job
├── ESLint (code quality)
└── Prettier (formatting)
   ↓ (passes)
Test Job
├── Start Redis service
├── Start MinIO container
└── Run E2E tests (32+ assertions)
   ↓ (passes)
Build Job
└── Build production Docker image
```

**Service Orchestration in CI:**
- Redis: GitHub Actions service container
- MinIO: Manual Docker container with health check wait
- Environment variables configured for service networking

---

## What I Learned

### Technical Skills

1. **Async Architecture**
   - Non-blocking HTTP responses
   - Background job processing patterns
   - Job state management across services

2. **Redis Beyond Caching**
   - Job queue (BullMQ)
   - State persistence (hashes)
   - Cache layer (TTL keys)

3. **Worker Patterns**
   - Retry strategies with exponential backoff
   - Job locks for distributed processing
   - Graceful error handling

4. **Docker Multi-Service**
   - Container networking (service discovery)
   - Volume mounts for hot reload
   - Service dependencies

5. **Security Patterns**
   - Job ownership validation
   - Presigned URLs (time-limited access)
   - Rate limiting strategies

6. **Testing & CI/CD**
   - E2E test suite design
   - Load testing for performance validation
   - Service orchestration in CI pipelines

### Architecture Insights

- **Polling vs WebSockets:** Chose polling for simplicity, cacheability, and stateless design
- **Cache-Aside Pattern:** Reduces Redis load for frequently accessed data
- **Graceful Degradation:** MinIO is optional (system works in mock mode)
- **Type Safety:** Zod validates runtime data, TypeScript catches compile-time errors

---

## Project Context

This repository was built during the **CUET MicroOps Hackathon 2025 (Delineate Challenge)**. The original problem statement and requirements are preserved in [HACKATHON_CHALLENGE.md](HACKATHON_CHALLENGE.md).

**Important Notes:**
- This is my **personal learning repository** focused on understanding async architectures
- The **official team submission** (top 10 placement) is maintained separately by team member
- This implementation prioritizes **learning depth** over hackathon completion
- Some observability tools (OpenTelemetry, Sentry, Jaeger) were pre-configured in the challenge

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

## Acknowledgments

- **Delineate Team** for creating the hackathon challenge
- **CUET Fest 2025** for organizing the competition

