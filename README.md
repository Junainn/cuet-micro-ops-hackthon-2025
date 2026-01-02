# Async Job Processing System

> A backend system I built to learn asynchronous job processing, Redis queues, and worker-based architectures

## What This Is

This is a backend system I built to understand how real-world applications handle long-running tasks without blocking HTTP requests. Instead of making users wait for slow operations, this system:

- **Responds immediately** to API requests (<200ms)
- **Processes work asynchronously** using background workers
- **Tracks job status** reliably in Redis
- **Delivers results securely** via object storage

This project represents my hands-on learning journey with backend systems, focusing on the architectural patterns that make scalable applications possible.

## Why I Built This

I started with a hackathon challenge that simulated file download processing, but used it as a foundation to learn critical backend concepts:

### Learning Goals
- **Async Job Queues**: Replace long HTTP requests with background processing
- **Redis Beyond Caching**: Use Redis as a message broker and state store
- **Worker-Based Architecture**: Separate API from heavy processing work
- **Docker Multi-Service**: Containerize and orchestrate multiple services
- **System Reliability**: Handle failures, retries, and job persistence

### What I Actually Learned
- Why HTTP requests shouldn't block on long-running work
- How Redis can coordinate distributed systems
- The importance of job ownership and security
- Docker networking between services
- Load testing reveals issues functional tests miss

## Architecture I Implemented

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│    API      │───▶│   Redis     │
│             │    │  Service    │    │   Queue     │
└─────────────┘    └─────────────┘    └─────────────┘
                          │                   │
                          ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │   Worker    │    │   Status    │
                   │  Service    │    │   Cache     │
                   └─────────────┘    └─────────────┘
                          │                   │
                          ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │   MinIO     │    │ Presigned   │
                   │  Storage    │    │   URLs      │
                   └─────────────┘    └─────────────┘
```

### Components

**API Service** (`src/index.ts`)
- Accepts download requests instantly
- Validates input and user identity
- Enqueues jobs into Redis
- Provides status and result endpoints

**Worker Service** (`src/workers/download.worker.ts`)
- Runs independently of the API
- Processes jobs from Redis queue
- Simulates long-running file processing
- Updates job status and stores results

**Redis**
- Job queue (BullMQ)
- Authoritative job state store
- Read-through cache for status requests

**MinIO**
- S3-compatible object storage
- Stores processed files
- Generates secure presigned URLs

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js 24 | Modern JavaScript with native TypeScript |
| Framework | Hono | Fast, lightweight web framework |
| Queue | Redis + BullMQ | Job queuing and state management |
| Storage | MinIO | Self-hosted S3-compatible storage |
| Container | Docker + Docker Compose | Multi-service orchestration |
| Testing | Custom E2E suite | API and integration testing |
| CI/CD | GitHub Actions | Automated linting and testing |

## Key Features I Built

### ✅ Completed Features

- **Instant API Responses**: No request blocks longer than 200ms
- **Background Job Processing**: Workers handle long-running tasks
- **Job Status Tracking**: Redis stores complete job lifecycle
- **Secure File Delivery**: Presigned URLs prevent unauthorized access
- **User Authentication**: Job ownership validation
- **Rate Limiting**: Prevents abuse with configurable limits
- **Docker Containerization**: Full multi-service setup
- **Load Testing**: Performance validation with autocannon
- **CI Pipeline**: Automated linting and testing on pushes

### 🚧 What I Didn't Complete

- **VM Deployment**: Planned for Day 5 but VM was unavailable
- **Production Monitoring**: Basic logging implemented, metrics planned
- **Frontend UI**: Focused on backend architecture only
- **Advanced Error Recovery**: Basic retry logic, could be enhanced

## Quick Start

### Prerequisites
- Node.js 24+
- Docker & Docker Compose
- Git

### Local Development

```bash
# Clone and setup
git clone <your-repo>
cd async-job-processing-system
npm install

# Start all services
docker compose -f docker/compose.dev.yml up --build

