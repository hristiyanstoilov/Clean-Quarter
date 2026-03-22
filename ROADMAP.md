# Clean Quarter — Product Roadmap

**Last updated:** 2026-03-22 | **Version:** 1.1-dev | **Live:** https://cleanquarter.netlify.app

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Shipped |
| 🔨 | In progress / planned next |
| 🗓️ | Scheduled |
| 💡 | Under evaluation |
| ❌ | Rejected |

---

## ✅ v1.0 — Foundation (Shipped)

Core product loop: discover → join → clean → prove → earn.

| Feature | Notes |
|---------|-------|
| User auth (register / login / logout / password reset) | Email + password via Supabase Auth |
| Campaign CRUD with map location picker | Leaflet + OpenStreetMap, no Google Maps |
| Before/After photo upload & compression | Client-side canvas compression before upload |
| Admin approval / rejection workflow | Rejection reason required |
| Points economy + rewards catalog | RPC-based purchase to prevent client-side cheating |
| Real-time notification bell | DB-trigger driven, Supabase Realtime |
| Bilingual UI — Bulgarian / English | Custom i18n engine, persisted in localStorage |
| Interactive map with marker clustering | leaflet.markercluster, disposal points layer |
| Neighborhood leaderboard | Per-neighborhood aggregated points |
| Weather widget | Open-Meteo API — no API key required |
| Community stats page | Public aggregated metrics (no auth required) |
| Campaign categories | Filter by park / street / water / other |
| Scheduled campaign datetime | Start time + optional end time |
| Comment system with realtime | Supabase Realtime channels |
| Report abuse flow | Reports routed to admin panel |
| CSV export (admin) | Municipality-ready cleanup report |
| Dynamic avatars (DiceBear) | Level-based avatar progression |
| Demo mode | Full offline simulation via localStorage |
| PWA — installable, offline fallback | Service worker, Web App Manifest |
| Push notifications (opt-in) | Web Push via service worker |
| Admin pagination | Handles 100+ pending participations |
| Privacy Policy page | GDPR-aligned |
| Server-side login rate limiting | Supabase DB-level, not bypassable via API |
| Session TTL enforcement | Auto-logout on expiry |
| Error tracking (Sentry) | Production errors captured |
| Geolocation "Locate Me" | Auto-center map on user position |
| Event RSVPs (DB layer) | `event_rsvps` table + `events.js` service |
| Soft delete for campaigns | `deleted_at` column, admins can view deleted |

---

## ✅ v1.1 — Security & Quality (Shipped 2026-03-21/22)

Hardening sprint — zero Supabase security advisories.

| Feature | Notes |
|---------|-------|
| Merge duplicate permissive RLS policies | Eliminates `multiple_permissive_policies` advisories |
| `current_user_is_admin()` SECURITY DEFINER helper | Prevents RLS recursion (42P17) |
| Notification i18n pipeline | DB triggers store JSON keys, frontend resolves via `t()` |
| Rejection notification trigger | Notifies user when participation is rejected |
| HIBP password breach check | k-anonymity SHA-1, fail-open, never sends plain password |
| Accessibility fixes (7 HTML pages) | `aria-label` on navbar-toggler + language selector |
| axe-core test suite (55 tests) | Blocks on critical + serious a11y violations |
| File upload E2E tests (Cypress) | Storage intercepted, no real bucket dependency |
| Mobile touch E2E tests (Cypress) | iPhone 13 viewport, tap targets, no horizontal scroll |
| Visual regression setup (Playwright) | Screenshot comparison, 2% pixel tolerance |
| Lighthouse CI config | Performance ≥ 0.75, accessibility ≥ 0.90 enforced |
| Database index review doc | `pg_stat_user_indexes` query, next review 2026-04-21 |

---

## 🔨 v1.2 — User Experience (Next Sprint)

Closing the gap between what the DB supports and what the UI exposes.

### P0 — Missing UI for existing DB features

| Feature | Effort | Rationale |
|---------|--------|-----------|
| **Group Events page** | Medium | `event_rsvps` migration + `events.js` service exist — no HTML page or script. The social "Party Mode" mechanic is the strongest virality driver. Without UI it's dead code. |
| **Dashboard search & filter** | Small | `campaign-filters.js` exists. Users need live search by title + neighborhood dropdown. At 50+ campaigns discovery breaks. |

### P1 — High UX value, low effort

| Feature | Effort | Rationale |
|---------|--------|-----------|
| **Admin heatmap** | Small | `leaflet.heat` CDN + 5 lines of JS. Shows which areas are most polluted — concrete visual for municipality reporting and demo. |
| **Offline/Online status banner** | Small | `pwa.js` already tracks `navigator.onLine`. Need visible banner + button disable. Users use the app outdoors on mobile — connectivity drops are common. |
| **Skeleton loading screens** | Medium | Current UX shows empty space while fetching. Skeleton cards make the app feel faster and production-quality. |
| **Mobile bottom navigation** | Small | Hamburger works but bottom nav is the mobile standard for civic apps. 4 icons: Home, Map, +Create, Profile. CSS media query only. |

