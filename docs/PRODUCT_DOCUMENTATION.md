# CLEAN QUARTER — Enterprise Product Documentation

**Version:** 1.4 | **Date:** March 28, 2026 | **Classification:** Internal

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Strategy](#2-product-vision--strategy)
3. [User Segments & Personas](#3-user-segments--personas)
4. [Core User Journeys](#4-core-user-journeys)
5. [Feature Breakdown](#5-feature-breakdown)
6. [System Architecture](#6-system-architecture)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Trade-offs & Product Decisions](#8-trade-offs--product-decisions)
9. [Gaps for Enterprise Readiness](#9-gaps-for-enterprise-readiness)
10. [Suggested Product Roadmap](#10-suggested-product-roadmap)
11. [Design Audit](#11-design-audit)

---

## 1. Executive Summary

### Product Overview

**Clean Quarter** (Чист Квартал) is a browser-based, gamified civic engagement platform that enables Sofia residents to organize, participate in, and track neighborhood cleanup campaigns. The platform connects community members with cleanup opportunities through an interactive map, rewards participation with a points economy, and gives local administrators tools to verify and approve cleanup evidence.

**Live:** https://cleanquarter.netlify.app

---

### Problem Statement

Urban neighborhood cleanup in Sofia suffers from three root problems:

1. **Coordination gap** — residents who want to help have no structured way to discover or organize cleanup events near them
2. **Accountability gap** — there is no verifiable evidence trail that cleanups happened or were effective
3. **Motivation gap** — volunteer participation is unsustainable without tangible, recurring incentives

---

### Target Market

**Primary:** Civic-minded residents of 5 Sofia neighborhoods: Studentski Grad, Darvenitsa, Musagenitsa, Vitosha (VEC), Malinova Dolina

**Secondary:** Local NGOs, district administrations, and businesses looking to sponsor community rewards

---

### Core Value Proposition

> *"Sofia's first verifiable, gamified cleanup network — where every bag of trash is worth points."*

The platform converts volunteer effort into a measurable, auditable digital asset (points), creating a feedback loop that sustains participation beyond single events.

---

### Differentiation

| Dimension | Clean Quarter | Generic social platforms | Traditional volunteer apps |
|-----------|--------------|--------------------------|----------------------------|
| Proof of work | Photo evidence + admin approval | None | Optional |
| Incentive system | Points → Rewards economy | None | Badges only |
| Geo-targeting | Neighborhood-scoped map | Global feed | Location-based push only |
| Offline capability | PWA + service worker | No | Varies |
| Admin oversight | DB-enforced RLS approval | None | Manual |

---

## 2. Product Vision & Strategy

### Vision Statement

> *Чист квартал за всеки — earned, not given.*

A Sofia where every neighborhood has an active cleanup community, where participation is verifiable, and where local businesses close the loop by rewarding residents for their environmental impact.

---

### Strategic Positioning

**Current stage:** Community-validated MVP, geographically constrained to 5 neighborhoods, manually deployed, single-city scope.

**Positioning:** Civic tech / green gamification — sits at the intersection of community organizing tools, environmental accountability platforms, and local loyalty programs.

---

### Business Model

**Current state (Phase 1 — grant/public-funded):**
- Platform is free for all residents. Rewards are sponsor-donated. No payment processing. No revenue.

**Revised model — 9 revenue pillars (full strategy in [ROADMAP.md § Business Model](../ROADMAP.md) · implementation plan with code estimates and BD steps in [docs/BUSINESS_MODEL.md](BUSINESS_MODEL.md)):**

| Pillar | Timeline | Products | Est. ARR |
|--------|----------|----------|----------|
| **B2C Freemium** | Q3 2026 | "Clean Quarter Pro" (5 лв/month) — early reward access, Pro badge, private campaigns, impact export | ~1,250–12,500 лв |
| **B2B Sponsorships** | Q2 2026 | "Adopt a Spot" (500–2,000 лв/year), Co-branded Challenges (10,000–20,000 лв/event), Reward Pool Sponsorship (5,000 лв/quarter), Corporate Volunteer Day (300–1,000 лв/event) | ~18,500 лв/year |
| **B2B2G Institutional SaaS** | Q4 2026 | School certificates (200 лв/year), Corporate ESG (150–500 лв/year), NGO Grant Reports (300 лв/report), Municipal SLA (20,000–40,000 лв/year/district), Verified Organizer (50–100 лв/year) | ~30,000–150,000+ лв ARR |
| **Data & Reports** | 2027 | "Clean City Index" annual report, API access tier (50–200 лв/month), Neighborhood Civic Score widget for real estate, anonymized dataset licensing | ~12,000–30,000 лв/year |
| **Community Finance** | 2027 | "Pledge Drive" crowdfunding (10% fee on fulfilled pledges), "Green Wallet" points→NGO donations (5–8% platform fee) | ~5,000–15,000 лв/year |
| **Physical Products** | 2027 | Monthly "Volunteer Box" (20 лв/month subscription), "Cleanup Starter Kit" (25 лв one-time) | ~4,000–8,000 лв/month at scale |
| **Micro-credentialing** | 2027 | LinkedIn verifiable credentials (10–20 лв each), physical "Impact Certificate" (15–20 лв) | ~5,000–20,000 лв/year |
| **Untapped B2B** | 2027 | HOA/building management (200 лв/year), Property Developer Vitality Reports (1,000–3,000 лв), Employer benefit bulk (40 лв/employee/year), Insurance micro-discount API | ~10,000–30,000 лв/year |
| **Civic OS** | 2028 | Non-cleanup civic campaign tool (100–500 лв/campaign), Voluntourism partnership (3,000–5,000 лв/year), GaaS licensing (500–1,000 лв/month/tenant) | ~20,000–50,000 лв/year |

**Design principle:** Core civic participation (join campaign, earn points, redeem rewards) is **free forever**. All paid features monetize analytics, status, compliance reporting, brand visibility, or physical goods — never participation itself.

**Revenue trajectory:** 0 лв (2026 Q1) → ~30,000 лв (2026 Q4) → ~120,000 лв ARR (2027) → ~250,000+ лв ARR (2028 with municipal contracts + Civic OS).

---

### Expansion Potential

The current 5-neighborhood implementation is a deliberate geographic constraint, not a technical limitation. The neighborhood list is a hardcoded array — expanding requires a one-line code change + a DB migration. The architecture supports multi-city deployment today.

---

## 3. User Segments & Personas

### Segment 1: The Active Resident (Primary User)

**Profile:** 20–45, environmentally conscious, lives or studies in target neighborhoods, smartphone-native

**Goals:** Contribute to neighborhood improvement, track personal impact, earn rewards

**Flows used:** Register → Browse map → Join campaign → Upload proof → Redeem rewards

**Pain points handled by product:**
- Discovers campaigns near them via neighborhood-filtered dashboard
- Gets notified when their submission is approved
- Sees concrete reward for effort (points → goods)

---

### Segment 2: The Organizer (Campaign Creator)

**Profile:** Community activist, student association leader, local NGO volunteer

**Goals:** Mobilize participation, coordinate cleanup logistics, upload before-photo evidence

**Flows used:** Create campaign (title, description, map pin, before photo) → Monitor participants → View campaign detail

**Implicit product decision:** Organizer and participant are the same user type — no separate "organizer" role in schema. Any authenticated user can create campaigns.

---

### Segment 3: The Admin (Trust & Safety Layer)

**Profile:** Platform operator or trusted community moderator, likely 1–3 people in current deployment

**Goals:** Verify photo evidence, prevent gaming the points system, manage user roles, monitor reports

**Flows used:** Admin panel → Review pending participations → Approve/reject with photo → Manage users → Handle reports

**Permissions enforced in code:**
- Cannot self-approve (DB trigger blocks it)
- Cannot demote superadmin
- Role changes are logged immutably

---

### Segment 4: Anonymous Visitor

**Access:** Read-only. Can view active campaigns and rewards. Cannot create, join, or interact.

**Business rationale:** SEO discoverability of campaigns + low-friction for prospective users to evaluate before registering.

---

### Permission Logic Analysis

The system implements a **two-tier RBAC** with a superadmin escape hatch:

```
anonymous  → read (campaigns, rewards)
user       → anonymous + create/join campaigns, upload, redeem, comment, report
admin      → user + approve/reject, manage users, manage disposal points, manage rewards
superadmin → admin + cannot be demoted (DB-enforced flag)
```

**Key security insight:** Authorization is enforced at **two independent layers** — RLS policies in PostgreSQL AND application-level checks in JS. Neither layer alone is sufficient; together they prevent privilege escalation even if the frontend is bypassed.

---

### Permissions Matrix

| Feature | Regular User | Admin | Superadmin |
|---------|:------------:|:-----:|:----------:|
| Create Campaign | ✓ | ✓ | ✓ |
| Join Campaign | ✓ | ✓ | ✓ |
| Upload After Photo | ✓ | ✓ | ✓ |
| View Dashboard | ✓ | ✓ | ✓ |
| Edit Own Profile | ✓ | ✓ | ✓ |
| View Rewards | ✓ | ✓ | ✓ |
| Redeem Rewards | ✓ | ✓ | ✓ |
| Comment on Campaign | ✓ | ✓ | ✓ |
| Report Content | ✓ | ✓ | ✓ |
| Approve Participations | ✗ | ✓ | ✓ |
| Reject Participations | ✗ | ✓ | ✓ |
| Make User Admin | ✗ | ✓ | ✓ |
| Remove Admin | ✗ | ✓ (except self) | ✓ |
| View All Users | ✗ | ✓ | ✓ |
| View Role Audit Log | ✗ | ✓ | ✓ |
| Delete Any Campaign | ✗ | ✓ | ✓ |
| Delete Any Comment | ✗ | ✓ | ✓ |
| Manage Reports | ✗ | ✓ | ✓ |
| Be Demoted | ✓ | ✓ | ✗ (DB-enforced) |

---

## 4. Core User Journeys

### Journey 1: New User Activation

```
1. Landing page → Register (email, password, neighborhood)
2. Password strength validated client-side (8+, uppercase, lowercase, digit)
3. Supabase Auth creates auth.users row
4. DB trigger auto-creates profiles row with role='user', points_balance=0
5. Redirect to Dashboard
6. Neighborhood filter pre-set to user's neighborhood
7. Map loads campaign markers
```

**Failure states handled:**
- Invalid email format → inline error
- Weak password → strength meter + blocking validation
- Email already registered → Supabase error surfaced
- No neighborhood selected → blocking validation

---

### Journey 2: Campaign Participation (Core Value Loop)

```
1. Dashboard → Click campaign marker or card → Campaign Detail
2. Click "Join Campaign" → Creates participations record (status=pending)
3. Upload "after" photo (JPEG/PNG/WebP, max 5MB)
4. Admin reviews in Admin Panel → Approves
5. DB trigger fires:
   - points_earned = 20 on participation
   - point_transactions row created (type=earned, amount=20)
   - profiles.points_balance += 20
   - notification created (type=approval)
6. User sees notification bell badge → Opens dropdown → "Approved! +20 points"
7. User navigates to Rewards → Sees updated balance
8. Redeems reward → points_balance decreases → transaction (type=spent) created
```

**Edge cases handled:**
- User cannot participate twice (DB unique constraint: user_id + campaign_id)
- Admin cannot approve their own participation (DB trigger blocks self-approval)
- Points balance cannot go below reward cost (redemption validates balance >= cost)

---

### Journey 3: Campaign Creation

```
1. Authenticated user → /create-campaign
2. Fill title (min 5, max 100 chars), description (min 20, max 1000 chars)
3. Select neighborhood from dropdown
4. Select category (park / street / water / other) — optional
5. Set scheduled date + start time (required), end time (optional)
6. Set max participants (optional, server-enforced capacity)
7. Select participation points: 10 / 20 / 30 / 50 ⭐ (default 20)
8. Click map to pin exact location → lat/lng captured (must be within Sofia bounds)
9. Upload before photo (JPEG/PNG/WebP, max 5MB, compressed client-side before upload)
10. Submit:
    - Rate limit check: max 5 campaigns per 24h (DB RPC)
    - First-time creator: status = 'pending_review' (moderation queue)
    - Returning creator (≥1 active/completed campaign): status = 'active'
    - Creator auto-joined as first participant
11. pending_review → success dialog + await admin approval
    active → success toast → redirect to Dashboard
```

**Failure states handled:**
- No map pin → blocking validation
- Location outside Sofia bounding box → client-side + server-side rejection
- Photo wrong format or oversized → client-side rejection before upload
- Title < 5 chars or description < 20 chars → JS + HTML validation
- Past date or end time before start time → validation error
- Rate limit exceeded → warning dialog, no insert
- Upload fails → orphaned file cleaned up from Storage automatically

---

### Journey 4: Admin Approval Workflow

```
1. Admin navigates to /admin
2. Role check: profiles.role === 'admin' (RLS + JS redirect)
3. Pending table loads participations where status='pending' with after_photo_url
4. Admin clicks photo thumbnail → full-size modal
5. Click Approve:
   - Supabase RPC: approve_participation(participation_id)
   - status → approved, points_earned = 20
   - point_transaction row inserted
   - profiles.points_balance += 20
   - notification inserted via DB trigger
6. Row removed from pending table
```

**Failure states handled:**
- Non-admin visits /admin → JS redirect to landing page
- RLS blocks direct DB manipulation even if redirect bypassed
- Rejection reason is optional — gap noted in Section 9

---

### Journey 5: Demo Mode Evaluation

```
1. Landing → "Demo Mode (Admin)" button
2. demo-admin-001 user created in localStorage (no Supabase required)
3. 5 sample campaigns, 3 participations, 10 rewards, 5 transactions seeded
4. All 7 pages fully operational via localStorage reads/writes
5. Approve/reject/redeem all work and persist within session
6. Notifications skipped (no Supabase Realtime in demo)
```

**Business value:** Enables zero-friction stakeholder demos and evaluations without exposing production data or requiring account creation.

---

### Journey 6: Report & Moderation

```
1. Authenticated user views a campaign or profile
2. Clicks "Report" → selects reason (spam/inappropriate/harassment/fake/other)
3. Adds optional description → submits
4. reports row created (status=pending)
5. Admin views reports in Admin Panel → reviews, updates status
6. DB trigger fires notify_report_resolved → user notified
```

**Failure states handled:**
- Duplicate report from same user on same entity within 24h → DB trigger blocks it
- Report reason required (enum constraint at DB level)

---

### Journey 7: Forgot Password / Password Reset

```
1. Landing page → Click "Забравена парола / Forgot password"
2. SweetAlert2 dialog prompts for email address
3. supabase.auth.resetPasswordForEmail() sends reset email
4. User clicks link in email → redirected to /profile#type=recovery&access_token=...
5. profile.js detects type=recovery in URL hash
6. Hash cleared from URL immediately (prevents re-trigger on refresh)
7. SweetAlert2 modal prompts for new password (validated: 8+, uppercase, lowercase, digit)
8. supabase.auth.updateUser({ password }) updates the password
9. signOut() → redirect to / → user logs in with new password
```

**Failure states handled:**
- Empty password → blocked by preConfirm validator before submission
- Weak password → inline validation message in the modal
- Supabase error → error dialog shown, user can retry
- Re-visiting /profile after reset → hash is cleared, modal does not re-trigger

---

## 5. Feature Breakdown

### Feature 1: Campaign Management

**Description:** CRUD operations for neighborhood cleanup campaigns with geo-coordinates, photo evidence, status tracking, moderation queue, and configurable points.

**User value:** Residents can discover, join, and organize cleanups with full context (location, before photo, participation count, scheduled time).

**Business value:** Creates the content inventory that drives platform engagement and verifiable environmental impact data.

**Technical implementation:**
- Campaigns stored in PostgreSQL with soft-delete (`deleted_at`)
- Location stored as lat/lng floats — simple but limits geo-query capabilities
- Status machine: `pending_review → active → completed | cancelled | archived`
- Before photo required at creation; compressed client-side before upload; after photo uploaded per participant
- First-time creator moderation: new users start in `pending_review` (only counts `active/completed` campaigns, not pending ones)
- Orphaned storage cleanup: if DB insert fails after upload, photo is removed automatically
- Rate limit: max 5 campaigns per 24 hours (DB-level RPC)
- Configurable points per campaign: 10 / 20 / 30 / 50 (creator-selected, validated server-side)
- Scheduled date + start/end time; end time validated to be after start time
- Optional capacity (`max_participants`) — DB-enforced

**Dependencies:** Supabase Storage (photos), Leaflet (map display), RLS policies, `check_campaign_rate_limit` RPC

**Constraints:** Campaign deletion blocked if external participants exist — protects participation records from orphaning.

---

### Feature 2: Points Economy

**Description:** Configurable-point reward per approved cleanup (10/20/30/50 ⭐), spendable on business-sponsored rewards.

**User value:** Tangible incentive that converts volunteer effort into redeemable goods. Larger campaigns can now offer more points.

**Business value:** Drives retention (users return to earn more), creates a local loyalty ecosystem. Point tiers allow gamification of effort scale.

**Technical implementation:**
- Points awarded via Supabase RPC `approve_participation()` — reads `campaigns.points_value`, atomic
- Immutable audit log via `point_transactions` table (append-only)
- Balance stored denormalized on `profiles.points_balance` for fast reads
- Transaction types: `earned | spent | role_change | admin_adjustment`
- `points_value` validated client-side (whitelist: 10/20/30/50) and server-side

**Dependencies:** Admin approval flow, DB triggers, Supabase RPC

---

### Feature 3: Real-time Notification Bell

**Description:** In-app notification system with unread badge, dropdown, and Supabase Realtime subscription.

**User value:** Users learn immediately when their submission is approved — no polling or page refresh required.

**Business value:** Reduces churn at the critical approval moment; users who get instant feedback return.

**Technical implementation:**
- Notifications created exclusively by PostgreSQL triggers — no application-layer creation
- Supabase Realtime channel per user: `notifications-user-{userId}`
- Latest 20 notifications displayed; badge capped at 99+
- Mark-read at individual or bulk level
- Notification types: `approval | campaign_update | system | moderation | achievement | points`

**Dependencies:** Supabase Realtime, PostgreSQL triggers, navbar component

---

### Feature 4: Interactive Map

**Description:** Leaflet.js map showing active campaign locations (red markers) and waste disposal points (green markers).

**User value:** Spatial discovery — users find cleanups near them visually, not just via list.

**Business value:** Geographic data on campaign density reveals neighborhood engagement levels.

**Technical implementation:**
- OpenStreetMap tiles (no API key required, zero cost)
- SVG divIcons (no external image dependencies)
- Default center: Studentski Grad (42.6977°N, 23.3219°E)
- Leaflet.markercluster — campaign markers group at low zoom, expand at street level
- Pollution heatmap overlay (Leaflet.heat) available as admin toggle

**Scalability note:** Marker clustering (shipped Mar 17) resolves the overlap problem at 100+ campaigns. Geographic queries still use lat/lng floats — PostGIS would be needed for radius-based filtering at scale.

---

### Feature 5: Internationalization (BG/EN)

**Description:** Full UI translation between Bulgarian and English, persisted per user in localStorage.

**User value:** Accessible to English-speaking residents, students, and expats in Sofia.

**Business value:** Broadens addressable market; enables international evaluators to assess the platform.

**Technical implementation:**
- Custom i18n module — no external library dependency
- `data-i18n` HTML attributes auto-translated on page load
- `t(key, params)` function for dynamic strings with parameter substitution
- Translation files in both `src/i18n/` (dev) and `public/i18n/` (production)

**Known operational risk:** Two separate translation file locations must be kept in sync manually — divergence causes raw key strings on production.

---

### Feature 6: Demo Mode

**Description:** Full platform simulation using localStorage — no Supabase account or internet connection required.

**User value:** Zero-friction evaluation for new users and stakeholders.

**Business value:** Enables live demos without exposing production data; critical for pitches and academic evaluations.

**Technical implementation:**
- Demo user ID `demo-admin-001` is the universal switch condition across all 7 page scripts
- All pages have parallel demo/real code paths
- Pre-seeded: 5 campaigns, 3 participations, 10 rewards, 5 transactions

**Technical debt:** The `demo-admin-001` condition is scattered across 7 script files — high maintenance burden if demo behavior needs to change globally.

---

### Feature 7: Admin Panel

**Description:** Unified dashboard for participation approval, user management, role assignment, moderation queue, and audit log.

**User value (admin):** Single place to manage all trust and safety operations.

**Business value:** Enables platform operators to maintain points system integrity, reward fairness, and content moderation.

**Technical implementation:**
- Role check enforced by both RLS (PostgreSQL) and JS redirect on page load
- Atomic operations via Supabase RPCs: `approve_participation()`, `set_user_role()`
- Role change audit log stored in `point_transactions` (type=`role_change`)
- **Admin audit log** (`admin_audit_log` table): immutable record of all admin actions — participation approvals/rejections, role changes, campaign moderation. Stores `admin_id`, `action`, `target_id`, `ip_address`, `user_agent`, `created_at`. 180-day retention.
- **Campaign moderation queue**: first-time creator campaigns enter `pending_review` status, visible only to admins via RLS
- Confirmation dialogs via SweetAlert2 before all destructive actions

**Dependencies:** Supabase RPC, RLS policies, SweetAlert2

---

### Feature 9: GDPR Compliance

**Description:** Platform-level compliance with GDPR Article 17 (erasure) and Article 20 (data portability), accessible from the user's profile page.

**User value:** Users can delete their entire account + all associated data, or export a full JSON copy of their data, in one click.

**Business value:** Required for legal operation in Bulgaria (EU). Reduces compliance risk and builds user trust.

**Technical implementation:**
- `gdpr_delete_user(p_user_id)` RPC: cascades deletion of participations, campaigns (with Storage cleanup), comments, transactions, notifications, push subscriptions, event RSVPs, reports. Runs as `SECURITY DEFINER` with `service_role` permission.
- `gdpr_export_user(p_user_id)` RPC: returns a single JSON object with all user data — profile, campaigns, participations, transactions, comments, notifications. User downloads as `clean-quarter-data-export.json`.
- Both RPCs are rate-limited implicitly (require authenticated session, user can only act on own data via RLS).

**Dependencies:** Supabase RPC, Supabase Storage, profile page UI

---

### Feature 10: Data Retention Policy

**Description:** Automated cleanup of stale platform data via a scheduled PL/pgSQL function, ready for pg_cron on paid Supabase plans.

**Business value:** Prevents unbounded table growth; reduces storage costs; ensures compliance with data minimization principles (GDPR Art. 5).

**Technical implementation:**
- `run_data_retention()` function (SECURITY DEFINER, service_role only):
  - Notifications: delete rows older than 90 days (batch 1000/iteration)
  - Admin audit log: delete rows older than 180 days (batch 1000/iteration)
  - Login attempts: delete rows older than 30 days (batch 1000/iteration)
  - Campaigns: archive `completed` campaigns older than 365 days (status → `archived`)
- All deletions use batch-loop pattern to avoid lock contention on first run
- pg_cron schedule (Supabase Pro only): `0 3 * * 0` — Sundays at 03:00 UTC
- On free plan: function is callable manually or via external cron

**Dependencies:** pg_cron (optional), Supabase service_role

---

### Feature 8: PWA (Progressive Web App)

**Description:** Installable web app with offline asset caching and system push notifications.

**User value:** Native-app-like experience on mobile; home screen installation; works offline for cached content.

**Business value:** Increases engagement via home screen placement; reduces barrier to repeat use.

**Technical implementation:**
- Service worker at `/service-worker.js` (Vite copies `public/service-worker.js` → `dist/service-worker.js`)
- SW registered as side-effect of `auth-validation.js`; install prompt + notification init in `pwa.js` (currently unwired — tech debt)
- Push notification infrastructure: `pushNotifications.js` service + Web Push API
- `cacheData()` / `getCachedData()` API for manual offline storage

**Known issues:** `pwa.js` registers wrong SW path; `initializePWA()` never called. Both logged in Bug Backlog.

**Dependencies:** Service Worker API, Web Push API, Browser Notifications API, Vite build output

---

## 6. System Architecture

### Frontend Architecture

**Pattern:** Multi-page application (MPA) with ES Module scripts — no framework, no virtual DOM.

**Why this matters for product:** Each page is an independent HTML entry point. Adding a new page requires no changes to existing pages. The tradeoff: shared state between pages is limited to localStorage and URL params — no in-memory global state survives navigation.

**Build:** Vite produces separate JS bundles per page (code splitting by entry point). Users only download code for the page they visit.

```
index.html               → main bundle
src/pages/dashboard.html → dashboard bundle
src/pages/admin.html     → admin bundle
...                      → one bundle per page
```

---

### Backend Structure

**Provider:** Supabase — managed PostgreSQL + Auth + Storage + Realtime

| Supabase Service | What it provides |
|-----------------|-----------------|
| PostgreSQL | Data persistence, RLS, triggers, RPC functions |
| Auth | JWT sessions, sign-up/sign-in, token refresh |
| Storage | S3-compatible file storage (photos, avatars) |
| Realtime | WebSocket subscriptions to DB changes |

**Custom backend logic:** Zero custom server code. All business logic lives in PostgreSQL (triggers, RPC functions) or client-side JS.

---

### Data Model Overview

9 tables, all with Row-Level Security enabled:

```
auth.users ──────────────── 1:1 ──→ profiles
profiles ────────────────── 1:N ──→ campaigns (created_by)
profiles ────────────────── 1:N ──→ participations (user_id)
profiles ────────────────── 1:N ──→ point_transactions
profiles ────────────────── 1:N ──→ notifications
profiles ────────────────── 1:N ──→ reports
campaigns ───────────────── 1:N ──→ participations (CASCADE delete)
campaigns ───────────────── 1:N ──→ comments
participations ──────────── 1:1 ──→ point_transactions (per approval)
rewards ─────────────────── 1:N ──→ point_transactions (redemptions)
disposal_points ─────────── standalone (user-scoped)
```

**Key design decisions:**
- `profiles.points_balance` is denormalized — stored directly for fast reads, updated atomically via RPC
- Soft deletes on: campaigns, rewards, participations, comments (`deleted_at` + `deleted_by`)
- `point_transactions` is append-only — immutable audit ledger
- Location stored as lat/lng floats, not PostGIS geometry — simpler but limits radius/proximity queries

---

### Authentication & Authorization Model

**Authentication:** Supabase JWT — stateless tokens stored in browser memory by the Supabase client, auto-refreshed transparently.

**Authorization — two independent layers:**

```
Layer 1: PostgreSQL RLS policies
  → Enforced at DB level
  → Cannot be bypassed from the frontend
  → Even direct API calls respect RLS

Layer 2: JavaScript role checks
  → UI-level redirects and conditional rendering
  → Protects UX, not data (data protected by Layer 1)
```

**Role hierarchy:**
```
anonymous  → read public data only
user       → full participation features
admin      → trust & safety operations
superadmin → admin + immutable (cannot be demoted)
```

**Rate limiting:** Login capped at 5 attempts / 15 minutes per email — implemented client-side only (not server-enforced — see Section 9).

---

### External Integrations

| Service | Purpose | Dependency level |
|---------|---------|:----------------:|
| Supabase | Auth, DB, Storage, Realtime | Critical |
| OpenStreetMap | Map tiles (via Leaflet) | Degraded UX without |
| Netlify | Hosting, CDN, URL redirects | Deployment only |
| Bootstrap 5 (CDN) | UI component library | Visual degradation |
| SweetAlert2 (CDN) | Confirmation dialogs | Non-critical |

---

### Scalability Implications

| Component | Current state | Bottleneck threshold |
|-----------|--------------|---------------------|
| Campaign list | Paginated (9/page) | None — scales linearly |
| Map markers | All active loaded at once | ~100 campaigns (no clustering) |
| Notifications | Latest 20 per user | None — truncated query |
| Admin pending table | No pagination | ~100 pending items |
| Neighborhoods | 5 (hardcoded array) | Code change required to expand |
| ~~Points per approval~~ | ~~20 (hardcoded)~~ | ✅ Resolved Mar 27 — configurable (10/20/30/50) via `campaigns.points_value` |
| Storage | Supabase free tier (1GB) | ~10,000 photos at 100KB avg |
| Realtime connections | 1 channel per active user | Supabase free tier: 200 concurrent |

---

## 7. Non-Functional Requirements

### Performance

| Concern | Implementation | Gap |
|---------|---------------|-----|
| Page load | Per-page JS bundles via Vite code splitting | — |
| CDN assets | Bootstrap + Leaflet served from CDN (browser-cached) | CDN downtime = broken UI |
| Image uploads | Max 5MB enforced client-side | No server-side compression or resize |
| Campaign list | Paginated at 9 items/page | — |
| Map markers | All active markers loaded at once | Degrades at ~100+ campaigns |
| Points balance | Denormalized on `profiles` — single field read | — |

---

### Security

| Mechanism | Implementation | Notes |
|-----------|---------------|-------|
| SQL injection | Impossible — Supabase client uses parameterized queries exclusively | — |
| XSS | `escapeHTML()` utility for user content rendered in HTML | ✅ Resolved — `escapeHTML()` applied in `map.js` Leaflet popups and `renderComments()` (confirmed Mar 27) |
| CSRF | Not applicable — REST API with JWT, no cookie-based sessions | — |
| Auth bypass | RLS enforced at DB level — JS bypass has zero effect on data | — |
| Privilege escalation | `is_superadmin` flag prevents top admin demotion | — |
| File upload abuse | Type validation (JPEG/PNG/WebP) + 5MB size limit | Client-side only |
| Report spam | DB trigger blocks duplicate reports within 24h per entity/user | — |
| Login brute force | 5 attempts / 15 min per email — enforced via `check_login_rate_limit` RPC (server-side, Mar 17) | UI shows generic error; countdown to lockout expiry not surfaced to user |

---

### Reliability

| Pattern | Implementation |
|---------|---------------|
| Offline support | PWA service worker caches static assets |
| Error handling | Centralized `errorHandler.js` — type-based strategies, retry with exponential backoff |
| Soft deletes | campaigns, rewards, comments, participations — no permanent data loss on delete |
| Audit trail | `point_transactions` is append-only; `deleted_by` tracked on all soft deletes |
| Data integrity | DB constraints (unique participations, comment length, reward cost range) |
| Atomic operations | Points awarded via RPC — cannot partial-fail |

---

### Maintainability

| Concern | Implementation |
|---------|---------------|
| Code organization | Service-oriented — UI (HTML), controllers (scripts/), business logic (services/), utilities (utils/) |
| Linting | ESLint + Prettier enforced via Husky pre-commit hooks |
| Test coverage | 1,097+ tests across 56+ files — unit, integration, RLS policies, E2E (Cypress), a11y (axe-core), visual regression (Playwright) |
| i18n | All user-facing strings externalized to JSON translation files — all gaps resolved |
| DB versioning | 102 sequential SQL migrations — never edited after applied |
| Build tooling | Vite with `rollup-plugin-visualizer` for bundle size analysis |

---

### Observability

| Concern | Implementation | Gap |
|---------|---------------|-----|
| Application logging | Custom `logger.js` with dev/prod differentiation | No external log aggregation |
| Error tracking | Centralized `errorHandler.js` with listener pattern | No Sentry / external service |
| Analytics | None | No page views, funnel, or event tracking |
| Performance monitoring | None | No Core Web Vitals, no APM |
| Uptime monitoring | None | Supabase or Netlify outages are undetected |
| Alerting | None | Admin has no proactive system notifications |

---

## 8. Trade-offs & Product Decisions

### What Was Optimized For

| Priority | Decision | Evidence in code |
|----------|----------|-----------------|
| Speed to production | No custom backend — Supabase handles auth, DB, storage, realtime | Zero server-side code files |
| Security by default | RLS at DB layer — buggy frontend cannot expose unauthorized data | RLS policies on all 9 tables |
| Zero infrastructure cost | Supabase free tier + Netlify free tier | No paid service dependencies |
| Demo-ability | Full localStorage demo without Supabase | `demoMode.js` + parallel code paths in all 7 scripts |
| Bilingualism from day one | BG/EN not retrofitted — built in from the start | `data-i18n` attributes throughout all HTML |
| Audit integrity | Append-only point ledger, soft deletes everywhere | `point_transactions`, `deleted_at` on 4 tables |

---

### What Constraints Are Visible

| Constraint | Where it appears | Impact |
|-----------|-----------------|--------|
| ~~Fixed 20 points per approval~~ | ~~Hardcoded in `admin.js` and RPC~~ | ✅ Resolved Mar 27 — organizers choose 10/20/30/50 ⭐ per campaign |
| Fixed 5 neighborhoods | Hardcoded array in multiple files | Adding a neighborhood requires code change |
| ~~Manual Netlify deployment~~ | ~~No CI/CD auto-deploy configured~~ | ✅ Resolved — GitHub → Netlify auto-deploy on push to `main` |
| ~~Client-side login rate limiting~~ | ~~`auth.js` — not server-enforced~~ | ✅ Resolved — server-side DB-level rate limiting via RPC (shipped Mar 17) |
| ~~No image optimization~~ | ~~Raw uploads, no resize or compression~~ | ✅ Resolved — client-side canvas compression before upload (shipped Mar 20) |
| Single language per session | Language switch triggers full page reload | Minor UX friction on toggle |
| No email notifications (current) | Only in-app notification bell — weekly digest email and win-back re-engagement flow are planned (v1.3) | Users miss approvals without platform visit |
| ~~No campaign categories~~ | ~~All cleanups treated as equivalent~~ | ✅ Resolved — categories + filter UI (shipped Mar 18) |

---

### What Was Deliberately Simplified

| Simplification | Rationale |
|---------------|-----------|
| No custom server | Eliminates backend infrastructure, deployment complexity, and maintenance overhead |
| Vanilla JS (no framework) | Reduces bundle size, build complexity, and learning curve for contributors |
| lat/lng floats instead of PostGIS | Avoids PostGIS extension setup; sufficient for visual map display at current scale |
| ~~No campaign categories~~ | Shipped Mar 18 — park / street / playground / etc. with filter UI |
| Single before photo per campaign | Simpler upload flow; sufficient for proof-of-need at MVP stage |
| Single after photo per participant | Simpler approval flow; one photo = one approval decision |
| No search | Campaign discovery via map + neighborhood filter sufficient at current data volume |
| No social features | Follows, shares, public profiles add complexity without core value at MVP |
| Demo mode via localStorage | No separate demo environment or seed DB needed; works fully offline |
| No multi-tenancy | Single namespace for all neighborhoods; no organization/district isolation layer |

---

## 9. Open Gaps & Technical Debt

### Open Governance Items

| Gap | Recommendation |
|-----|----------------|
| No reward fulfillment tracking | Add `fulfilled_at`, `fulfilled_by` to `point_transactions` |
| Push notifications limited to approval/rejection | Extend `pushNotifications.js` + DB triggers — RSVP, new neighborhood campaigns, 1h-before reminders, comment alerts |

---

### Missing Analytics

| Gap | Impact |
|-----|--------|
| No event tracking | Cannot measure registration → join → upload → approval funnel |
| No retention metrics | Cannot measure DAU / WAU / MAU |
| No neighborhood engagement data | Cannot identify which areas are most/least active |
| No reward redemption analytics | Cannot measure reward ROI for sponsors |
| No campaign completion rate | Cannot identify campaigns that attract no participants |
| No A/B testing infrastructure | Cannot optimize onboarding or conversion flows |

**Recommendation:** Integrate [Plausible](https://plausible.io) (privacy-compliant, EU-hosted) or [PostHog](https://posthog.com) (self-hostable, open-source).

---

### Missing Monitoring

| Gap | Impact |
|-----|--------|
| No error tracking service | Production errors are invisible unless a user reports them |
| No uptime monitoring | Supabase or Netlify outages go undetected |
| No performance monitoring | Slow pages are undetected — no Core Web Vitals tracking |
| No alerting | Admin has no proactive notification of system issues |
| No deployment notifications | No confirmation when a deploy succeeds or fails |

**Recommendation:** [Sentry](https://sentry.io) (free tier) for error tracking; [UptimeRobot](https://uptimerobot.com) (free) for availability monitoring.

---

### Compliance

All GDPR compliance requirements resolved as of March 27, 2026: Article 17 erasure RPC, Article 20 data export RPC, `/privacy` page, `/terms` page (v1.0), cookie consent banner (`cookieConsent.js`), data retention policy (`run_data_retention()` + pg_cron).

---

## 10. Suggested Product Roadmap

> **Living roadmap:** The full engineering backlog — bugs, tech debt, and product backlog with detailed rationale — is maintained in [`ROADMAP.md`](../ROADMAP.md) at the project root. This section summarizes themes and resolved items only.

---

### Short-term — v1.1 Resolved

| Item | Status |
|------|:------:|
| Automated Netlify deploy (CI/CD) | ✅ GitHub → Netlify auto-deploy |
| Server-side login rate limiting | ✅ Mar 17 — DB-level RPC |
| Admin panel pagination | ✅ Mar 17 |
| Map marker clustering + heatmap | ✅ Mar 17 — Leaflet.markercluster + Leaflet.heat |
| Campaign categories (park / street / water / other) | ✅ Mar 18 — categories + filter UI |
| Make rejection reason required | ✅ `inputValidator` + DB CHECK constraint |
| Reward quantity enforcement | ✅ `purchase_reward()` RPC — atomic decrement |
| Neighborhood leaderboard | ✅ Mar 17 — DB view + dashboard widget |
| Privacy policy page | ✅ Mar 14 — `/privacy`, BG/EN |
| Public stats page (no auth required) | ✅ Mar 20 — `/stats` with 3 RPC-backed charts |
| Event RSVPs infrastructure | ✅ Mar 20 — `event_rsvps` table + `events.js` service |
| PWA service worker on all pages | ✅ Mar 27 — `initPage()` called from every page entry point |
| Cookie consent banner | ✅ Mar 27 — `cookieConsent.js` with localStorage persistence |
| Notification history page | ✅ Mar 27 — `/notifications` with pagination + deeplinks |
| `notifications_enabled` enforcement | ✅ Mar 27 — JS + DB trigger both enforce opt-out |
| Admin point adjustment UI | ✅ Mar 27 — SweetAlert modal, writes to `point_transactions` |
| Campaign moderation queue | ✅ Mar 27 — `pending_review` status, admin queue, RLS |
| Admin audit log | ✅ Mar 27 — `admin_audit_log` table + `logAdminAction()` helper |
| Configurable points per campaign | ✅ Mar 27 — `points_value` (10/20/30/50), RPC updated |
| GDPR Article 17 (erasure) + Article 20 (export) | ✅ Mar 27 — `delete_user_data()` + `export_user_data()` RPCs |
| Campaign creation rate limiting | ✅ Mar 26 — 5 campaigns / 24 h, DB-enforced |
| Terms of Service page | ✅ Mar 27 — `/terms`, bilingual, v1.0 |
| Data retention policy | ✅ Mar 27 — `run_data_retention()` + pg_cron daily schedule |
| i18n gaps (main.js demo login, profile.js eye icon) | ✅ Mar 27 — all hardcoded strings replaced with `t()` keys |

---

### Shipped — v1.2 (UX Sprint)

**Theme:** Close the gap between what the DB supports and what the UI exposes.

Shipped Mar 23–24: Group Events page (`/events`), dashboard search & filter (server-side, debounced), before/after comparison slider, mobile bottom navigation (5-tab).

---

### Shipped — v1.3 (Security, GDPR & Code Quality)

**Theme:** Production hardening, compliance, and multi-round senior engineering review.

Shipped Mar 26–28: Campaign rate limiting (DB-level), GDPR Article 17 + 20, admin audit log, campaign moderation queue, configurable points, data retention policy, orphaned photo cleanup, checklist UX improvements, i18n consistency, error message hardening, storage upload progress indicator.

See [ROADMAP.md § March 2026 Week 6](../ROADMAP.md) for the full breakdown.

---

### Growth — v1.4 (3–6 months)

**Theme:** Retention mechanics, admin efficiency, and first B2B revenue.

Key items: Recurring campaigns, streak mechanics, achievement badges, shareable impact card, personal impact dashboard, waste weight estimation, seasonal challenges, batch approval, campaign announcements, organizer analytics, notification center, individual user leaderboard, push notification expansion, campaign countdown + iCal export, admin point adjustments, disposal point → campaign linkage, weekly digest email, campaign completion flow, campaign "Boost" (Stripe), school/university service hours.

Revenue unlocked: Campaign Boost (5 лв/48h), school institution subscriptions (200 лв/year).

---

### Platform — v2.0 (12–24 months)

**Theme:** Multi-city expansion, B2B partnerships, institutional integrations.

Key items: Multi-city support, anonymous illegal dumping map, corporate team cleanup + ESG report, school/university service certificates, hazardous waste flagging, heatmap full implementation, volunteer transport coordination, photo AI validation, Econt/Speedy delivery integration, Sofia open data sync, Ukrainian/Turkish i18n, admin user activity dashboard, report auto-escalation.

Revenue unlocked: Corporate ESG subscription (150–500 лв/year), municipality API contracts, white-label licensing.

---

### Shipped — v1.4 Design Sprint (planned)

**Theme:** High-ROI UX improvements identified in Design Audit (Section 11).

| Item | Effort | Impact |
|------|--------|--------|
| Points burst animation on approval (`pointsEarned` → CSS keyframes) | ~0.5 days | Gamification lift — earning moment becomes visible |
| Notification bell + language toggle always visible on mobile | ~1 hour | Daily friction fix — never buried in hamburger |
| Leaderboard card layout on mobile (table → cards at <768px) | ~2 hours | Fixes unreadable 5-column table on 390px |
| Campaign filter bar sticky + persisted in `sessionStorage` | ~1 day | Improves most-visited page — filters survive scroll |
| "Your Balance" sticky bar on Rewards page | ~0.5 days | Directly increases reward engagement and motivation |

---

### Open Governance Gaps

| Gap | Notes |
|-----|-------|
| Reward fulfillment tracking | Planned v1.4 |
| Analytics (Plausible / PostHog) | Planned v1.4 |
| Error tracking (Sentry) | Planned v1.4 |
| `checkAuth()` trusts localStorage without session verification | Mitigated by double-check in `handleFormSubmit` |
| `handleFormSubmit` violates SRP (140+ lines) | Refactor planned v1.4 |

---

*Last revised: 2026-03-28. All 13 open governance/compliance gaps identified in the previous review have been resolved and marked ✅: configurable campaign points, GDPR Article 17 erasure + Article 20 export, campaign rate limiting, moderation queue, admin point adjustment UI, notifications_enabled enforcement, notification history page, cookie consent banner, Terms of Service page, data retention policy (pg_cron), admin audit log, i18n gaps in main.js + profile.js, PWA registration on all pages. Section 10 v1.1 resolved inventory updated accordingly. Only 3 items remain open: push notification expansion to all event types, analytics integration (Plausible/PostHog), and error tracking (Sentry).*


---

## 11. Design Audit

**Conducted:** March 2026 | **Role:** Senior Product Designer | **Scope:** Full UI/UX review of MVP

> **Methodology:** Heuristic evaluation against Nielsen's 10 usability principles, gamification design patterns (Octalysis framework), and mobile-first audit at 375px / 768px / 1280px breakpoints. Benchmarked against Nextdoor, FixMyStreet, and Habitica.

---

### 11.1 Visual Identity Critique

**Current state:** Bootstrap 5 base with a custom green/white palette (`#2d6a4f` primary, `#fff` background), Segoe UI / system font stack, FontAwesome icons.

**What works:**
- Green primary color correctly signals ecology and community trust.
- White-dominant layout keeps the interface clean and non-threatening for older civic users.
- FontAwesome icons are universally recognizable and load fast.

**What needs work:**

| Issue | Impact | Recommendation |
|---|---|---|
| Single brand green used for both interactive (buttons) and decorative (headers) elements | High | Reserve `#2d6a4f` exclusively for interactive states; use `#52b788` (lighter) for decorative fills |
| No secondary accent color for gamification feedback | Medium | Add warm gold `#f4a261` as the gamification accent — signals achievement without clashing with eco palette |
| Typography has no hierarchy weight contrast | Medium | Section titles 700 weight, labels 500, body 400; increase base size from 14px to 15px |
| Icon style inconsistency — some pages outlined, others filled | Low | Standardize on `fa-solid` throughout; use `fa-regular` only for inactive/empty states |

**Brand alignment score: 6/10.** The ecological intent is present but underdeveloped. The platform lacks a visual language for reward and celebration, which undermines the gamification pillar.

---

### 11.2 Information Architecture

**Current navigation:** Home, Campaigns, Map, Leaderboard, Rewards, Events + notification bell + language toggle.

**Strengths:**
- Flat navigation reduces cognitive load — correct for a civic platform with mixed digital literacy.
- Notification bell and language toggle are persistently visible.

**Weaknesses and recommendations:**

**1. "Map" is a view, not a destination.**
Map duplicates Campaigns with a different visualization. Users expect both views within Campaigns (list vs. map toggle).
→ **Merge Map into Campaigns as a view toggle.** Free up one nav slot.

**2. "Rewards" has no progressive disclosure.**
New users see a catalog without indication of their current points or distance to the next reward.
→ **Add a sticky "Your Balance" bar** showing current points and distance to nearest redeemable reward.

**3. "Events" and "Campaigns" are conceptually blurred.**
→ **Long-term:** Unify under Campaigns with a type filter. **Short-term:** Cross-link between the two pages.

**4. Dashboard is not in the nav.**
Reachable only via avatar — not universal across all user segments.
→ Avatar-initiated dropdown on desktop; bottom nav bar entry on mobile.

**Revised nav (6 → 5 items):** `Home | Campaigns (+Map) | Leaderboard | Rewards | Events` + avatar dropdown.

---

### 11.3 Gamification UX

**Octalysis score (estimated):**

| Drive | Score (1-5) | Note |
|---|---|---|
| Epic Meaning | 4 | "Clean your neighborhood" mission is clear and motivating |
| Accomplishment | 3 | Badges exist but earning feedback is minimal — no animation, no popup |
| Empowerment | 2 | Users cannot track progress toward the next badge |
| Social Influence | 4 | Leaderboard + neighborhood competition is a strong hook |
| Unpredictability | 1 | No surprise rewards — participation is entirely predictable |
| Avoidance | 3 | Streak loss motivates but there is no warning before it breaks |
| Scarcity | 2 | Reward quantities are not surfaced urgently |
| Ownership | 3 | Points feel owned; badges feel collected but not displayed proudly |

**Top 3 gamification UX improvements:**

**1. Points burst animation on approval (highest impact)**
When a participation is approved and points are awarded, there is no in-page visual feedback.
→ CSS keyframes animation — +N points float up from the navbar badge when `pointsEarned` notification arrives. Zero backend changes required.

**2. Next badge progress bar on Profile**
Users cannot see how close they are to their next badge, breaking the "progress and advancement" drive entirely.
→ Badge icon (greyed) + progress bar (e.g., "3 of 5 campaigns completed") + unlock condition text. Data already available via `user_badges` and `check_and_award_badges_rpc`.

**3. Streak warning push notification**
The streak system never warns users before their streak breaks.
→ Sunday evening push if user has not participated that week. Uses existing push subscription infrastructure.

---

### 11.4 Mobile-First Gaps

Tested at 375px (iPhone SE), 390px (iPhone 14), 768px (iPad).

**Breakpoint 1 — 375px: Campaign cards overflow horizontally**
Fixed `min-width` causes horizontal scroll on smallest viewports.
→ Remove `min-width` from `.campaign-card`; use `width: 100%` with `gap` on the grid.

**Breakpoint 2 — 768px: Key nav actions disappear into hamburger**
Notification bell and language toggle collapse into the hamburger menu — used constantly.
→ Pin both **outside the collapse** at all breakpoints.

**Breakpoint 3 — 390px: Leaderboard table forces horizontal scroll**
5-column table is unreadable at 390px.
→ Card-based leaderboard on mobile (rank large, name + neighborhood stacked, points prominent). Table stays for >=768px. Pure CSS change — no JS modification needed.

**Bonus — all breakpoints: No bottom navigation bar**
Top navbar is hard to reach during outdoor cleanup events.
→ **5-item bottom nav bar:** `Home | Campaigns | + (Join) | Leaderboard | Profile`. Center button = primary action.

---

### 11.5 Page-by-Page Redesign Proposals (Summary)

| Page | Layout change | Micro-interaction | Content hierarchy fix |
|------|---------------|-------------------|-----------------------|
| **Home** | Split-screen hero: CTA left, live map preview right | Pulse animation on primary CTA on first load | Social proof ("142 cleanups · 890 residents · 12 tons") above the fold |
| **Campaigns** | Sticky filter bar (Category, Neighborhood, Date, Status); persisted in `sessionStorage` | Card hover reveals "+Join" overlay — 3 steps → 1 | Neighborhood tag + date first, then title |
| **Leaderboard** | Tabs: "This Month" / "All Time" / "My Neighborhood" | Animate rank number changes on load | Rank 2× larger, name bold, points right-aligned |
| **Rewards** | Sticky "Your balance" bar + progress to next reward | Urgency counter ("Only 3 left!") when quantity < 5 | Lock overlay on unaffordable rewards (greyed, not hidden) |
| **Events** | Calendar view toggle (month grid) + list toggle | Confetti micro-animation on RSVP confirm | Date + time first (largest), then title |
| **Notifications** | Grouped: "Today" / "This week" / "Earlier" + unread count | Swipe-to-dismiss on mobile | Icon color-coded by type (green / blue / orange) |

*Full per-page rationale available on request.*

---

### 11.6 Design System Foundation

**Approach:** CSS custom properties — zero dependency, works with existing Vanilla JS + Bootstrap 5. No component library migration required.

**Color tokens (5):**
```css
--color-primary:       #2d6a4f;  /* eco green — interactive elements only */
--color-primary-light: #52b788;  /* decorative fills, hover states */
--color-accent:        #f4a261;  /* gamification — points, badges, achievements */
--color-surface:       #f8faf9;  /* page and card backgrounds */
--color-danger:        #e63946;  /* rejections, errors, destructive actions */
```

**Typography scale (3 levels):**
```css
--text-heading: clamp(1.25rem, 2.5vw, 1.75rem); /* section headers */
--text-body:    0.9375rem;                        /* 15px — body text */
--text-label:   0.8125rem;                        /* 13px — badges, metadata */
```

**Spacing units (2):**
```css
--space-base: 1rem;   /* 16px — component internal padding */
--space-gap:  1.5rem; /* 24px — between components, grid gaps */
```

**Component library:** None recommended. Extract the 4-5 most-repeated patterns (campaign card, stat badge, notification item, leaderboard row) into reusable HTML/CSS templates in `src/components/`.

---

### 11.7 Design Audit Summary

| Area | Current Score | Target Score | Priority |
|---|---|---|---|
| Visual Identity | 6/10 | 8/10 | Medium |
| Information Architecture | 6/10 | 9/10 | High |
| Gamification UX | 5/10 | 8/10 | High |
| Mobile Usability | 5/10 | 8/10 | High |
| Page-level UX | 6/10 | 8/10 | Medium |
| Design System | 3/10 | 7/10 | Low |

**Top 5 highest-ROI changes (impact vs. effort):**

1. **Points burst animation on approval** — ~0.5 days frontend, large gamification lift
2. **Notification bell + language toggle always visible on mobile** — ~1 hour CSS
3. **Leaderboard card layout on mobile** — ~2 hours CSS
4. **Campaign filter bar sticky + persisted in sessionStorage** — ~1 day JS/CSS
5. **"Your Balance" sticky bar on Rewards page** — ~0.5 days

*Design audit conducted March 2026. All recommendations scoped to existing Vanilla JS + Bootstrap 5 stack — no framework migration implied.*