# Services will be available at:
# API: http://localhost:3000
# API Docs: http://localhost:3000/docs
# MinIO Console: http://localhost:9001
# Jaeger UI: http://localhost:16686
```

### Testing the System

```bash
# Run E2E tests
npm run test:e2e

# Load testing
npm run start  # Start server
autocannon -c 50 -d 15 http://localhost:3000/v1/download/status/3

# Manual testing
curl -X POST http://localhost:3000/v1/download/initiate \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user" \
  -d '{"file_ids": [10000, 20000]}'
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health` | Detailed health status |
| POST | `/v1/download/initiate` | Start bulk download job |
| GET | `/v1/download/status/:jobId` | Check job status |
| GET | `/v1/download/result/:jobId` | Get download URL |
| POST | `/v1/download/check` | Check file availability |

## Project Structure

```
├── src/
│   ├── index.ts              # Main API service
│   ├── redis.ts              # Redis client setup
│   ├── queues/
│   │   └── download.queue.ts # Job queue configuration
│   ├── workers/
│   │   └── download.worker.ts # Background worker
│   └── storage/
│       └── minio.ts          # Object storage client
├── scripts/
│   ├── e2e-test.ts          # End-to-end test suite
│   └── run-e2e.ts           # Test runner
├── docker/
│   ├── compose.dev.yml      # Development services
│   ├── compose.prod.yml     # Production services
│   ├── Dockerfile.dev       # Development container
│   └── Dockerfile.prod      # Production container
└── .github/workflows/ci.yml # CI pipeline
```

## What This Taught Me

### Technical Lessons

1. **HTTP is for Coordination, Not Work**
   - Long-running tasks belong in background workers
   - API should return job IDs, not wait for completion

2. **Redis as a State Machine**
   - Beyond caching: Redis can track complex job lifecycles
   - Atomic operations prevent race conditions

3. **Workers Enable Reliability**
   - Jobs complete even if clients disconnect
   - Retry logic handles transient failures
   - Separate processes prevent resource contention

4. **Security in Async Systems**
   - Job ownership must be validated on every operation
   - Presigned URLs provide time-limited access
   - Rate limiting prevents queue abuse

5. **Docker Compose for System Thinking**
   - Models real production service dependencies
   - Teaches networking between containers
   - Makes local development match production topology

### Architecture Insights

- **Polling vs WebSockets**: Chose polling for simplicity and reliability
- **State Management**: Redis as single source of truth for job status
- **Error Handling**: Graceful degradation when services fail
- **Load Patterns**: Understanding queue depth and worker utilization

## Deployment Status

### ✅ Local Environment
- Fully functional in Docker Compose
- All services communicate correctly
- Load testing validates performance
- E2E tests pass consistently

### 🚧 Production Deployment
- Architecture designed for VM deployment
- Planned nginx reverse proxy configuration
- VM unavailability prevented completion
- Ready for deployment when infrastructure available

## Future Enhancements

### High Priority
- [ ] VM deployment with nginx reverse proxy
- [ ] Horizontal worker scaling
- [ ] Enhanced error recovery and dead letter queues

### Medium Priority
- [ ] Prometheus metrics collection
- [ ] Frontend dashboard for job monitoring
- [ ] Database persistence for job history

### Nice to Have
- [ ] WebSocket real-time status updates
- [ ] Advanced retry strategies
- [ ] Multi-region deployment

## Context & Attribution

This project was built while working through the **Delineate Hackathon Challenge (CUET Fest 2025)**. The original problem statement and requirements are preserved in `HACKATHON_CHALLENGE.md` for reference.

**Important**: This repository represents my personal learning journey and implementation. It is not an official hackathon submission or a complete product. The focus was on understanding backend system architecture, not winning a competition.

## License

MIT - Feel free to learn from this implementation!</content>
<parameter name="filePath">c:\Users\JUNAIN UDDIN\Desktop\10day\cuet-micro-ops-hackthon-2025\README.md
