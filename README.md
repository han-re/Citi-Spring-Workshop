# ACME Team Management Application

A full-stack team management web application built during the Citi Spring Week coding workshop. The app solves a real business problem for ACME Inc. — centralising information about teams, individuals, achievements, and metadata that was previously scattered across multiple systems.

---

## What I Built

### Backend — 5 Python Lambda Functions

Each entity has its own AWS Lambda function written in Python, deployed via Terraform and backed by MongoDB (locally via LocalStack, in production via AWS DocumentDB).

| Service | Endpoints | Notes |
|---|---|---|
| `individuals` | Full CRUD + search/filter | Validates name, location, employment_type |
| `teams` | Full CRUD | Validates leader_id and members exist in individuals; leader always auto-added to members |
| `achievements` | Full CRUD + filter by team/month | Validates team_id exists |
| `metadata` | Full CRUD | Enforces unique (category, key) constraint |
| `auth` | POST /auth/login | Issues signed JWT; uses Lambda Function URL v2 event format |

### Frontend — React + Vite

Five pages, all using inline CSS with a custom cyberpunk design system (no CSS framework):

- **Dashboard** — live counts for all four entities, RBAC access control matrix showing current user's permissions
- **Individuals** — full CRUD with search by name and filters for location and employment type
- **Teams** — full CRUD with member management and leader assignment
- **Achievements** — full CRUD with filtering by team and month
- **Metadata** — full CRUD with category/key/value structure

### Authentication & RBAC

JWT-based auth with four roles enforced on both backend and frontend:

| Role | Read | Create | Edit | Delete |
|---|---|---|---|---|
| Admin | yes | yes | yes | yes |
| Manager | yes | yes | yes | no |
| Contributor | yes | yes | no | no |
| Viewer | yes | no | no | no |

The frontend stores `token`, `role`, and `username` in `localStorage`. Every API call attaches `Authorization: Bearer <token>`. A 401 response clears storage and forces re-login.

### Backend Tests

9 pytest tests in `backend/individuals/test_function.py` covering:

- Create individual (happy path) → 201
- Get individual by ID → 200
- Create with missing name → 400
- Create with missing location → 400
- Get non-existent ID → 404
- No token → 401
- Viewer cannot create → 403
- Viewer cannot delete → 403
- Viewer can read → 200

Tests call `handler()` directly against a real local MongoDB instance — no mocking. A session-scoped fixture cleans up all created records after the suite finishes.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, inline CSS |
| Backend | Python 3, AWS Lambda |
| Database | MongoDB (local) / AWS DocumentDB (prod) |
| Auth | PyJWT, HMAC-signed tokens |
| Infrastructure | Terraform, LocalStack (local dev) |
| Deployment | AWS Lambda Function URLs, S3, CloudFront |
| Dev Proxy | Node.js CORS proxy (local only) |

---

## Running Locally

### Prerequisites

- Docker Desktop (running)
- MongoDB installed locally (`brew install mongodb-community`)
- LocalStack CLI (`pip3 install localstack`)
- Terraform Local (`pip3 install terraform-local`)
- Node.js

### Start everything

```bash
./bin/start-dev.sh
```

This starts MongoDB, LocalStack, deploys all Lambda functions via Terraform, starts the dev proxy on `:3001`, and starts the React dev server on `:3000`.

Open [http://localhost:3000](http://localhost:3000). Default credentials: `admin` / `admin123`.

### Install backend dependencies (hot-reload mode)

LocalStack runs Lambdas directly from the filesystem, so dependencies must be installed into each backend directory:

```bash
pip3 install pymongo PyJWT -t backend/auth/ --break-system-packages
pip3 install pymongo PyJWT -t backend/individuals/ --break-system-packages
pip3 install pymongo PyJWT -t backend/teams/ --break-system-packages
pip3 install pymongo PyJWT -t backend/achievements/ --break-system-packages
pip3 install pymongo PyJWT -t backend/metadata/ --break-system-packages
```

### Run backend tests

```bash
pip3 install pytest pymongo PyJWT --break-system-packages
cd backend/individuals
python3 -m pytest test_function.py -v
```

---

## Deploying to AWS

```bash
aws configure                   # set up credentials
./bin/setup-participant.sh
./bin/deploy-backend.sh
./bin/deploy-frontend.sh        # prints the CloudFront URL at the end
```

> Note: AWS DocumentDB is not free-tier eligible (~$50/month). Run `terraform destroy` when not in use.

---

## Architecture

```
Browser (:3000)
  → CORS Proxy (:3001)          [local dev only]
  → Lambda Function URLs        [LocalStack / AWS]
  → Python handler              [backend/*/function.py]
  → MongoDB / DocumentDB
```

In production, the React app talks directly to Lambda Function URLs — no proxy needed.

---

## Project Structure

```
backend/
  auth/           # JWT login endpoint
  individuals/    # Individuals CRUD + tests
  teams/          # Teams CRUD
  achievements/   # Achievements CRUD
  metadata/       # Metadata CRUD
frontend/
  src/
    pages/        # Dashboard, Individuals, Teams, Achievements, Metadata
    services/     # api.jsx — single API client
    components/   # Toast notification system
infra/            # Terraform — Lambda, DocumentDB, S3, CloudFront
bin/              # start-dev.sh, deploy-backend.sh, deploy-frontend.sh, proxy-server.js
docs/             # Requirements, implementation spec, testing strategy
```

---

## License

MIT-0 — see [LICENSE](./LICENSE).