### P2 — Completes existing features

| Feature | Effort | Rationale |
|---------|--------|-----------|
| Password strength meter | Small | HIBP blocks breached passwords. Visual strength bar (Weak/Good/Strong) complements it at the input level. |
| Google OAuth | Small (config) | Reduces registration friction significantly for young users. Supabase supports it — mostly Dashboard config. |
| Caching layer (sessionStorage) | Small | Reduce redundant Supabase reads for campaigns list. 5-minute TTL, invalidated on create/edit. |

---

## 🗓️ v1.3 — Growth Infrastructure (3–6 months)

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Multi-photo evidence upload | P1 | Richer proof, harder to game. One photo can be staged. |
| Campaign text search (server-side) | P1 | Client-side filter works at 100 campaigns; Supabase full-text search for 1000+. |
| Reward fulfillment tracking | P1 | Close the loop with reward sponsors — verify delivery. |
| GDPR data export + erasure | P1 | Legal requirement. User can download/delete their data. |
| Business sponsor self-serve portal | P2 | Revenue enabler — sponsors manage own rewards without admin ops. |
| Basic analytics (Plausible/PostHog) | P2 | No funnel or retention data currently. |
| Configurable points per campaign | P2 | All cleanups treated as equal today — unfair for large vs. small events. |

---

## 🗓️ v2.0 — Platform Expansion (6–18 months)

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Multi-city support | P1 | Architecture supports it today. Remove Sofia-only hardcoding. |
| Municipality API integration | P1 | Official data feeds + compliance reporting for district government. |
| Environmental impact metrics | P2 | Estimated kg waste removed per campaign — measurable ESG reporting. |
| Mobile app shell (Capacitor) | P2 | PWA → App Store distribution for higher retention. |
| Carbon credit tokenization | P3 | Long-term monetization via sustainability markets. |

---

## ❌ Rejected Features

Features evaluated and explicitly excluded with rationale.

| Feature | Reason |
|---------|--------|
| **Dueling Mode (1v1)** | Competitive staking contradicts the cooperative civic mission. Leaderboard covers competitive motivation without toxicity. |
| **Clans system** | Neighborhood leaderboard already provides team competition. Clans add DB complexity for no incremental value given geographic scope. |
| **Referral system** | Assumes viral growth potential. Geographic constraint (5 Sofia neighborhoods) caps addressable users — referrals won't meaningfully grow the market. |
| **AI Image Analysis (mock)** | Without a real API key, mock random true/false teaches nothing and would mislead users. Implement only with real OpenAI/Google Vision integration. |
| **AI Magic Description (mock)** | Same as above — random preset strings are hollow. The UX cost (false expectation of AI) exceeds the benefit. |
| **GIF Generator** | `gif.js` is a 200KB library for a niche feature. The Before/After slider already tells the visual story better. |
| **Route Optimizer (OSRM)** | Users attend one cleanup at a time. Routing optimization solves a problem users don't have. |
| **Eco-Bot (AI Chat)** | Requires paid OpenAI key + ongoing cost. Mock version is counterproductive. Defer to v2.0 if real AI integration budget exists. |
| **Dueling/Clans/Daily Quests** | Complex gamification layers that create toxicity risk in a civic context. Core loop (clean → earn → redeem) is sufficient. |
| **Eco-Trivia loading screen** | Trivia during loading would frustrate users when data loads in <1s. Educational content belongs in onboarding, not as a loading gate. |
| **Magic Link login** | Adds a second parallel auth flow. Mixing email/password + magic link creates UX confusion. Implement only if password auth is dropped entirely. |
| **Split-screen login redesign** | Current login works. Redesigning a working auth page 3 days before a demo is high risk, zero new functionality. |

---

## Database Index Review

**Next review date:** 2026-04-21

See [docs/INDEX_REVIEW.md](docs/INDEX_REVIEW.md) for the SQL query and decision criteria.

---

## Technical Debt Backlog

| Item | Priority | Notes |
|------|----------|-------|
| Playwright visual baseline creation | P1 | Run `npm run playwright:update` once against staging |
| `npx playwright install chromium` on CI | P1 | Required before Playwright tests can run in GitHub Actions |
| `npm run lhci` integration in GitHub Actions | P2 | `lighthouserc.js` configured but not wired to CI pipeline |
| `docs/PRODUCT_DOCUMENTATION.md` — update roadmap section | P3 | Section 10 reflects pre-v1.1 state |
