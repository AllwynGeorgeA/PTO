# MicroSaaS Template

> **Clone. Define. Build.** Full-stack SaaS in minutes.

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/manojkanur/MicroSaaS-Template-Private.git my-saas
cd my-saas

# 2. Define your product
# Edit INITIAL.md with your product details

# 3. Generate blueprint
/generate-prp INITIAL.md

# 4. Build with parallel agents
/execute-prp PRPs/[name]-prp.md
```

---

## What You Get

- FastAPI backend with JWT + Google OAuth
- React frontend with modern UI (Framer Motion)
- PostgreSQL database with migrations
- Docker + CI/CD ready
- 80%+ test coverage

---

## How It Works

```
INITIAL.md → /generate-prp → PRP blueprint → /execute-prp → Full App

Phase 1 (Parallel):
├─ DATABASE-AGENT  → Models + migrations
├─ BACKEND-AGENT   → API structure
├─ FRONTEND-AGENT  → React setup
└─ DEVOPS-AGENT    → Docker + CI

Phase 2 (Per Module):
├─ Backend endpoints
└─ Frontend pages

Phase 3 (Parallel):
├─ TEST-AGENT      → 80%+ coverage
└─ REVIEW-AGENT    → Security audit
```

---

## Files

| File | Purpose |
|------|---------|
| `INITIAL.md` | Define your product |
| `CLAUDE.md` | Project rules |
| `skills/*.md` | Code patterns (5 files) |
| `agents/*.md` | Agent definitions |
| `.claude/commands/` | Custom commands |

---

## Skills (5 files)

| Skill | Contains |
|-------|----------|
| `BACKEND.md` | FastAPI + JWT + OAuth + Errors |
| `FRONTEND.md` | React + UI Kit + API integration |
| `DATABASE.md` | SQLAlchemy + Alembic |
| `TESTING.md` | pytest + Vitest |
| `DEPLOYMENT.md` | Docker + GitHub Actions |

---

## Commands

| Command | Description |
|---------|-------------|
| `/setup-project` | Interactive wizard |
| `/generate-prp` | Create implementation blueprint |
| `/execute-prp` | Build with parallel agents |

---

## Tech Stack

- **Backend:** FastAPI + Python 3.11+
- **Frontend:** React + TypeScript + Vite
- **Database:** PostgreSQL + SQLAlchemy
- **Auth:** JWT + Google OAuth
- **UI:** Chakra UI or Tailwind + Framer Motion
- **Deploy:** Docker + GitHub Actions

---

## Example

```bash
# Define an invoice SaaS in INITIAL.md:
# - Module: Invoices (CRUD)
# - Module: Clients (CRUD)
# - Module: Dashboard

/generate-prp INITIAL.md
# Creates PRPs/invoice-saas-prp.md

/execute-prp PRPs/invoice-saas-prp.md
# 4 agents build in parallel
# ~20-30 minutes for complete app
```

---

## Output Structure

```
my-saas/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routers/
│   │   ├── services/
│   │   └── auth/
│   ├── alembic/
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── services/
├── docker-compose.yml
└── .github/workflows/
```

---

## Run Locally (PTOShield AI, Windows PowerShell)

Prereqs: Python 3.11+, Node 20+, PostgreSQL running locally with an empty database.

```powershell
# 0. From repo root: create .env, then edit DATABASE_URL and SECRET_KEY
#    (SECRET_KEY must be 32+ chars; generate one with:
#     python -c "import secrets; print(secrets.token_urlsafe(48))")
#    .env.example ships APP_ENV=development so the placeholder key works locally only.
Copy-Item .env.example .env

# 1. Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
python scripts\seed.py
uvicorn app.main:app --reload
```

`backend\scripts\seed.py` is the seed script (created separately). If the backend does not find `.env` from `backend\`, also run `Copy-Item ..\.env .env` inside `backend\`.

```powershell
# 2. Frontend (new terminal, from repo root)
cd frontend
npm install
npm run dev
```

API: http://localhost:8000 (health: `/health`). App: http://localhost:5173.

## Run with Docker

```powershell
Copy-Item .env.example .env      # then set DB_PASSWORD, a real SECRET_KEY (see above) and remove APP_ENV=development
docker compose up --build -d     # migrations run on backend start
docker compose exec backend python scripts/seed.py
docker compose logs -f backend
docker compose down              # add -v to wipe the database
```

App: http://localhost:3000, API: http://localhost:8000.

Dev mode with live reload:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Optional vars (`OPENAI_*`, `DODO_*`, `SMTP_*`) can stay blank: template fallback, demo mode, log-only emails.
