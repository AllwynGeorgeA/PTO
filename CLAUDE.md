# CLAUDE.md - PTOShield AI Project Rules

> Project-specific rules for Claude Code. This file is read automatically.

---

## Project Overview

**Project Name:** PTOShield AI
**Description:** Funny AI PTO assistant: out-of-office reply generator, handover checklist, vacation readiness score.
**Tech Stack:**
- Backend: FastAPI + Python 3.11+
- Frontend: React + Vite + TypeScript
- Database: PostgreSQL + SQLAlchemy + Alembic
- Auth: JWT (access + refresh) + Google OAuth
- UI: Chakra UI + Framer Motion
- AI: OpenAI API (server-side, template fallback)
- Payments: Dodo Payments (demo mode without credentials)

---

## Project Structure

```
ptoshield-ai/
├── backend/
│   ├── app/
│   │   ├── main.py, config.py, database.py
│   │   ├── models/      user.py, refresh_token.py, pto_plan.py, ai_reply.py, handover_task.py, subscription.py
│   │   ├── schemas/
│   │   ├── routers/     auth, pto_plans, replies, handover, dashboard, billing
│   │   ├── services/    ai_service.py, readiness.py, billing_service.py, reminder_service.py
│   │   └── auth/
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   └── src/ components/, pages/, hooks/, services/, context/, types/
├── .claude/commands/
├── skills/
├── agents/
└── PRPs/
```

---

## Code Standards

### Python
```python
# ALWAYS use type hints and docstrings on public functions
def get_pto_plan(db: Session, plan_id: int, user_id: int) -> PtoPlan:
    """Return the plan only if it belongs to user_id, else raise 404."""
```

### TypeScript
```typescript
// Interfaces required - NO any types
interface PtoPlan { id: number; employeeName: string; startDate: string; endDate: string; }
```

---

## Forbidden Patterns

### Backend
- ❌ `print()` - use `logging`
- ❌ Plain-text passwords
- ❌ Hardcoded secrets - use environment variables
- ❌ `SELECT *`
- ❌ Skipping input validation
- ❌ Querying user-owned tables without filtering by `user_id`
- ❌ Returning or logging OpenAI/Dodo keys

### Frontend
- ❌ `any` type
- ❌ `console.log` in production
- ❌ Missing error handling in async calls
- ❌ Inline styles - use Chakra
- ❌ Calling OpenAI or Dodo directly from the browser

---

## Module-Specific Rules

### PTO Planner
- Every plan belongs to a user (`user_id`); `end_date >= start_date`
- Status (Upcoming / Active / Completed) and days remaining are computed from dates, never stored

### AI Replies
- Tones: `professional`, `funny`, `savage_office_safe`, `corporate_diplomatic`
- Replies must stay office-safe (no insults, profanity, HR-risky content)
- No `OPENAI_API_KEY` or an API error → use template fallback, set `source = "template"`
- Free plan: 20 AI replies per calendar month; over limit → HTTP 402

### Handover Tasks
- `priority`: low | medium | high; `status`: pending | completed

### Readiness Score
- 70% handover completion + 30% backup person assigned; message tiers 0-30 / 31-70 / 71-100 (see INITIAL.md)

### Billing
- No `DODO_API_KEY` → DEMO MODE, clearly labeled in UI and API responses; never present a demo action as a real payment
- Change plans in live mode only from a signature-verified webhook

---

## API Conventions

- All endpoints prefixed with `/api/v1/`; plural nouns
- Status codes: 200, 201, 400, 401, 402 (plan limit), 403, 404, 409, 422

---

## Authentication

- Email/password (bcrypt) + Google OAuth 2.0; verify `state` for CSRF
- Access token 30 min, refresh token 7 days, HS256

---

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ptoshield
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

OPENAI_API_KEY=            # optional; blank = template fallback
OPENAI_MODEL=

DODO_API_KEY=              # optional; blank = demo mode
DODO_WEBHOOK_SECRET=

SMTP_HOST=                 # optional; blank = reminders logged only
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

VITE_API_URL=http://localhost:8000
```

---

## Development Commands

```powershell
# Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev

# Tests and lint
ruff check backend/ ; pytest backend/tests -v
cd frontend ; npm run lint ; npm run type-check
```

---

## Commit Message Format

```
feat([module]): add [feature]
fix([module]): fix [bug]
refactor([module]): refactor [component]
test([module]): add tests for [feature]
docs: update [documentation]
```

---

## Skills Reference

| Task | Skill |
|------|-------|
| Database models | skills/DATABASE.md |
| API + Auth | skills/BACKEND.md |
| React + UI | skills/FRONTEND.md |
| Testing | skills/TESTING.md |
| Deployment | skills/DEPLOYMENT.md |

---

## Agent Coordination

ORCHESTRATOR coordinates: DATABASE-AGENT → BACKEND-AGENT → FRONTEND-AGENT → TEST-AGENT → REVIEW-AGENT → DEVOPS-AGENT. Definitions are in `/agents/`.
