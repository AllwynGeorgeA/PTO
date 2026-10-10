# PRP: PTOShield AI

> Implementation blueprint for parallel agent execution

---

## METADATA

| Field | Value |
|-------|-------|
| **Product** | PTOShield AI |
| **Type** | SaaS |
| **Version** | 1.0 |
| **Created** | 2026-10-10 |
| **Complexity** | Medium |

---

## PRODUCT OVERVIEW

**Description:** Funny AI PTO assistant: out-of-office reply generator, handover checklist, readiness score.

**Value Proposition:** Employees protect their leave from office interruptions with ready-to-send funny replies and a clean handover. Pro unlocks unlimited replies.

**MVP Scope:**
- [ ] PTO Planner (CRUD, countdown, status)
- [ ] AI Reply Generator (4 tones, regenerate, edit, copy, save, template fallback)
- [ ] Handover Checklist (CRUD, complete, summary)
- [ ] Vacation Readiness Score
- [ ] Copy and share replies
- [ ] Auth with per-user data isolation

---

## TECH STACK

| Layer | Technology | Skill Reference |
|-------|------------|-----------------|
| Backend | FastAPI + Python 3.11+ | skills/BACKEND.md |
| Frontend | React + TypeScript + Vite | skills/FRONTEND.md |
| Database | PostgreSQL + SQLAlchemy + Alembic | skills/DATABASE.md |
| Auth | JWT + bcrypt + Google OAuth | skills/BACKEND.md |
| UI | Chakra UI + Framer Motion | skills/FRONTEND.md |
| AI | OpenAI API (server-side), template fallback | skills/BACKEND.md |
| Payments | Dodo Payments (demo mode) | skills/BACKEND.md |
| Testing | pytest + React Testing Library | skills/TESTING.md |
| Deployment | Docker + GitHub Actions | skills/DEPLOYMENT.md |

---

## DATABASE MODELS (6)

- **User:** id, email, hashed_password, full_name, is_active, is_verified, oauth_provider, plan (free|pro|team), created_at
- **RefreshToken:** id, user_id FK, token, expires_at, revoked
- **PtoPlan:** id, user_id FK, employee_name, start_date, end_date, backup_person, contact_email, reason?, reminder_sent_at?, created_at. Status and days_remaining computed.
- **AiReply:** id, user_id FK, incoming_message, tone, generated_reply, is_saved, source (openai|template), created_at. Index (user_id, created_at) for monthly usage count.
- **HandoverTask:** id, user_id FK, pto_plan_id FK?, name, description, priority, backup_person, deadline, status, created_at
- **Subscription:** id, user_id FK, plan, status, dodo_customer_id, dodo_subscription_id, current_period_end, created_at

All user-owned tables are filtered by `user_id` in every query.

---

## MODULES

### Module 1: Authentication
**Agents:** DATABASE-AGENT + BACKEND-AGENT + FRONTEND-AGENT

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Create account |
| POST | /api/v1/auth/login | Get tokens |
| POST | /api/v1/auth/refresh | Refresh token |
| POST | /api/v1/auth/logout | Revoke refresh token |
| GET | /api/v1/auth/google | Start OAuth (state) |
| GET | /api/v1/auth/google/callback | Finish OAuth |
| GET/PUT | /api/v1/auth/me | Profile |

| Route | Page |
|-------|------|
| /login | LoginPage |
| /register | RegisterPage |
| /settings | SettingsPage (profile, theme, plan) |

### Module 2: PTO Planner
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/v1/pto-plans | List / create |
| GET/PUT/DELETE | /api/v1/pto-plans/{id} | One plan |

| Route | Page |
|-------|------|
| /pto | PtoListPage |
| /pto/new, /pto/:id/edit | PtoFormPage |
| /pto/:id | PtoDetailPage (countdown) |

### Module 3: AI Reply Generator
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/replies/generate | message + tone, enforces free limit (402) |
| POST | /api/v1/replies/{id}/regenerate | New reply, same message |
| PUT | /api/v1/replies/{id} | Edit text, toggle saved |
| GET | /api/v1/replies | List, `?saved=true` filter |
| DELETE | /api/v1/replies/{id} | Delete |
| GET | /api/v1/replies/usage | used / limit |

`services/ai_service.py`: OpenAI call with office-safe system prompt, timeout, fallback to per-tone templates on missing key or error.

