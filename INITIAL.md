# INITIAL.md - PTOShield AI Product Definition

> Your PTO is approved. Your peace is protected. 😂

---

## PRODUCT

### Name
PTOShield AI

### Description
A funny AI-powered PTO assistant. It generates office-safe out-of-office replies to messages that interrupt your leave, tracks handover tasks, and scores how ready you are to disappear on vacation.

### Target User
Corporate employees, IT professionals, HR teams, managers and remote workers who get disturbed by emails, Teams messages and meetings during leave.

### Type
- [x] SaaS (Software as a Service)

---

## TECH STACK

### Backend
- [x] FastAPI + Python 3.11+

### Frontend
- [x] React + Vite + TypeScript

### Database
- [x] PostgreSQL + SQLAlchemy + Alembic

### Authentication
- [x] Email/Password + Google OAuth (JWT access + refresh)

### UI Framework
- [x] Chakra UI (light/dark mode, Framer Motion for light animations)

### Payments
- [x] Dodo Payments (demo mode when credentials are missing)

### AI
- [x] OpenAI API, called server-side only; template fallback when `OPENAI_API_KEY` is unset

---

## MODULES

### Module 1: Authentication (Required)

**Models:**
- User: id, email, hashed_password, full_name, is_active, is_verified, oauth_provider, plan, created_at
- RefreshToken: id, user_id, token, expires_at, revoked

**API Endpoints:**
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout
- GET /api/v1/auth/google, GET /api/v1/auth/google/callback
- GET /api/v1/auth/me, PUT /api/v1/auth/me

**Frontend Pages:** /login, /register, /settings (profile, theme, plan)

---

### Module 2: PTO Planner

**Description:** Plan leaves and see countdown and status.

**Models:**
- PtoPlan: id, user_id, employee_name, start_date, end_date, backup_person, contact_email, reason (optional), reminder_sent_at, created_at

**Rules:**
- end_date >= start_date
- status is computed, not stored: Upcoming (today < start), Active (start <= today <= end), Completed (today > end)
- days_remaining is computed (days until start, or until end when Active)

**API Endpoints:**
- GET /api/v1/pto-plans, POST /api/v1/pto-plans
- GET/PUT/DELETE /api/v1/pto-plans/{id}

**Frontend Pages:** /pto (list), /pto/new and /pto/:id/edit (form), /pto/:id (details with countdown)

---

### Module 3: Funny AI Reply Generator

**Description:** Paste a colleague's message, pick a tone, get a funny office-safe reply.

**Models:**
- AiReply: id, user_id, incoming_message, tone, generated_reply, is_saved, source (openai | template), created_at

**Rules:**
- Tones: professional, funny, savage_office_safe, corporate_diplomatic
- Free plan: 5 AI replies per calendar month (generate and regenerate count). Pro and Team: unlimited. Over-limit returns 402 with an upgrade message
- OpenAI called server-side; on missing key or API failure, use fallback templates per tone and mark source = template (template replies do not count toward the limit)
- Output must be office-safe: no insults, profanity or HR-risky content

**API Endpoints:**
- POST /api/v1/replies/generate (message, tone)
- POST /api/v1/replies/{id}/regenerate
- PUT /api/v1/replies/{id} (edit text, toggle is_saved)
- GET /api/v1/replies?saved=true
- DELETE /api/v1/replies/{id}
- GET /api/v1/replies/usage (used, limit)

**Frontend Pages:** /replies/new (generator with copy, regenerate, edit, save), /replies (saved replies)

---

### Module 4: Smart Handover Assistant

**Models:**
- HandoverTask: id, user_id, pto_plan_id (optional), name, description, priority (low | medium | high), backup_person, deadline, status (pending | completed), created_at

**API Endpoints:**
- GET/POST /api/v1/handover-tasks
- PUT/DELETE /api/v1/handover-tasks/{id}
- POST /api/v1/handover-tasks/{id}/toggle
- POST /api/v1/handover-tasks/summary (AI or template handover summary, copyable)

**Frontend Pages:** /handover (dashboard), /handover/new and /handover/:id/edit (task form), /handover/summary

---

### Module 5: PTO Dashboard

**Description:** Overview and Vacation Readiness Score.

**Shows:** upcoming vacation, days remaining, saved replies count, pending handover tasks, readiness score

**Score (0-100):**
- 70% handover completion (completed / total tasks of the next or active PTO; no tasks = 0 for this part)
- 30% backup person assigned on the PTO plan
- Messages: 0-30 "Your vacation is in danger. Your inbox owns you." 😂 · 31-70 "Almost free! Your manager is still emotionally processing it." · 71-100 "Congratulations! You're officially unavailable to capitalism." 🏝️

