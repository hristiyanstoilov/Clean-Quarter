# CLEAN QUARTER — Enterprise Product Documentation

**Version:** 1.0 | **Date:** March 2026 | **Classification:** Internal

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

### Business Model (Inferred)

The codebase does not implement payment processing. The inferred model has two tiers:

**Phase 1 (current — grant/public-funded):**
- Platform is free for all residents
- Rewards are sponsor-funded (local businesses)
- No revenue logic in code

**Phase 2 (inferred expansion):**
- B2B: Municipality/district subscriptions for analytics and compliance reporting
- B2B2C: Local business reward sponsorships (digital vouchers already structured as `rewards.image_url`, `rewards.category`)
- White-label licensing to other Bulgarian cities

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
2. Fill title (3–100 chars), description (10–1000 chars)
3. Select neighborhood from dropdown
4. Click map to pin exact location → lat/lng captured
5. Upload before photo (JPEG/PNG/WebP, max 5MB) → stored in Supabase Storage
6. Submit → campaigns row created (status=active)
7. Redirect to Dashboard → new marker visible on map
```

**Failure states handled:**
- No map pin → blocking validation ("coordinates required")
- Photo wrong format or oversized → client-side rejection before upload
- Title/description too short or too long → inline errors

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

## 5. Feature Breakdown

### Feature 1: Campaign Management

**Description:** CRUD operations for neighborhood cleanup campaigns with geo-coordinates, photo evidence, and status tracking.

**User value:** Residents can discover, join, and organize cleanups with full context (location, before photo, participation count).

**Business value:** Creates the content inventory that drives platform engagement and verifiable environmental impact data.

**Technical implementation:**
- Campaigns stored in PostgreSQL with soft-delete (`deleted_at`)
- Location stored as lat/lng floats — simple but limits geo-query capabilities
- Status machine: `active → completed | cancelled` (no reversal)
- Before photo required at creation; after photo uploaded per participant

**Dependencies:** Supabase Storage (photos), Leaflet (map display), RLS policies

**Constraints:** Campaign deletion blocked if external participants exist — protects participation records from orphaning.

---

### Feature 2: Points Economy

**Description:** 20-point reward per approved cleanup, spendable on business-sponsored rewards.

**User value:** Tangible incentive that converts volunteer effort into redeemable goods.

**Business value:** Drives retention (users return to earn more), creates a local loyalty ecosystem.

**Technical implementation:**
- Points awarded via Supabase RPC `approve_participation()` — atomic, cannot partial-fail
- Immutable audit log via `point_transactions` table (append-only)
- Balance stored denormalized on `profiles.points_balance` for fast reads
- Transaction types: `earned | spent | role_change | admin_adjustment`

**Hardcoded constraint:** 20 points per approval — not configurable via UI. Identified as a product rigidity gap in Section 9.

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
- No marker clustering — all markers render simultaneously

**Scalability note:** With 100+ campaigns, marker overlap becomes a UX problem. No clustering library is implemented — identified as a gap in Section 9.

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

**Description:** Unified dashboard for participation approval, user management, role assignment, and audit log.

**User value (admin):** Single place to manage all trust and safety operations.

**Business value:** Enables platform operators to maintain points system integrity and reward fairness.

**Technical implementation:**
- Role check enforced by both RLS (PostgreSQL) and JS redirect on page load
- Atomic operations via Supabase RPCs: `approve_participation()`, `set_user_role()`
- Role change audit log stored in `point_transactions` (type=`role_change`)
- Confirmation dialogs via SweetAlert2 before all destructive actions

**Dependencies:** Supabase RPC, RLS policies, SweetAlert2

---

### Feature 8: PWA (Progressive Web App)

**Description:** Installable web app with offline asset caching and system push notifications.

**User value:** Native-app-like experience on mobile; home screen installation; works offline for cached content.

**Business value:** Increases engagement via home screen placement; reduces barrier to repeat use.

**Technical implementation:**
- Service worker at `/public/service-worker.js`
- Install prompt banner shown after 3-second delay on first visit
- `cacheData()` / `getCachedData()` API for manual offline storage
- Browser push notification permission requested on initialization

**Dependencies:** Service Worker API, Browser Notifications API, Vite build output

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
| Points per approval | 20 (hardcoded) | Code change required to adjust |
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
| XSS | `escapeHTML()` utility for all user content rendered in HTML | — |
| CSRF | Not applicable — REST API with JWT, no cookie-based sessions | — |
| Auth bypass | RLS enforced at DB level — JS bypass has zero effect on data | — |
| Privilege escalation | `is_superadmin` flag prevents top admin demotion | — |
| File upload abuse | Type validation (JPEG/PNG/WebP) + 5MB size limit | Client-side only |
| Report spam | DB trigger blocks duplicate reports within 24h per entity/user | — |
| Login brute force | 5 attempts / 15 min per email | **Client-side only — bypassable via direct API call** |

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
| Test coverage | 449 tests across 44 files — unit, integration, RLS policies, E2E |
| i18n | All user-facing strings externalized to JSON translation files |
| DB versioning | 43 sequential SQL migrations — never edited after applied |
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
| Fixed 20 points per approval | Hardcoded in `admin.js` and RPC | Cannot reward harder campaigns more |
| Fixed 5 neighborhoods | Hardcoded array in multiple files | Adding a neighborhood requires code change |
| Manual Netlify deployment | No CI/CD auto-deploy configured | Every release requires manual drag-and-drop |
| Client-side login rate limiting | `auth.js` — not server-enforced | Bypassable via direct Supabase API call |
| No image optimization | Raw uploads, no resize or compression | Large files slow page loads |
| Single language per session | Language switch triggers full page reload | Minor UX friction on toggle |
| No email notifications | Only in-app via notification bell | Users miss approvals without platform visit |

---

### What Was Deliberately Simplified

| Simplification | Rationale |
|---------------|-----------|
| No custom server | Eliminates backend infrastructure, deployment complexity, and maintenance overhead |
| Vanilla JS (no framework) | Reduces bundle size, build complexity, and learning curve for contributors |
| lat/lng floats instead of PostGIS | Avoids PostGIS extension setup; sufficient for visual map display at current scale |
| No campaign categories | Reduces DB schema complexity; all cleanups treated as equivalent in current scope |
| Single before photo per campaign | Simpler upload flow; sufficient for proof-of-need at MVP stage |
| Single after photo per participant | Simpler approval flow; one photo = one approval decision |
| No search | Campaign discovery via map + neighborhood filter sufficient at current data volume |
| No social features | Follows, shares, public profiles add complexity without core value at MVP |
| Demo mode via localStorage | No separate demo environment or seed DB needed; works fully offline |
| No multi-tenancy | Single namespace for all neighborhoods; no organization/district isolation layer |

---

## 9. Gaps for Enterprise Readiness

### Missing Governance Layers

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| Points per campaign not configurable | Cannot reward harder/larger cleanups more | Add `points_value` column to `campaigns` table |
| No reward fulfillment tracking | No way to verify rewards were actually delivered | Add `fulfilled_at`, `fulfilled_by` to `point_transactions` |
| No campaign categories/types | No segmentation for reporting or discovery | Add `category` enum to `campaigns` |
| No rate limiting on campaign creation | Spam campaigns are technically possible | Add client-side + server-side rate limit |
| No moderation queue for new campaigns | All campaigns go public immediately | Add `status='pending'` for first-time creators |
| Rejection reason optional | Unfair rejections with no explanation | Make `rejection_reason` required on reject action |
| No reward quantity enforcement | `quantity_available` column exists but not decremented on redemption | Wire redemption to decrement quantity |

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

### Missing Compliance Elements

| Gap | Relevance |
|-----|-----------|
| No GDPR data export | Required under EU law — users can request all their data |
| No right-to-erasure | `deleted_at` exists but photos remain in Supabase Storage after soft delete |
| No privacy policy page | Referenced in registration checkbox but `/privacy` route does not exist |
| No cookie consent banner | Required if analytics or tracking is added |
| No versioned Terms of Service | Registration checkbox present but no ToS document or version tracking |
| No data retention policy | Old campaigns, transactions, and notifications are never purged |
| No audit log for admin actions | Role change log exists; photo approvals/rejections are not independently logged |

---

## 10. Suggested Product Roadmap

### Short-term (1–3 months) — Operational Stability

| Priority | Item | Rationale |
|:--------:|------|-----------|
| P0 | Automated Netlify deploy (CI/CD) | Manual deploys block rapid iteration |
| P0 | Server-side login rate limiting | Current client-side only is bypassable via direct API call |
| P1 | Configurable points per campaign | Core product rigidity — all cleanups currently treated as equal |
| P1 | Admin panel pagination | Degrades significantly at 100+ pending items |
| P1 | Map marker clustering | UX breaks at 100+ active campaigns |
| P1 | Email notifications on approval | Users miss approvals without visiting the platform |
| P1 | Make rejection reason required | Fairness — users deserve an explanation when rejected |
| P2 | Basic analytics (Plausible / PostHog) | Currently flying blind — no funnel or retention data |
| P2 | Error tracking (Sentry free tier) | Production errors are invisible |

---

### Mid-term (3–9 months) — Growth Infrastructure

| Priority | Item | Rationale |
|:--------:|------|-----------|
| P1 | Add neighborhoods via admin UI | Remove hardcoded list — expand without code changes |
| P1 | Campaign categories (park / street / water / other) | Segmentation for reporting and filtered discovery |
| P1 | Reward fulfillment tracking | Close the loop with sponsors — verify delivery |
| P1 | Reward quantity enforcement | `quantity_available` column exists but is not wired |
| P1 | GDPR compliance (data export + erasure) | Legal requirement under EU law |
| P2 | Campaign text search | Discovery beyond map + neighborhood filter |
| P2 | Neighborhood leaderboard | Drives inter-neighborhood competition and social proof |
| P2 | Multi-photo evidence upload | Richer proof, harder to game the system |
| P2 | Privacy policy page | Referenced in registration but `/privacy` route missing |
| P3 | Mobile app shell (Capacitor) | PWA → App Store distribution |
| P3 | Sponsor self-serve reward portal | Scale reward supply without manual ops |

---

### Long-term (9–24 months) — Platform Expansion

| Priority | Item | Rationale |
|:--------:|------|-----------|
| P1 | Multi-city support | Remove Sofia-only constraint — architecture supports it today |
| P1 | Municipality API integration | Official data feeds, compliance reporting for districts |
| P1 | Business sponsor dashboard | Revenue enabler — sponsors manage their own rewards |
| P2 | Environmental impact metrics | Estimated kg waste removed — measurable ESG reporting |
| P2 | Campaign scheduling + calendar | Coordinate recurring cleanups and seasonal events |
| P2 | Team / group participation | Corporate social responsibility use case |
| P3 | Open API for third-party integrations | Platform ecosystem play |
| P3 | Carbon credit tokenization | Long-term monetization via sustainability markets |

---

*Document complete. All 10 sections reflect features and decisions derived directly from the codebase. No speculative features included.*