| Route | Page |
|-------|------|
| /replies/new | ReplyGeneratorPage (tone picker, copy, share, regenerate, edit, save) |
| /replies | SavedRepliesPage |

### Module 4: Handover Assistant
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/v1/handover-tasks | List / create |
| PUT/DELETE | /api/v1/handover-tasks/{id} | Update / delete |
| POST | /api/v1/handover-tasks/{id}/toggle | Complete / reopen |
| POST | /api/v1/handover-tasks/summary | AI or template summary |

| Route | Page |
|-------|------|
| /handover | HandoverDashboardPage |
| /handover/new, /handover/:id/edit | TaskFormPage |
| /handover/summary | HandoverSummaryPage |

### Module 5: Dashboard
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

`GET /api/v1/dashboard` returns next/active PTO, days remaining, saved reply count, pending task count, score and message. `services/readiness.py`: score = 70% task completion (no tasks → 0) + 30% backup person assigned. Tiers: 0-30, 31-70, 71-100 with the messages from INITIAL.md. Route: /dashboard.

### Module 6: Billing (Dodo)
**Agents:** BACKEND-AGENT + FRONTEND-AGENT

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/billing/plans | Free / Pro $4.99 / Team $19 |
| POST | /api/v1/billing/checkout | Dodo checkout, or demo mode response |
| POST | /api/v1/billing/webhook | Signature-verified plan changes |
| GET | /api/v1/billing/subscription | Current plan |

Demo mode (no `DODO_API_KEY`): responses carry `demo: true`, UI shows a labeled banner, no real payment is implied. Route: /pricing (public).

### Module 7: Email Reminders
**Agent:** BACKEND-AGENT

`services/reminder_service.py` with a daily scheduled job (stdlib asyncio task or one script run by Windows Task Scheduler, no extra dependency): plans starting tomorrow with `reminder_sent_at` null get an SMTP email. No SMTP config → log only.

### Landing Page
**Agent:** FRONTEND-AGENT. Route `/`: hero, feature cards, pricing teaser, CTA, vacation emojis, rounded cards, light Framer Motion, dark/light mode, mobile responsive.

---

## PHASE EXECUTION PLAN

**Phase 1: Foundation (4 agents in parallel)**
- DATABASE-AGENT: all 6 models, first Alembic migration, database.py
- BACKEND-AGENT: main.py, config.py, project structure, auth module
- FRONTEND-AGENT: Vite setup, Chakra theme with dark/light, routing, auth context
- DEVOPS-AGENT: Docker, CI, `.env.example` (no secrets), README with Windows PowerShell steps

**Validation Gate 1:** pip install, alembic upgrade head, npm install, docker-compose config

**Phase 2: Modules (backend + frontend parallel per module), MVP order**
1. PTO Planner
2. AI Reply Generator
3. Handover Assistant
4. Dashboard and readiness score
5. Billing and pricing (demo mode)
6. Google OAuth, email reminders, landing page
7. Seed script: demo user plus sample plans, replies and tasks

**Validation Gate 2:** ruff check, npm lint, npm type-check

**Phase 3: Quality (3 agents in parallel)**
- TEST-AGENT: pytest + RTL, 80%+ coverage; must include cross-user access tests, free-limit test, readiness score tiers, fallback without OpenAI key, webhook signature rejection
- REVIEW-AGENT: security audit (secrets, ownership checks, rate limiting, OAuth state, webhook verification)
- RESEARCH-AGENT: verify current Dodo Payments API and OpenAI SDK usage

**Final Validation:** full test suite, docker build, health checks. Final report must list which features are fully working and which need external credentials (OpenAI, Dodo, Google, SMTP).

---

## VALIDATION GATES

| Gate | Commands |
|------|----------|
| 1 | `alembic upgrade head`, `npm install`, `docker-compose config` |
| 2 | `ruff check backend/`, `npm run type-check` |
| 3 | `pytest --cov --cov-fail-under=80`, `npm test` |
| Final | `docker-compose up -d`, `curl localhost:8000/health` |

---

## ENVIRONMENT VARIABLES

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ptoshield
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
OPENAI_API_KEY=
OPENAI_MODEL=
DODO_API_KEY=
DODO_WEBHOOK_SECRET=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
VITE_API_URL=http://localhost:8000
```

---

## NEXT STEP

/execute-prp PRPs/ptoshield-ai-prp.md