**API Endpoints:** GET /api/v1/dashboard

**Frontend Pages:** /dashboard

---

### Module 6: Billing (Dodo Payments)

**Plans:** Free (5 AI replies/month) · Pro $4.99/month (unlimited replies) · Team $19/month (up to 10 users)

**Models:**
- Subscription: id, user_id, plan, status, dodo_customer_id, dodo_subscription_id, current_period_end, created_at

**Rules:**
- Credentials from env vars. If `DODO_API_KEY` is unset, run in clearly labeled DEMO MODE: the UI shows a "Demo mode, no real payment" banner and plan changes must not be presented as real payments
- Plan changes in live mode only via verified Dodo webhook

**API Endpoints:**
- GET /api/v1/billing/plans
- POST /api/v1/billing/checkout
- POST /api/v1/billing/webhook (signature verified)
- GET /api/v1/billing/subscription

**Frontend Pages:** /pricing (public)

---

### Module 7: Email Reminders

**Description:** Email the user before leave starts.

**Rules:** daily job finds PTO plans starting in 1 day with reminder_sent_at null; sends via SMTP env vars; if SMTP unset, log instead of sending (no false claim of sent)

---

### Landing Page
/ - hero with tagline, feature cards, pricing teaser, CTA. Vacation-inspired visuals and emojis, rounded cards, light animations, mobile responsive.

---

## MVP SCOPE

### Must Have (MVP, build first)
- [x] PTO Planner (CRUD, countdown, status)
- [x] Funny AI Reply Generator (tones, regenerate, edit, copy, save, template fallback)
- [x] Handover Checklist (CRUD, complete, summary)
- [x] Vacation Readiness Score on dashboard
- [x] Copy and share replies (copy-to-clipboard, plus the browser share sheet where supported)
- [x] User registration and login, per-user data isolation

### Then
- [ ] Pricing page and Dodo integration (with demo mode)
- [ ] Google OAuth
- [ ] Email reminders
- [ ] Dark/light mode polish, landing page polish

### Post-MVP
- [ ] Team plan seat management (invite up to 10 users)
- [ ] File uploads (not required)

---

## ACCEPTANCE CRITERIA

### Authentication
- [ ] User can register and log in with email/password
- [ ] Google OAuth login works when credentials are configured
- [ ] JWT access/refresh works; protected routes redirect to /login
- [ ] A user can only read or change their own records (verified by tests)

### PTO Planner
- [ ] Create, edit, delete, view plans; end date before start date is rejected
- [ ] Status shows Upcoming / Active / Completed correctly; countdown correct

### AI Reply Generator
- [ ] All four tones work; regenerate, edit, copy and save work
- [ ] Works without an OpenAI key via fallback templates
- [ ] Free plan blocked after 5 AI replies per month with an upgrade prompt

### Handover
- [ ] CRUD and completion toggle work; summary generated and copyable

### Dashboard
- [ ] Readiness score and message match the rules above

### Billing
- [ ] Pricing page shows 3 plans; DEMO MODE is clearly labeled without credentials
- [ ] Webhook signature verified before changing a plan

### Quality
- [ ] All API endpoints documented in OpenAPI
- [ ] Backend test coverage 80%+
- [ ] Frontend TypeScript strict mode passes
- [ ] Seed script creates demo user and sample data
- [ ] `.env.example` has no secrets; README has exact Windows PowerShell run steps
- [ ] Docker builds and runs successfully

---

## SPECIAL REQUIREMENTS

### Security
- [x] Rate limiting on auth and AI endpoints
- [x] Input validation on all endpoints
- [x] SQL injection prevention (ORM only)
- [x] XSS prevention
- [x] CSRF state check on OAuth
- [x] OpenAI key and Dodo credentials never exposed to the frontend

### Integrations
- [x] OpenAI (optional key, fallback templates)
- [x] Dodo Payments (optional, demo mode)
- [x] SMTP email for reminders (optional)
- [ ] File upload service (not needed)

---

## AGENTS

| Agent | Role | Works On |
|-------|------|----------|
| DATABASE-AGENT | Models and migrations | User, RefreshToken, PtoPlan, AiReply, HandoverTask, Subscription |
| BACKEND-AGENT | API endpoints and services | All modules' backends, AI service, billing, reminders |
| FRONTEND-AGENT | UI pages and components | All modules' frontends, landing, theme |
| DEVOPS-AGENT | Docker, CI/CD, environments | Infrastructure |
| TEST-AGENT | Unit and integration tests | All code |
| REVIEW-AGENT | Security and code quality audit | All code |

---

# READY?

```bash
/generate-prp INITIAL.md
```

Then:

```bash
/execute-prp PRPs/ptoshield-ai-prp.md
```
