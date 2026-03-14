# Clean Quarter — Чист Квартал

> A gamified neighborhood cleanup platform for Sofia, Bulgaria.

**Live:** https://cleanquarter.netlify.app

---

## Table of Contents

1. [Project Description](#1-project-description)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [Security — Row-Level Security](#5-security--row-level-security)
6. [Local Development Setup](#6-local-development-setup)
7. [Key Folders & Files](#7-key-folders--files)
8. [Pages & Features](#8-pages--features)
9. [Testing](#9-testing)

---

## 1. Project Description

**Clean Quarter** (Чист Квартал) is a web platform that gamifies neighborhood cleanups in Sofia. Residents organize and join cleanup campaigns, upload photo evidence, and earn points that can be redeemed for local rewards.

### Who can do what

| Role | Capabilities |
|------|-------------|
| **Anonymous** | Browse campaigns and rewards (read-only) |
| **User** | Register/login, create campaigns, join campaigns, upload before/after photos, earn points, redeem rewards, view own profile and transaction history |
| **Admin** | Everything a user can do + approve/reject cleanup submissions, award points, manage disposal points, manage user roles, view all reports |
| **Superadmin** | Everything an admin can do + cannot be demoted (enforced at DB level) |

### Core User Journey

```
Register → Browse Map → Create or Join Campaign → Upload "After" Photo
→ Admin Reviews → Approved → Points Awarded → Redeem Rewards
```

### Neighborhoods Covered

Studentski Grad · Darvenitsa · Musagenitsa · Vitosha (VEC) · Malinova Dolina

---

## 2. Architecture

Classical client-server application with a serverless backend (Supabase):

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                                                                  │
│   Vanilla JavaScript (ES Modules)  ·  Bootstrap 5  ·  HTML/CSS  │
│                    Built with Vite                               │
│                   Deployed on Netlify                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │  HTTPS / REST API (fetch)
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                       SUPABASE (BaaS)                            │
│                                                                  │
│  ┌──────────────┐  ┌───────────────────┐  ┌──────────────────┐  │
│  │  Auth (JWT)  │  │ PostgreSQL (RLS)  │  │ Storage (photos) │  │
│  └──────────────┘  └───────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                       MAP LAYER                                  │
│             Leaflet.js  ·  OpenStreetMap tiles                   │
└─────────────────────────────────────────────────────────────────┘
```

**Design pattern:** Service-oriented — UI (HTML/CSS) is separated from business logic (`src/services/`) and from utilities (`src/utils/`). Pages load scripts as ES Modules; no build-time framework.

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| UI Components | Bootstrap 5 (CDN) |
| Build Tool | Vite |
| Maps | Leaflet.js + OpenStreetMap |
| Backend | Supabase (Auth + PostgreSQL + Storage) |
| Database | PostgreSQL with Row-Level Security |
| File Storage | Supabase Storage (S3-compatible) |
| Hosting | Netlify |
| Source Control | GitHub |
| Unit/Integration Testing | Vitest |
| E2E Testing | Cypress |
| Internationalisation | Custom i18n module (Bulgarian / English) |

---

## 4. Database Schema

### Tables Overview

```
auth.users  (managed by Supabase Auth)
     │
     │ 1:1 (trigger creates on signup)
     ▼
┌────────────────────┐          ┌──────────────────────┐
│      profiles      │          │    disposal_points    │
├────────────────────┤          ├──────────────────────┤
│ id          UUID PK│          │ id           UUID PK  │
│ username    TEXT   │          │ name         TEXT     │
│ role        TEXT   │          │ description  TEXT     │
│ points_balance INT │          │ latitude     FLOAT    │
│ neighborhood TEXT  │          │ longitude    FLOAT    │
│ avatar_url  TEXT   │          │ neighborhood TEXT     │
│ is_superadmin BOOL │          │ address      TEXT     │
│ created_at  TSTZ   │          │ deleted_at   TSTZ     │
└────────┬───────────┘          └──────────────────────┘
         │
         │ 1:N (created_by)
         ▼
┌────────────────────────────────┐
│          campaigns             │
├────────────────────────────────┤
│ id              UUID PK        │
│ title           TEXT           │
│ description     TEXT           │
│ location_lat    FLOAT          │
│ location_lng    FLOAT          │
│ neighborhood    TEXT           │
│ status          TEXT           │ ← active | completed | cancelled
│ before_photo_url TEXT          │
│ created_by      UUID FK→profiles│
│ disposal_point_id UUID FK      │
│ deleted_at      TSTZ           │
│ created_at      TSTZ           │
└──────────────┬─────────────────┘
               │
               │ 1:N
               ▼
┌────────────────────────────────┐
│        participations          │
├────────────────────────────────┤
│ id              UUID PK        │
│ campaign_id     UUID FK→campaigns│
│ user_id         UUID FK→profiles│
│ status          TEXT           │ ← pending | approved | rejected
│ after_photo_url TEXT           │
│ points_earned   INT            │
│ deleted_at      TSTZ           │
│ created_at      TSTZ           │
└──────────────┬─────────────────┘
               │
               │ (approval triggers)
               ▼
┌────────────────────────────────┐      ┌─────────────────────┐
│      point_transactions        │      │       rewards        │
├────────────────────────────────┤      ├─────────────────────┤
│ id          UUID PK            │      │ id        UUID PK   │
│ user_id     UUID FK→profiles   │      │ title     TEXT      │
│ amount      INT                │      │ description TEXT    │
│ type        TEXT               │ ◄──  │ cost      INT       │
│ description TEXT               │spent │ category  TEXT      │
│ campaign_id UUID FK            │      │ image_url TEXT      │
│ reward_id   UUID FK→rewards    │      │ quantity_available  │
│ created_at  TSTZ               │      │ deleted_at TSTZ     │
└────────────────────────────────┘      └─────────────────────┘

Additional tables: comments · notifications · reports
```

### Relationships

| From | To | Type | Description |
|------|----|------|-------------|
| `profiles` | `campaigns` | 1:N | User creates campaigns |
| `profiles` | `participations` | 1:N | User joins campaigns |
| `campaigns` | `participations` | 1:N | Campaign has many participants |
| `participations` | `point_transactions` | 1:1 | Approval creates a transaction (via DB trigger) |
| `profiles` | `point_transactions` | 1:N | User earns/spends points |
| `rewards` | `point_transactions` | 1:N | Points spent on a reward |
| `campaigns` | `disposal_points` | N:1 | Campaign near a disposal point |

### DB Triggers (automatic actions)

| Trigger | On | Action |
|---------|-----|--------|
| `handle_new_user` | `auth.users` INSERT | Creates `profiles` row on signup |
| `trigger_point_transaction_on_approval` | `participations` UPDATE | Creates `point_transactions` row when status → `approved` |
| `enforce_participation_integrity` | `participations` UPDATE | Blocks users from self-approving or changing `points_earned` |
| `trigger_notify_participation_approved` | `participations` UPDATE | Creates notification when approved |
| `trigger_notify_campaign_join` | `participations` INSERT | Notifies campaign creator of new participant |

---

## 5. Security — Row-Level Security

All tables have RLS enabled. Policies enforce:

| Table | Policy |
|-------|--------|
| `profiles` | Authenticated users can read; only own row UPDATE; admin can update roles |
| `campaigns` | Anyone (incl. anon) can READ active; authenticated users INSERT; creator or admin UPDATE/DELETE |
| `participations` | Authenticated users can READ/INSERT own; UPDATE restricted by trigger (no self-approval) |
| `point_transactions` | Users see only own rows; INSERT only via admin or DB trigger |
| `disposal_points` | Authenticated users READ; admin-only INSERT/UPDATE/DELETE |
| `rewards` | Anyone (incl. anon) can READ; admin-only INSERT/UPDATE/DELETE |
| `reports` | Authenticated INSERT; user sees own; admin sees all |
| `notifications` | Users see and update own; INSERT via DB triggers only |

**Authorization is enforced at two independent layers:** PostgreSQL RLS policies (data layer — cannot be bypassed from the frontend) and JavaScript role checks (UX layer — redirects and conditional rendering). Neither layer alone is sufficient; together they prevent privilege escalation even if the frontend is bypassed.

---

## 6. Local Development Setup

### Prerequisites

- **Node.js** v18+ — [nodejs.org](https://nodejs.org)
- **npm** v9+
- **Supabase account** — [supabase.com](https://supabase.com) (free tier is sufficient)
- **Git**

### Step 1 — Clone the repository

```bash
git clone https://github.com/hristiyanstoilov/clean-quarter.git
cd clean-quarter
npm install
```

### Step 2 — Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Note your **Project URL** and **anon public key** from
   Settings → API

### Step 3 — Apply database migrations

Run all SQL files in `supabase/migrations/` in chronological order via the
Supabase **SQL Editor** (Dashboard → SQL Editor), or use the Supabase CLI:

```bash
supabase db push
```

Optionally seed development data:

```bash
# Paste contents of supabase/seed.sql into SQL Editor
```

### Step 4 — Configure environment variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> **Never** commit `.env.local` — it is already in `.gitignore`.

### Step 5 — Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other commands

```bash
npm run build          # Production build → dist/
npm run preview        # Preview production build locally
npm test               # Run unit + integration tests (Vitest)
npx cypress open       # Open Cypress E2E test runner
```

### Test accounts

For local dev, register a new account and optionally set `role = 'admin'` in the `profiles` table via Supabase Dashboard → Table Editor.

### Password requirements

All passwords must have: 8+ characters · uppercase · lowercase · digit.
Enforced in `src/services/validation.js` and checked live in forms.

---

## 7. Key Folders & Files

```
.
├── index.html                      # Landing page (login / register)
├── vite.config.js                  # Vite build config
├── vitest.config.js                # Vitest test config
├── netlify.toml                    # Netlify deployment config (redirects)
│
├── src/
│   ├── main.js                     # App entry point (auth guard, routing)
│   │
│   ├── pages/                      # HTML pages
│   │   ├── dashboard.html          # Map + campaign list
│   │   ├── campaign-detail.html    # Campaign info, join, photo upload
│   │   ├── create-campaign.html    # Create new cleanup campaign
│   │   ├── profile.html            # User profile, history, settings
│   │   ├── admin.html              # Admin panel
│   │   └── rewards.html            # Rewards shop
│   │
│   ├── scripts/                    # Page-specific JS controllers
│   │   ├── dashboard.js
│   │   ├── campaign-detail.js
│   │   ├── create-campaign.js
│   │   ├── profile.js
│   │   ├── admin.js
│   │   └── rewards.js
│   │
│   ├── services/                   # Business logic & API calls
│   │   ├── supabase.js             # Supabase client + all DB operations
│   │   ├── auth.js                 # Login, register, logout, session
│   │   ├── map.js                  # Leaflet map initialisation & markers
│   │   ├── notifications.js        # Notification bell — fetch, render, realtime
│   │   ├── points.js               # Points calculation logic
│   │   ├── storage.js              # Photo upload to Supabase Storage
│   │   ├── validation.js           # Form validation (password, fields)
│   │   ├── errorHandler.js         # Centralised error handling
│   │   ├── logger.js               # Dev/prod logging
│   │   └── pwa.js                  # PWA service worker registration
│   │
│   ├── utils/                      # Utility functions
│   │   ├── i18n.js                 # Internationalisation (BG/EN switching)
│   │   ├── helpers.js              # formatDate, debounce, etc.
│   │   ├── env.js                  # Environment variable access
│   │   └── demoMode.js             # Offline/demo mode (localStorage)
│   │
│   ├── state/
│   │   └── store.js                # Lightweight global state store
│   │
│   ├── components/                 # Reusable UI helpers
│   │   ├── passwordToggle.js       # Show/hide password button
│   │   ├── passwordStrength.js     # Live password strength meter
│   │   └── navbar.html             # Shared navigation bar
│   │
│   ├── i18n/
│   │   ├── bg.json                 # Bulgarian translations
│   │   └── en.json                 # English translations
│   │
│   └── assets/                     # CSS per page
│       ├── style.css               # Global design tokens & base styles
│       ├── dashboard.css
│       ├── campaign-detail.css
│       ├── create-campaign.css
│       ├── profile.css
│       ├── admin.css
│       └── rewards.css
│
├── supabase/
│   ├── migrations/                 # 43 timestamped SQL migration files
│   │                               # (mirror of what is applied in Supabase)
│   ├── schema.sql                  # Full schema snapshot (reference only)
│   └── seed.sql                    # Development seed data
│
├── tests/                          # Vitest unit + integration tests
│   ├── rls-policy.test.js          # RLS integration tests (real DB)
│   ├── validation.test.js
│   ├── helpers.test.js
│   ├── errorHandler.test.js
│   └── ...
│
├── cypress/
│   └── e2e/
│       ├── 00-critical-paths.cy.js # Auth, campaign CRUD, participation
│       ├── 01-admin-workflows.cy.js
│       ├── 02-campaign-details.cy.js
│       └── 03-auth-flows.cy.js
│
└── docs/                           # Additional guides & architecture docs
```

---

## 8. Pages & Features

| Page | Route | Who can access | Description |
|------|-------|----------------|-------------|
| Landing | `/` | Everyone | Login and register |
| Dashboard | `/dashboard` | Authenticated | Interactive map + campaign list with filters |
| Create Campaign | `/create-campaign` | Authenticated | New cleanup with map picker and before-photo |
| Campaign Detail | `/campaign-detail?id=...` | Authenticated | View details, join, upload after-photo, comments |
| Profile | `/profile` | Authenticated | Point balance, history, avatar, language toggle |
| Admin Panel | `/admin` | Admin only | Approve/reject proofs, manage users & disposal points |
| Rewards | `/rewards` | Authenticated | Browse and redeem rewards with points |
| Demo Mode | N/A (localStorage) | Everyone | Full platform simulation — no account or internet required |

### Global UI features (present on all pages)

| Feature | Description |
|---------|-------------|
| Notification bell 🔔 | Real-time badge in navbar — shows unread count, dropdown with last 20 notifications (approval, points, campaign updates), mark-as-read per item or all at once. Populated automatically by DB triggers. Hidden for demo users. |
| Language selector | Switch between Bulgarian and English; preference persisted in localStorage |

---

## 9. Testing

### Unit & Integration tests (Vitest)

```bash
npm test                            # Run all tests
npx vitest run tests/rls-policy.test.js   # RLS tests only (requires .env.test)
```

RLS integration tests require a `.env.test` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_USER_EMAIL=user@example.com
SUPABASE_USER_PASSWORD=password
SUPABASE_ADMIN_EMAIL=admin@example.com
SUPABASE_ADMIN_PASSWORD=password
```

Current coverage: **449 tests · 44 test files** (28 RLS tests skipped without `.env.test`)

### E2E tests (Cypress)

```bash
npx cypress open      # Interactive
npx cypress run       # Headless CI
```

---

## 10. Product Documentation

Full enterprise-grade documentation is available in [`docs/PRODUCT_DOCUMENTATION.md`](docs/PRODUCT_DOCUMENTATION.md), covering:

- Executive summary & problem statement
- Product vision, strategy & business model
- User segments, personas & permissions matrix
- Core user journeys (6 flows with failure states)
- Feature breakdown (8 features with technical details)
- System architecture & scalability analysis
- Non-functional requirements (performance, security, reliability)
- Trade-offs & product decisions
- Gaps for enterprise readiness
- Suggested product roadmap (short / mid / long-term)

---

## Contributing

1. Create a branch: `git checkout -b feature/your-feature`
2. Commit with clear messages following the existing style
3. Open a pull request against `main`
4. All tests must pass before merging

---

## License

MIT
