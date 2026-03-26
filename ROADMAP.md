# Clean Quarter — Roadmap & Engineering Backlog

**Last updated:** 2026-03-25 | **Version:** 1.2-dev | **Live:** https://cleanquarter.netlify.app

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

## ✅ Shipped — Delivery History

### January 2026 — Foundation (Weeks 1–4)

Core product built from zero to working prototype in 3 weeks.

**Week 1 (Jan 10–14) — Setup & Data Layer**
- Project scaffolding (Vite, Netlify, Supabase)
- SQL schema design with seed data
- Supabase client init + auth service

**Week 2 (Jan 15–17) — Core UI**
- Login / register UI (bilingual from day 1)
- Dashboard with Leaflet map integration
- Campaign CRUD with map location picker
- Campaign detail page + soft delete
- Participation flow — join campaign + upload proof photo

**Week 3 (Jan 18–20) — Product Completeness**
- Admin panel — approve / reject participations with points system
- Rewards shop — points economy end-to-end
- Profile page — avatar, rank, transaction history, participations
- Demo mode — full offline simulation via localStorage (no Supabase required)
- i18n — Bulgarian / English with real-time language switching
- Mobile responsive design + accessibility baseline
- Edit campaign + edit profile flows

**Week 4 (Jan 21–31) — Quality Infrastructure**
- GitHub Actions CI pipeline
- Vitest unit test suite (full coverage)
- Cypress E2E tests (login, dashboard, campaign flow)
- Real Supabase integration tests with CI secrets
- Code coverage reporting in CI

---

### February 2026 — Architecture & Solidification

Refactoring sprint — established patterns, services layer, and PR workflow.

| Milestone | Notes |
|-----------|-------|
| Services layer extraction | `auth.js`, `storage.js`, `errorHandler.js`, `logger.js`, `validation.js` extracted from page scripts |
| State management layer | `store.js` pub-sub pattern introduced |
| Hooks abstraction | `hooks/index.js` for async state patterns |
| API client abstraction | `api/client.js` introduced |
| Logger & error handling | Centralized `AppError`, error strategies, Sentry prep |
| PR-based workflow | All features via branches + pull requests from this point |
| Documentation foundations | Deployment guides, i18n docs, multi-language completion guide |

---

### March 2026 (Week 1–2) — Product Documentation

Product spec written section by section as a daily practice.

| Date | Delivered |
|------|-----------|
| Mar 5–6 | Executive summary, product vision & strategy |
| Mar 7–8 | User segments & personas, core user journeys |
| Mar 9–10 | Feature breakdown, system architecture |
| Mar 11–13 | NFRs, trade-offs & product decisions, gaps for enterprise readiness |
| Mar 13–14 | Suggested product roadmap — full `PRODUCT_DOCUMENTATION.md` complete |

---

### March 2026 (Week 2–3) — Feature Expansion Sprint

20+ features shipped across 10 days.

| Feature | Shipped |
|---------|---------|
| Password recovery flow (forgot + reset) | Mar 14 |
| Weather widget (Open-Meteo, no API key) | Mar 14 |
| Privacy Policy page (GDPR-aligned) | Mar 14 |
| Rejection reason required on admin reject | Mar 14 |
| Campaign scheduled date/time (start + end) | Mar 15 |
| Campaign detail page rewrite (datetime display) | Mar 15 |
| Admin pagination (handles 100+ participations) | Mar 17 |
| Map marker clustering (leaflet.markercluster) | Mar 17 |
| Neighborhood leaderboard (per-neighborhood points) | Mar 17 |
| Server-side login rate limiting (DB-level, not bypassable) | Mar 17 |
| Campaign categories + filter UI | Mar 18 |
| Report abuse flow (routed to admin panel) | Mar 18 |
| Session TTL — 8h auto-logout from localStorage | Mar 19 |
| Demo user ID centralization (DEMO_USER_ID constant) | Mar 19 |
| Notification channel unsubscribe on page unload | Mar 19 |

---

### March 2026 (Week 4) — Security, Quality & Platform

Hardening + platform features before v1.0 declaration.

| Feature | Shipped |
|---------|---------|
| Browser push notifications (Web Push, opt-in) | Mar 20 |
| Client-side image compression (canvas, before upload) | Mar 20 |
| Event RSVP system (DB + service layer) | Mar 21 |
| Public community stats page (no auth required) | Mar 21 |
| Neighborhood leaderboard DB view | Mar 21 |
| CSV export for admin (municipality-ready) | Mar 21 |
| Dynamic avatar tier service (DiceBear, level-based) | Mar 21 |
| RLS security hardening — merge permissive policies | Mar 21–22 |
| `auth.uid()` init-plan optimization (perf advisory) | Mar 21 |
| Missing FK indexes added | Mar 21 |
| `search_path` fixed on all SECURITY DEFINER functions | Mar 21 |
| Notification i18n pipeline (DB triggers → JSON keys → `t()`) | Mar 22 |
| HIBP password breach protection (k-anonymity SHA-1) | Mar 22 |
| Participation rejection notification trigger | Mar 22 |
| Accessibility fixes — `aria-label` across 7 pages | Mar 22 |
| axe-core test suite — 55 a11y tests, blocks on critical violations | Mar 22 |
| File upload E2E tests (Cypress) | Mar 22 |
| Mobile touch E2E tests (Cypress, iPhone 13 viewport) | Mar 22 |
| Visual regression setup (Playwright, 2% pixel tolerance) | Mar 22 |
| Lighthouse CI config (perf ≥ 0.75, a11y ≥ 0.90) | Mar 22 |
| Admin pollution heatmap (Leaflet.heat, session cache) | Mar 22 |
| Offline/online status banner (all pages) | Mar 22 |
| ESLint — 0 warnings across full codebase | Mar 22 |

---

### March 2026 (Week 5) — UX & Feature Completion

Closed the gap between DB capabilities and UI exposure; mobile UX hardening.

| Feature | Shipped |
|---------|---------|
| Before/after comparison slider (clip-path drag) on campaign detail | Mar 23 |
| Mobile bottom navigation — 5-tab, active state, `initBottomNav()` hook | Mar 23 |
| Group Events page (`/events`) — My RSVPs + All Upcoming, cancel RSVP | Mar 23 |
| Dashboard search (server-side `.ilike`, debounced 300ms) + neighborhood filter | Mar 23 |
| `campaign-filters.js` — added `category` filter + null-safe title search | Mar 23–24 |
| `initBottomNav()` active state fix for `/campaign/:id` detail pages | Mar 24 |

---

## 💰 Business Model & Monetization Strategy

> **Current state (Phase 1):** 100% free, grant/public funded. Zero revenue. All rewards are sponsor-donated. Platform adds value but captures none.
>
> **Revised model:** 4 independent revenue pillars, sequenced by time-to-revenue. Each pillar targets a different buyer and can be activated independently — failure of one does not block the others. Core civic participation remains free forever.

---

### Revenue Pillar 1 — B2C Freemium (Q3 2026 · First paid users)

**Thesis:** Don't paywall participation. Monetize status, analytics, and priority access.

**"Clean Quarter Pro" membership — 5 лв/month or 50 лв/year**

| Pro Feature | Free User | Pro User |
|-------------|:---------:|:--------:|
| Join and create campaigns | ✓ | ✓ |
| Earn and redeem points | ✓ | ✓ |
| 24h early access to new rewards | ✗ | ✓ |
| Priority in reward redemption (limited stock) | ✗ | ✓ |
| Personal impact analytics PDF export | Basic view | Full export |
| Private campaigns (invite-only, for friends/family) | ✗ | ✓ |
| "Pro Verified" badge on leaderboard and campaign cards | ✗ | ✓ |
| Access to Pro-only seasonal challenges (higher reward tiers) | ✗ | ✓ |
| Recurring campaign creation | ✗ | ✓ |

**Revenue estimate:** 500 registered users × 5% conversion × 50 лв/year = **1,250 лв/year ARR** at current scale. At 5,000 users: 12,500 лв/year. Grows organically with the user base.

---

### Revenue Pillar 2 — B2B Sponsorships (Q2 2026 · Fastest to revenue)

**Thesis:** Platform generates brand-safe, measurable civic visibility. That is a media product.

| Sponsorship Product | Price | Buyer | Deliverable |
|--------------------|-------|-------|-------------|
| **"Adopt a Spot"** — company adopts a map location | 500–2,000 лв/year | Retailers, developers | Logo on map pin, monthly before/after report, priority cleanup campaigns |
| **Co-branded Challenge** — "Kaufland May Cleanup" | 10,000–20,000 лв/event | FMCG retailers (Kaufland, dm, Billa) | Logo on all campaign cards, custom rewards, end-of-month impact PDF + press release |
| **Reward Pool Sponsorship** — fund one quarter's rewards | 5,000 лв/quarter | Banks, insurers (Bulstrad, OBB, DSK) | Brand on all rewards for the quarter, email blast to all users, impact report |
| **Corporate Volunteer Day** — one-time event | 300–1,000 лв/event | Any Sofia company with CSR budget (Telerik, A1, bTV) | Coordinated campaign for 20–100 employees, branded campaign card, Volunteer Day Report PDF |

**Revenue estimate (Year 1):** 3 Adopt-a-Spot × 1,000 лв + 1 Co-branded Challenge × 10,000 лв + 1 Reward Sponsor × 5,000 лв + 5 Volunteer Days × 500 лв = **~18,500 лв in Year 1** with minimal operational overhead.

---

### Revenue Pillar 3 — B2B2G Institutional SaaS (Q4 2026 · Highest ACV)

**Thesis:** The platform generates compliance-ready, verifiable civic impact data. Institutions that need this data will pay recurring fees.

| Product | Price | Buyer | Notes |
|---------|-------|-------|-------|
| **School / University Community Service** | 200 лв/year/institution | 50+ Sofia high schools | Volunteer hours logging + signed PDF certificate. Mandatory volunteer hours for graduation = institutional need. |
| **Corporate ESG Subscription** | 150–500 лв/year/team | Companies with ESG reporting obligations | Auto-generated branded ESG Impact Report PDF after each team cleanup. |
| **NGO Grant Report Generator** | 300 лв/report or 1,500 лв/year | ~200 BG environmental NGOs applying for EU grants | One-click PDF with all metrics pre-formatted for EU Cohesion Fund, Green Deal, Interreg templates. Data already in DB. |
| **Municipal SLA Contract (B2G)** | 20,000–40,000 лв/year/district | Sofia district councils (Darvenitsa, Studentski, Musagenitsa) | Monthly compliance reports, hazardous waste routing, verified cleanup data for official monitoring. Multi-year contract. |
| **Verified Organizer Subscription** | 50–100 лв/year | Active organizers running recurring campaigns | Priority listing, organizer analytics, recurring campaign feature, campaign template library. |

**Revenue estimate (Year 2):** 10 schools × 200 лв + 5 corporate teams × 300 лв + 10 NGO reports × 300 лв + 1 municipal pilot × 25,000 лв + 20 organizers × 75 лв = **~30,000 лв ARR**, scaling to 150,000+ лв with district-level municipal contracts.

---

### Revenue Pillar 4 — Data & Reports (2027 · Scalable, near-zero marginal cost)

**Thesis:** The platform generates two data assets that are rare: (1) verified geospatial civic engagement data, (2) timestamped before/after photo evidence of public space transformation. Both are commercially valuable.

| Product | Price | Buyer |
|---------|-------|-------|
| **"Clean City Index" annual report** | 2,000 лв (media exclusive 48h) + 1,000 лв/year (real estate companies) | BG media (bTV, Nova, OFFNews) + real estate agencies (Yavlena, Адрес, Homes.bg) |
| **API access tier** | 50–200 лв/month (neighborhood stats, cleanup frequency, engagement scores) | Real estate apps, academic researchers, city data startups |
| **Anonymized dataset licensing** | 2,000–5,000 лв/dataset | Sofia University urban studies, EU-funded research projects, BAS |
| **Real estate "Neighborhood Civic Score" widget** | 500 лв/month branding embed | Imoti.net, Homes.bg property listings |

**Revenue estimate (Year 3):** 1 Index report × 5,000 лв + 5 API subscribers × 1,200 лв + 2 datasets × 3,000 лв = **~12,000 лв/year**, growing as data history depth increases.

---

### Long-term: Gamification-as-a-Service (v3.0)

The points + rewards + leaderboard + photo verification stack is a reusable civic engagement engine applicable to: blood donation (Red Cross), recycling (Екопак), urban gardening, waste sorting. License the technology to 3rd-party organizations: **2,000–5,000 лв setup + 500–1,000 лв/month SaaS**. Requires multi-tenancy isolation — defer until after municipal SLA is proven.

---

### Revenue Pillar 5 — Community Finance & Philanthropy

**Thesis:** The platform sits at the intersection of community action and environmental giving. Both are monetizable with zero new infrastructure.

**"Pledge Drive" — crowdfunding before a campaign**
Organizer sets a pledge threshold: "If 30 people RSVP, local business X matches with 500 лв in rewards." Business posts the pledge in the admin panel. Campaign card shows a live progress bar: "17/30 people — Kaufland reward pool waiting!" Revenue: **10% platform fee on fulfilled pledges**. DB: one `pledge_matches` table (`campaign_id`, `sponsor_id`, `threshold`, `reward_value`, `fulfilled_at`). Creates urgency at discovery, unlocks local business money without direct sales effort.

**"Green Wallet" — points → NGO donations**
Users donate accumulated points to verified Bulgarian environmental NGOs (WWF Bulgaria, Balkani Wildlife Society, Bulgarian Biodiversity Foundation). Rate: 100 points = 1 лв. Revenue: NGOs pay a **5–8% fundraising platform fee** (identical to JustGiving / Benevity model). Opens a new user segment — donors who never clean but want to support financially. Implementation: "Donate my points" button on the rewards page, NGO list in admin panel, monthly batch transfer.

---

### Revenue Pillar 6 — Physical & Subscription Products

**Thesis:** The digital platform creates a trust relationship that extends into physical products with high repeat-purchase potential.

**Monthly "Volunteer Box" subscription — 20 лв/месец**
Delivered to door: eco-friendly cleanup supplies (gloves, biodegradable bags, grabber), discount coupon from a local eco-brand (Bee Brothers honey, PLONQ cosmetics, local organic market) + printed "Volunteer of the Month" card with personal stats. Fulfillment via Econt (already researched for reward delivery). Revenue: **20 лв × 200 subscribers = 4,000 лв/month recurring**. High brand visibility — supplies appear at actual cleanups, seen by all volunteers and passers-by.

**"Cleanup Starter Kit" — physical one-time purchase — 25 лв**
Branded kit: gloves + 20 biodegradable bags + grabber + reflective vest. Sold via app to organizers. Organizers who buy get an "Equipped Organizer" badge on their campaign cards. Revenue: ~40% product margin + badge mechanic creates purchase incentive. Manufactured via private-label from existing BG eco-suppliers (low MOQ).

---

### Revenue Pillar 7 — Micro-credentialing & Professional Status

**Thesis:** Volunteering is increasingly relevant for CVs, university applications, and LinkedIn. The platform can issue verifiable proof that no other service in Bulgaria offers.

**LinkedIn Micro-credentials — 10–20 лв each**
After 5 cleanups: "Community Volunteer" verifiable credential via LinkedIn's Skills & Certifications API. After 25: "Environmental Impact Leader." After 50: "Neighborhood Champion." In-platform badge is free; **the official verifiable credential is paid**. Target: university students, young professionals building LinkedIn profiles. BG context: volunteering credentials are valued in EU hiring but almost never verifiable — this product fills an explicit gap.

**"Impact Certificate" physical product — 15–20 лв with shipping**
Milestone (10 / 25 / 50 cleanups) → user orders a personalized A4 certificate on premium paper: name, cleanup count, estimated kg removed, date range. Displayed free in digital profile; physical version is the paid SKU. Target: school students for university applications, employees for performance reviews. Fulfillment via Econt one-off shipment.

---

### Revenue Pillar 8 — Untapped B2B Segments

**HOA / Property Management (домоуправители) — 200 лв/year per building**
Sofia apartment buildings are managed by HOAs with mandatory maintenance budgets that NEED to show residents visible results. Product: Building Cleanup Subscription. HOA gets: dedicated campaign tagged to their building, branded campaign card, quarterly impact PDF for tenant noticeboard, priority organizer support. Revenue: **50 buildings × 200 лв = 10,000 лв/year ARR**. Reachable directly through property management companies (Bulgarian Properties management arm, Unique Estates). No procurement complexity — HOA chair signs PDF contract.

**Property Developer "Neighborhood Vitality Report" — 1,000–3,000 лв/report**
When Artex or Stone Capital launches a new Sofia residential building, they need to show buyers the neighborhood is desirable. Platform generates a premium report: cleanup frequency (last 24 months), volunteer density map, before/after transformation gallery, civic score trend. Designed to be embedded in property prospectus. Revenue: one-time report fee. Target: 20+ major Sofia residential developers each launching 2–5 buildings per year. **Entirely passive revenue — report generated automatically from existing data.**

**Employer Benefit — bulk Pro subscriptions via HR platforms**
HR platforms in Bulgaria (Worksmile, Edenred, Sodexo Benefits) offer employee benefit catalogues. Get listed as a wellness/CSR benefit: **company pays 40 лв/employee/year** (vs. 50 лв direct). 50-employee company × 40 лв = 2,000 лв/year per client. Target: tech companies (Progress/Telerik, ScaleFocus, Paysafe Sofia) with sustainability-conscious HR departments actively seeking differentiating benefits. No new product needed — bundles existing Pro membership into a B2B sales channel.

**Insurance micro-discount partnership**
Partner with Bulstrad or Generali Bulgaria: residents who log 3+ verified cleanups/quarter get a 50 лв/year home insurance discount. Insurance company uses platform's verified participation API to confirm eligibility. Revenue: **referral fee** (100–300 лв per converted policyholder) OR annual validation API access fee (5,000–10,000 лв/year). Insurance company wins: measurable risk-reduction signal (cleaner neighborhoods = lower vandalism/property damage) + sustainability brand positioning. Unprecedented in the BG market — first-mover advantage is significant.

---

### Revenue Pillar 9 — Platform as Civic OS

**Thesis:** The gamification + photo verification + community mobilization stack is not inherently about cleanups. Any civic action requiring verified evidence + community coordination can run on this infrastructure.

**Civic Campaign Tool — 100–500 лв/campaign (non-cleanup use)**
Neighborhood associations, civic groups, local politicians pay to use the platform for other activities: tree planting, graffiti removal, petition drives, neighborhood surveys. Platform fee per campaign. The entire technical stack works unchanged — only the campaign category changes. **Reframes the product from "cleanup app" to "civic engagement OS"** — a fundamentally larger addressable market.

**Voluntourism / Sofia Tourism partnership**
Sofia Tourism Agency (Visit Sofia) wants a "sustainable destination" story. Partner: platform offers "I Cleaned Sofia" experience for eco-tourists and digital nomads — 1-day campaign participation, local guide, branded as sustainable tourism. Revenue: Sofia Tourism Agency pays **3,000–5,000 лв/year** for co-branding + platform inclusion in their international digital marketing. Tourists who participate receive a "Sofia Volunteer" souvenir certificate. International user acquisition channel at near-zero marketing cost.

---

### Business Model Transition Sequence

```
Phase 1 (Now)        → Phase 2 (Q3 2026)          → Phase 3 (2027)               → Phase 4 (2028+)
Grant/free           → B2B Sponsorships            → Institutional SaaS           → Data + Community Finance
                       + Freemium Pro               + Municipal SLA                + Physical products
                       + HOA + Volunteer Day        + Green Wallet + Pledges       + Civic OS licensing
                       + Employer Benefits          + NGO Grants + Credentials     + GaaS + Insurance
0 лв revenue         → ~25,000–35,000 лв/year      → ~80,000–120,000 лв ARR      → ~250,000+ лв ARR
```

> **Full monetization implementation plan with code estimates, BD steps, quarterly targets, and prioritization matrix:** [docs/BUSINESS_MODEL.md](docs/BUSINESS_MODEL.md)

---

### Additional Revenue Ideas (Round 3)

| Idea | Revenue Model | Code Effort | BD Required |
|------|---------------|-------------|-------------|
| **"Neighborhood Restaurant Week"** — restaurant pays 50–200 лв/week to be the week's cleanup sponsor; all participants get a discount coupon | Weekly sponsor fee, 100–1,200 лв/month at scale | S (2–3 days) — `weekly_sponsor` table + dashboard banner | Light: cold email to local restaurants |
| **"Adopt a Tree" — urban greening companion** | 20 лв/tree/year adoption fee (split platform/municipality fund); residents earn points for tree care logs | M (2 weeks) — new entity type, map pins, care log, adopt flow | Sofia Green System partnership for official tree registry data |
| **Media Content Subscription — "Story of the Week"** | 500 лв/month per news outlet (Dnes.bg, Blitz.bg, Sofia Live) for weekly auto-generated before/after story package | S (1 week) — admin selects best photo pair, generates HTML/PDF press kit | Cold outreach to 5 local news editors |
| **"Gamification for Recycling" pilot — Екопак** | 5,000–15,000 лв/year from Екопак for the gamification layer on their recycling drop-off network | L (1–2 months) — QR system, new activity type, multi-tenant isolation prototype | Business pitch to Екопак Bulgaria; first GaaS proof of concept |
| **Carbon Credits integration** | 5% of credit proceeds via carbon offset marketplace (South Pole, voluntary EU market) | S after waste weight field exists — CO₂ formula + marketplace API | Carbon registry accreditation (multi-month process); long-term only |

---

## 🔨 Product Backlog

### v1.2 — User Experience (Next Sprint)

Closing the gap between what the DB supports and what the UI exposes.

#### P0 — Missing UI for existing DB features

| Feature | Effort | Rationale |
|---------|--------|-----------|
| ~~**Group Events page**~~ | ~~Medium~~ | ✅ Shipped Mar 23 |
| ~~**Dashboard search & filter**~~ | ~~Small~~ | ✅ Shipped Mar 23 |

#### P1 — High UX value, low effort

| Feature | Effort | Rationale |
|---------|--------|-----------|
| **Skeleton loading screens** | Medium | Current UX shows empty space while fetching. Skeleton cards make the app feel faster and production-quality. |
| ~~**Mobile bottom navigation**~~ | ~~Small~~ | ✅ Shipped Mar 23 |
| ~~**Before/after comparison slider**~~ | ~~Small~~ | ✅ Shipped Mar 23 |
| **Weather forecast on campaign cards** | Small | `weather.js` (Open-Meteo, no API key) is already integrated on the dashboard. Extend it: each campaign card shows the weather forecast for its `scheduled_date`. "Sunny 18°C ☀" vs "Rain expected 🌧" directly affects attendance decisions. Weather data is already being fetched — just surface it on the card. |
| **Weather on campaign detail page** | Small | Same `weather.js` integration, extended to the campaign detail page to show the full forecast for the exact `scheduled_date` — not just an icon but a 3-day outlook. Users visit the detail page immediately before deciding to join. "Rain expected on Saturday" is the most actionable last-mile info. Currently the detail page shows no weather at all. Zero new infrastructure — one function call from existing `weather.js`. |
| **Rank tier progression bar on profile** | Small | Profile currently shows rank badge (Bronze/Silver/Gold) but no context. Add a horizontal progress bar: "Silver — 63 pts. 37 more to reach Gold 🥇". The Bronze→Silver threshold is 50 pts and Silver→Gold is 100 pts — already calculated in `displayRank()` at `profile.js:286`. Zero backend. Pure UI addition that converts a static label into a motivational mechanic. |
| **Interactive onboarding for first-time users** | Small | New users land on dashboard with zero guidance and high dropout. A 3-step overlay: "1. Find a campaign near you → 2. Join and upload an after photo → 3. Earn points and redeem rewards" — with a highlighted demo campaign on the map. Shown once (localStorage flag), skippable. No backend changes. |
| **Campaign capacity (max\_participants) + urgency signal** | Small | Organizer sets `max_participants` (e.g. 15). Campaign card shows "3 spots left!" when nearing capacity. Scarcity is the strongest non-coercive driver of action in civic platforms. One new DB column + UI update. |

#### P2 — Completes existing features

| Feature | Effort | Rationale |
|---------|--------|-----------|
| Password strength meter | Small | HIBP blocks breached passwords. Visual strength bar (Weak/Good/Strong) complements it at the input level. The `initPasswordStrengthMeter()` component already exists in `src/components/passwordStrength.js` — it is simply never called from the register or reset-password pages. Two lines of code. |
| Google OAuth | Small (config) | Reduces registration friction significantly for young users. Supabase supports it — mostly Dashboard config. |
| Caching layer (sessionStorage) | Small | Reduce redundant Supabase reads for campaigns list. 5-minute TTL, invalidated on create/edit. |
| Campaign difficulty rating | Small | Organizer tags campaign as Easy / Medium / Hard (expected bags, equipment needed). Reduces dropout for first-time participants who can't estimate effort. |
| 24h reminder push notification | Small | Push infrastructure exists. Scheduled DB job or Supabase Edge Function fires 24h before campaign start. High dropout between RSVP and attendance — this directly addresses it. |
| **Campaign category badge on cards + detail page** | Small | Each campaign has a `category` column (park / street / water / other) and i18n keys already exist (`campaign.categoryPark`, `campaign.categoryStreet`, etc.). Currently the category is collected in the creation form and aggregated in the stats page — but never shown on the campaign card or detail page. Add a colored pill badge ("🌳 Park", "🚶 Street") to each card. Zero backend, one template change. Users instantly see what type of cleanup they're joining without reading the description. |
| **Login lockout countdown UI** | Small | `check_login_rate_limit` RPC already returns `{ allowed: boolean, remaining: number }` and is called before every login attempt. When `allowed: false`, the UI currently shows a generic error. Instead, show: "Too many attempts. Try again in 4 minutes." with a live countdown timer. The data is already in the RPC response — it just isn't surfaced. Reduces support friction and signals to legitimate users that the wait is bounded. |
| **"What to bring" supply checklist per campaign** | Small | Organizer checks off from a predefined list: "bags provided ✓", "gloves provided ✓", "transport available ✓", "suitable for children ✓", "wheelchair accessible ✓". Shown on campaign card and detail page. Eliminates the #1 unspoken barrier for first-timers who don't know what to prepare. Stored as JSONB on `campaigns`. |
| **Trending social proof widget on campaign cards** | Small | Campaign card shows "🔥 12 people joined this week" or "👀 3 people viewing" based on real `participations` data already in the DB. Social proof is the strongest non-intrusive motivator for joining — seeing that others committed reduces individual friction dramatically. Pure frontend aggregation over existing data, no new tables. |
| **Profile completeness score** | Small | Profile page shows a horizontal progress bar: "Profile 60% complete — add a neighborhood and avatar to earn 10 bonus points." Steps: avatar uploaded, neighborhood set, first participation, first reward redeemed. All data already exists in `profiles` + `participations` + `point_transactions`. Drives profile completion, which improves leaderboard quality and community identity. Shown once until 100%, then hidden. |
| **Points earned displayed per participation** | Small | `participations.points_earned` column is stored in the DB and set by `approve_participation` RPC — but the Profile page's participations tab never reads or displays it. Show "✓ +20 pts" next to each approved participation in the existing participation list. One extra column in the query, one line of template code. Makes the reward loop visible and reinforces the connection between effort and reward. |
| **"Level up" celebration on rank threshold** | Small | When a user's `points_balance` crosses 50 (Bronze→Silver) or 100 (Silver→Gold), show a one-time celebration Swal with the new rank badge and a social nudge: "You're now Gold! Share your achievement." Currently rank upgrades happen silently — the user may never notice. The threshold check can run client-side after any points-earning action using the existing `displayRank()` logic and a localStorage flag to prevent repeat celebrations. |

---

#### UX Debt & Navigation Architecture (Mar 2026 audit)

Senior UI/UX audit conducted Mar 24, 2026. Findings grouped by severity.

**Navigation Architecture — structural decisions**

The current top navbar treats all destinations with equal visual weight. Recommended restructuring:

| Item | Current | Recommended |
|------|---------|-------------|
| "Нова кампания" | Plain nav-link | `btn btn-success` CTA — it's the primary product action, not a page link |
| "Събития" | Top nav link | Consider removing from top nav; accessible via bottom nav + dashboard; rename to "Моите Събития" for clarity |
| "Награди" | Plain nav-link | Add live points counter next to icon: `🏆 143 ⭐` — makes the gamification bar always visible |
| Dashboard/Home | Only via logo click | Add explicit "Начало" link OR make logo visually obvious as home (tooltip, underline on hover) |
| "Излизане" | Inline with main nav | Move to profile dropdown or add visual separator — it's a destructive action, not a destination |

**Critical UX gaps (must fix before v1.0 declaration)**

| Issue | Severity | Location | Fix effort |
|-------|----------|----------|-----------|
| Campaign cards not keyboard accessible — no `tabindex="0"`, no `role`, no Enter handler | Critical | `dashboard.js` DOM injection | Medium |
| Rewards page has no empty state — blank grid if no rewards exist | Critical | `rewards.html:141` | Low |
| Notification bell renders for demo users but is non-functional (false affordance) | Critical | `dashboard.js:70` | Low |
| Required form fields have no visual marker — only HTML5 `required` attribute, no `*` | High | All forms | Low |
| Create Campaign has no Back button — users can only use browser back or navbar | High | `create-campaign.html` | Low |
| JS-rendered campaign card images have no `alt` text | High | `dashboard.js` | Low |
| Form validation uses browser-default messages (not localized, not styled) | High | `create-campaign.html` | Medium |

**Medium priority UX improvements**

| Issue | Location | Fix effort |
|-------|----------|-----------|
| Rewards page has no search or filters — feature parity gap vs dashboard | `rewards.html` | Medium |
| Dashboard campaigns empty state has no CTA ("Няма кампании → ➕ Създай нова") | `dashboard.html` | Low |
| Campaign detail edit form unclear — save/cancel flow ambiguous | `campaign-detail.html` | Medium |
| `loading="lazy"` missing on all campaign card images — will hurt at 100+ campaigns | `dashboard.js` | Low |
| Button styles duplicated across CSS files — `.btn-back`, `.btn-secondary-action` outside `style.css` | Multiple `.css` files | Medium |
| Event card neighborhood label at `.8rem` may be too small on mobile (style.css:792) | `style.css` | Low |
| Footer uses hardcoded `#333` instead of CSS variable | `style.css:328` | Low |

**Accessibility gaps (WCAG)**

| Issue | Severity | Fix |
|-------|----------|-----|
| Campaign cards not reachable by keyboard (no `tabindex`, no `role="link"`) | High | Add `tabindex="0"` + Enter/Space handler in `dashboard.js` |
| Comparison slider is mouse-only — keyboard users cannot interact | Medium | Add ArrowLeft/ArrowRight key support in `campaign-detail.js` |
| Admin photo modal has no focus trap — Escape may not close it | Medium | Trap focus inside modal, close on Escape |
| Profile page has no `Back to Dashboard` explicit affordance | Low | Add breadcrumb or back link |

**Additional findings from deep scan (Mar 24, 2026)**

| Issue | Severity | Location |
|-------|----------|----------|
| `setupGlobalErrorHandling()` exported but never called — unhandled rejections silently swallowed | High | `src/services/errorHandler.js:260` |
| `initializePWA()` exported but never called — install prompt, push permission request are dead code | High | `src/services/pwa.js:13` |
| PWA service worker registered at wrong path `/public/service-worker.js` (should be `/service-worker.js`) — SW never activates | High | `src/services/pwa.js:17` |
| Double error dialog on login/register/logout — `auth.js` shows Swal then throws, caller shows Swal again | High | `src/services/auth.js:77,134,156` + `src/main.js` |
| Double error dialog on photo upload — same pattern in `storage.js` | Medium | `src/services/storage.js:38,57,88` |
| ~~XSS in Leaflet popups — `campaign.title` and `disposal_point.name` inserted via template literal without `escapeHTML()`~~ | ~~High~~ | ~~`src/services/map.js:100–104,176–179`~~ | ✅ Resolved — `escapeHTML()` applied on all interpolated fields |
| Neighbourhood string mismatch — `"Vitosha (VEC)"` vs `"Kv. Vitosha (VEC)"` across files — leaderboard lookup silently fails | Medium | `dashboard.js:115` vs `campaign-filters.js:9` |
| ~~`notifications.js` XSS — legacy DB notification messages (containing usernames) inserted as raw innerHTML~~ | ~~Medium~~ | ~~`src/services/notifications.js:155`~~ | ✅ Resolved — `escapeHTML(msg)` applied |

**Quick wins (< 1 hour each)**

1. `required::after { content: " *"; color: var(--danger-color); }` in `style.css` — marks all required fields
2. Empty state for rewards grid — 5 lines of HTML + show/hide in `rewards.js`
3. Hide notification bell for demo users — 1 `if (isDemoUser())` check in nav init
4. `loading="lazy"` on all `<img>` in JS-rendered cards — one attribute per template literal
5. "← Назад към началото" link at top of `create-campaign.html` — 2 lines of HTML
6. `aria-disabled="true"` on out-of-stock reward buttons — 1 attribute in `rewards.js`
7. "Showing top 20" label on leaderboard — 1 line of HTML
8. `?.addEventListener(...)` null guard in `profile.js:699` — 1 character fix

---

### v1.3 — Growth Infrastructure (3–6 months)

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Multi-photo evidence upload | P1 | Richer proof, harder to game. One photo can be staged. |
| Campaign text search (server-side) | P1 | Client-side filter works at 100 campaigns; Supabase full-text search for 1000+. |
| Reward fulfillment tracking | P1 | Close the loop with reward sponsors — verify delivery. |
| GDPR data export + erasure | P1 | Legal requirement. User can download/delete their data. |
| **Recurring campaigns** | P1 | Organizer sets a repeat schedule (weekly / monthly). Platform auto-generates next instance. Without this, there is no habit formation — every cleanup is a one-off. Retention structurally requires recurring events. |
| **Streak mechanics** | P1 | Badge + bonus points for N consecutive weeks of participation. Streaks are the primary retention driver in gamification — currently absent. Users have no reason to return the week after a cleanup. |
| **Public before/after gallery** | P1 | Approved photo pairs made visible on the campaign page and a public gallery. Currently visible only to admin during review. Strongest social proof for new users and institutional stakeholders. Zero new infra — photos already exist in storage. |
| **Achievement badge system** | P1 | Points are currency; badges are social capital — they serve a different psychological need. Proposed set: "First Cleanup" (join 1), "Dedicated Volunteer" (5 cleanups), "Neighborhood Champion" (most cleanups in neighborhood this month), "Rain Warrior" (campaign on a rainy day), "Early Bird" (campaign starting before 9am), "Organizer" (create 3 campaigns). Displayed on profile and visible to others. DB: `badges` table + `user_badges` junction. No points involved — badges are unlocked, not earned. |
| **Shareable impact card** | P1 | After a participation is approved, user can generate a shareable image card (Canvas API, client-side): "I cleaned Darvenitsa! 🌱 Bag count: 5. Points earned: 20." Formatted for Instagram Stories / WhatsApp. This is the highest-ROI acquisition feature available — word-of-mouth in Bulgarian civic communities happens on WhatsApp and Facebook groups, not social feeds. Zero backend. |
| **Personal impact dashboard** | P1 | Dedicated section in the profile page: total campaigns, neighborhoods covered, total points earned lifetime, total rewards redeemed, estimated kg waste removed (if weight field added — see below), ranking in each neighborhood. All data already exists in `point_transactions`, `participations`, and `profiles` — this is aggregation + visualization only. Makes individual impact tangible and shareable. |
| **Waste weight estimation per participation** | P1 | Optional field on proof upload: estimated bags removed (1–3 / 4–6 / 7–10 / 10+). Each range maps to a kg estimate. Aggregated platform-wide: "Darvenitsa removed 2.3 tonnes in Q1 2026." This single metric unlocks press coverage, NGO grant applications, and ESG reporting for corporate partners. One new column on `participations`. |
| **Seasonal challenges** | P2 | DB-driven config table: `challenges` (name, start_date, end_date, required_participations, bonus_points, badge_id). Example: "Spring Cleaning Month" (April) — complete 3 campaigns → 2× points + exclusive badge. Creates coordinated engagement spikes that pair naturally with municipality PR campaigns and press moments. Replaces the need for push marketing. |
| **Location impact timeline** | P2 | Each map pin shows cleanup history — "12 cleanups here, last 3 days ago". Converts invisible volunteer effort into a visible, measurable record. Strong retention hook for organizers who own a location. |
| **Municipal public dashboard** | P2 | Public read-only page with aggregated stats per neighborhood — no auth required. Lightweight version of the existing community stats page, formatted for district administration reporting. Prerequisite for institutional partnerships. |
| Business sponsor self-serve portal | P2 | Revenue enabler — sponsors manage own rewards without admin ops. Prerequisite for platform sustainability. |
| Basic analytics (Plausible/PostHog) | P2 | No funnel or retention data currently. |
| Configurable points per campaign | P2 | All cleanups treated as equal today — unfair for large vs. small events. |
| **"Clean Quarter Pro" freemium membership** | P1 | First B2C revenue stream. 5 лв/month or 50 лв/year. Unlocks: 24h early reward access, priority in limited-stock redemption, private (invite-only) campaigns, "Pro Verified" badge on leaderboard, personal impact PDF export, recurring campaign creation, Pro-exclusive seasonal challenge tiers. **Critical design principle: core civic participation (join, upload, earn) is free forever — Pro monetizes status and analytics, not participation.** Requires: `profiles.subscription_tier` column, Stripe Checkout integration (already needed for Campaign Boost), subscription webhook handler. |
| **"Adopt a Spot" corporate location sponsorship** | P1 | Company pays 500–2,000 лв/year to adopt a specific map location (park, street corner, playground). Gets: logo overlay on the map pin, monthly automated before/after photo report email, platform coordinates priority cleanup campaigns at that location. Admin panel: new "Sponsors" tab to manage adopted locations and generate monthly reports. DB: `location_sponsors` table (location_lat, location_lng, company_name, logo_url, expires_at). Zero ops cost per renewal — reports auto-generated from existing photo + participation data. **First B2B revenue product — can be closed via email/PDF contract, no complex procurement.** |
| **Corporate Volunteer Day — per-event product** | P1 | Any Sofia company with a CSR budget books a "Corporate Volunteer Day" via a simple form (company name, desired date, participant count, neighborhood). Platform creates a dedicated campaign pre-branded with company logo, coordinates with organizers, provides on-the-day announcement tool, and auto-generates a "Volunteer Day Report" PDF (photos, participants, impact metrics, GPS location) after completion. Priced at 300–1,000 лв per event with no subscription required. **Low barrier: one-time transaction, immediate deliverable, zero ongoing commitment.** Distinct from Corporate ESG Subscription (v2.0): this is per-event, HR-facing, not compliance-facing. |
| **NGO Grant Report Generator** | P2 | EU Cohesion Fund, Green Deal, Interreg, and Open Society grants all require standardized impact reports. Platform generates a one-click PDF report pre-formatted for EU grant templates: volunteer hours (participants × campaign duration), waste removed (sum of bag estimates), geographic coverage (neighborhood map), before/after photo evidence pairs, unique volunteers count, campaign frequency. Sold to BG environmental NGOs (est. 200+ in Sofia) at 300 лв/report or 1,500 лв/year unlimited subscription. All data already exists in DB — this is a PDF template + export function. **Opens direct access to the NGO sector which operates almost entirely on EU grants.** |
| **Co-branded seasonal challenge — sponsor API** | P2 | Extend the Seasonal Challenges feature (already planned) with a commercial layer: a company (Kaufland, dm, Billa, Lidl) pays 10,000–20,000 лв to sponsor a named month-long challenge ("Kaufland Пролетно почистване 2026"). Their brand appears on all campaign cards during the challenge month, a custom reward tier uses their vouchers, and the platform generates an end-of-month ESG impact package (PDF report + 10 social media graphics with before/after photos + press release template). **This turns seasonal challenges from a retention mechanic into a revenue-generating media product.** |
| **Batch participation approval in admin panel** | P1 | Admin currently approves/rejects one participation at a time. With 10+ pending submissions after a busy weekend, this is the highest-friction admin workflow. Add checkbox selection + "Approve selected (N)" + "Reject selected (N)" that fires a single `rpc('approve_participation')` loop. The `handleApprove()` / `handleReject()` functions already exist — batch is an orchestration layer on top. Reduces admin session time from 15 minutes to 2 minutes per cleanup event. |
| **Campaign organizer announcements to participants** | P1 | Organizer can post a short update (e.g. "Meeting point changed to the north entrance!") visible on the campaign detail page and pushed as a notification to all current participants. Requires: `campaign_announcements` table (campaign_id, author_id, body, created_at) + Supabase trigger to fan out `notifications` rows to all participants. Solves the #1 on-day coordination problem — currently there is no way to reach enrolled participants. |
| **"My Campaigns" organizer analytics** | P2 | Organizers who created campaigns get a dedicated tab or page: views per campaign (requires a simple `campaign_views` counter), RSVP count, attendance rate (approved / joined), average points awarded. All data already exists in `participations`, `event_rsvps`, and `point_transactions`. Makes organizing feel meaningful and measurable. Prerequisite for retaining repeat organizers — currently they get zero feedback on their events. |
| **Win-back re-engagement emails** | P2 | Supabase scheduled Edge Function (cron) runs weekly: finds users with last participation older than 30 days, sends a personalised email via Supabase Auth email templates: "Your neighborhood missed you — 3 cleanups happened in Darvenitsa since you last joined." Deeplink to dashboard. No third-party email service required (Supabase Auth handles SMTP). Retention intervention at the 30-day churn cliff. |
| **Monthly neighborhood cleanliness score** | P2 | DB-computed score per neighborhood per month: weighted formula of (campaigns_completed × 3) + (participants × 2) + (kg_waste_estimated). Published on the leaderboard and public stats page. Resets monthly — maintains ongoing competition and gives the press a "Sofia's cleanest neighborhood of the month" story hook every 4 weeks. Computed by a Supabase scheduled function into a `neighborhood_monthly_scores` materialized table. |
| **Air quality index overlay on dashboard** | P2 | Air quality API (WAQI — free, 1000 req/day, no key required for basic endpoints) returns AQI for Sofia. Show a small status badge on the dashboard: "Air quality today: Good 🌿 / Moderate ⚠️ / Unhealthy 🔴". When AQI is high, show a contextual nudge: "Poor air quality in your area — cleaning up litter reduces particulate matter. View upcoming campaigns." Connects the platform's mission to an immediate personal health context. Implementation identical to the weather widget already in `weather.js`. |
| **Automated suspicious submission detection** | P2 | Supabase DB trigger or scheduled function scans for patterns: same photo hash submitted twice (pHash comparison), participation approved within 60 seconds of submission, user submitting proofs for 3+ campaigns in the same hour. Flag matching records in an `admin_flags` table with reason. Admin panel gains a "Flagged Submissions" tab. Currently all fraud detection is manual — one determined abuser can farm unlimited points. No ML required — rule-based pattern matching is sufficient at this scale. |
| **Notification center / history page** | P1 | The `notifications` table stores `participation_id`, `report_id`, and `campaign_id` FK columns — but the notification dropdown only shows 20 items as plain text, and those FKs are never read to create deeplinks. Build a full `/notifications` page: unlimited history, filter by read/unread or by type (approval, rejection, comment, system), each notification deeplinks to the relevant campaign/participation. Solves the silent data loss problem for active users who overflow the 20-item cap. One new HTML page + extend existing `notifications.js`. |
| **Individual user global leaderboard** | P1 | The neighborhood leaderboard shows aggregated points by neighborhood — but there is no ranking of individual volunteers. `profiles.points_balance` already exists and is accurate. Add a "Top Volunteers" tab to the leaderboard section: paginated table of top 50 users (username, neighborhood, points, rank badge). Your own row is highlighted even if outside top 50. Creates personal competitive motivation that the neighborhood leaderboard (which rewards entire areas) cannot. |
| **Push notification expansion** | P1 | The `pushNotifications.js` service and `send-push-notification` Edge Function exist and work — but currently only fire for admin approval/rejection. Extend to: (a) new campaign in your neighborhood (DB trigger on `campaigns.insert`), (b) RSVP confirmation (DB trigger on `event_rsvps.insert`), (c) 1h before your RSVP'd campaign starts (scheduled Edge Function), (d) someone comments on your campaign (DB trigger on `campaign_detail_comments.insert`). All four use existing infrastructure. Each trigger is 5-10 lines of SQL + one Edge Function call. |
| **Disposal point → campaign linkage** | P2 | The `disposal_points` table exists with full lat/lng data and appears on the map as green markers — but campaigns have no link to the nearest disposal point. Add optional `disposal_point_id` FK on `campaigns`. Campaign detail page shows "🗑 Nearest drop-off: 120m north" with a mini-map pin. Organizers who link their campaign to a disposal point get a badge ("Organized cleanup ✓"). Closes the logistical loop that volunteers most frequently ask about: where do we take the bags? |
| **Campaign completion flow + impact summary** | P2 | Campaigns currently stay "active" indefinitely after their `scheduled_date` passes. A scheduled Edge Function (daily cron) marks campaigns whose `scheduled_date + 1 day` has passed as `status = 'completed'`. The campaign detail page for completed campaigns then shows an **impact summary card**: total participants approved, total points awarded (sum of `participations.points_earned`), estimated waste removed (sum of bag estimates if field added). Makes the platform's history visible and creates a shareable artifact for organizers. |
| **Abuse report transparency for reporters** | P2 | Users who submit an abuse report via the campaign report button get zero feedback — the report disappears into admin. Add: (a) a `notification` row created when `reports.status` changes to `resolved` or `dismissed`, referencing the original `reports.id`, and (b) a "My Reports" tab in the profile page listing submitted reports with current status. The `reports` table already tracks `reviewed_by`, `admin_notes`, and `status` — this is purely a UI and notification trigger addition. Builds trust that reporting is meaningful rather than performative. |
| **Weekly neighborhood digest email** | P2 | Supabase scheduled Edge Function (Monday 09:00 cron) queries each user's neighborhood and composes a personalized email: "3 cleanups happened in Darvenitsa last week. 47 volunteers participated. Next cleanup: Saturday at 10:00." Sent via Supabase Auth SMTP — no third-party email service required. Opt-out via `notifications_enabled` profile field (already exists and is tracked but never read by any notification path). The single highest-retention lifecycle touch point at zero incremental infrastructure cost. |
| **Campaign countdown timer on cards** | P1 | Campaign cards show the scheduled date but no countdown. Add a real-time counter: "Starts in 2 days 14 hours" (or "Tomorrow at 10:00" / "Today at 10:00"). Computed client-side from `scheduled_date` + `start_time` columns already in every campaign query. No backend. Creates urgency at the discovery moment — the strongest non-modal call-to-action available. |
| **iCal / Google Calendar export** | P1 | Campaign detail page gets an "Add to Calendar" button that generates an `.ics` file (RFC 5545) containing campaign title, date, start/end time, location (lat/lng → Google Maps link), and description. Works with Google Calendar, Apple Calendar, Outlook, and every Android calendar app. All required data (`scheduled_date`, `start_time`, `end_time`, `location_lat`, `location_lng`) is already fetched on the detail page. Client-side generation — no backend call. Solves the most common dropout cause: people intend to join but forget the date. |
| **Admin manual point adjustment** | P1 | `point_transactions.type` schema already defines `'admin_adjustment'` as a valid type — but there is no UI to create one. Admin panel gets a "Adjust Points" button per user: enter amount (positive or negative) + mandatory reason field. Creates an `admin_adjustment` transaction visible in the user's history and updates `profiles.points_balance`. Required for: correcting double-approval bugs, compensating for cancelled campaigns, handling sponsor-funded point top-ups. Without this, admins have no recovery path for balance errors. |
| **Disposal points admin management UI** | P2 | The `disposal_points` table has full RLS policies (admin insert/update/delete, public read) and is rendered on the map as green markers — but there is no admin UI to manage these points. Add a "Disposal Points" tab to the admin panel: list view of all points with name/address/coords, "Add new" form (name, address, lat/lng picker using the existing Leaflet map), and delete button. Currently, disposal points can only be added via direct SQL — any change requires DB access. Empowers admins to maintain accurate recycling infrastructure data without developer involvement. |
| **Granular push notification preferences** | P2 | The profile page has a single `notifications_enabled` toggle (backed by `profiles.notifications_enabled`). But `pushNotifications.js` already supports per-user subscriptions, and the `notifications` table has a `type` column (`approval`, `campaign_update`, `system`, `moderation`, `achievement`). Extend the profile settings UI with per-category toggles: "Campaign approvals ✓", "New campaigns in my area ✓", "Comments on my campaigns ✓", "System announcements ✓". Stored as a JSONB `notification_preferences` column on `profiles`. Users who turn off all push often just want to reduce noise — granular control prevents full unsubscribes. |

---

### v1.5 — Bulgaria-wide Expansion 🇧🇬 ⚡ HIGH PRIORITY

> **Decision (2026-03-25):** Expand from 5 Sofia neighborhoods to all of Bulgaria.
> Full implementation plan documented and approved. Requires ~1 sprint.
> Map tile provider must switch from OSM (dev-only policy) to Stadia Maps (free tier, production-safe) as part of this work.

#### Why now
The Sofia-only restriction is hardcoded in 3 layers simultaneously (JS constants, DB CHECK constraint, HTML dropdowns). The longer we wait, the more campaigns accumulate under Sofia assumptions. All 18 affected files are mapped — no unknowns.

#### Implementation plan (ordered, no skipping steps)

**Phase 1 — Database (3 migrations, run in order)**

| Migration | File | Change |
|-----------|------|--------|
| 1 | `20260325_01_drop_sofia_bounds_constraint.sql` | `DROP CONSTRAINT campaigns_location_within_sofia` — removes the lat/lng hard block |
| 2 | `20260325_02_add_city_field.sql` | Add `city TEXT NOT NULL DEFAULT 'Sofia'` to `campaigns`; add `city TEXT` to `profiles`; backfill existing 61 campaigns with `'Sofia'`; add indexes on both |
| 3 | `20260325_03_update_leaderboard_for_cities.sql` | Rebuild `neighborhood_leaderboard` VIEW and `get_public_neighborhood_stats()` function to group by `city + neighborhood` |

**Phase 2 — Shared / Constants (`src/utils/constants.js`)**
- Remove `SOFIA_BOUNDS`, `isWithinSofia()`
- Add `BULGARIA_CITIES` array (top 10 cities: Sofia, Plovdiv, Varna, Burgas, Ruse, Stara Zagora, Pleven, Sliven, Dobrich, Shumen)
- Add `BULGARIA_BOUNDS` (soft — for UX warning only, not blocking)
- Add `isWithinBulgaria(lat, lng)` — returns `false` only for clearly wrong coords (oceans, other countries)

**Phase 3 — Map infrastructure**
- `src/services/map.js`: center → Bulgaria center (42.7339, 25.4858), zoom 7; switch tiles to Stadia Maps (requires free API key → `VITE_STADIA_MAPS_KEY` in `.env`)
- `src/scripts/admin.js:1295`: same tile switch for admin heatmap
- `src/services/weather.js`: replace hardcoded `SOFIA_LAT/SOFIA_LNG` with dynamic coords from campaign/user location

**Phase 4 — Create Campaign flow**
- `src/pages/create-campaign.html`: replace 5-item `<select>` with city `<select>` (10 cities) + free-text `<input>` for neighborhood
- `src/scripts/create-campaign.js`: `isWithinSofia` → `isWithinBulgaria` (soft warning popup, not hard block); add `city` field to Supabase insert

**Phase 5 — Dashboard + Leaderboard**
- `src/pages/dashboard.html`: add city filter `<select>`; neighborhood filter → text search `<input>`
- `src/scripts/dashboard.js`: remove `NEIGHBORHOOD_I18N` hardcoded mapping; update leaderboard display to `"Sofia · Studentski Grad"` format; city filter logic

**Phase 6 — Profile**
- `src/pages/profile.html`: add city `<select>` above neighborhood; neighborhood → `<input type="text">`
- `src/scripts/profile.js`: read/write `city` to Supabase

**Phase 7 — Admin**
- `src/scripts/admin.js`: add City column to users table; add city export filter; include city in user search

**Phase 8 — i18n (4 files)**

| Key action | Files |
|---|---|
| Remove `campaign.outsideSofia`, `campaign.locationOutsideSofia` | all 4 i18n files |
| Add `campaign.outsideBulgaria` (soft warning) | all 4 i18n files |
| Add `campaign.cityLabel` ("Град" / "City") | all 4 i18n files |
| Remove `neighborhoods.*` object (5 hardcoded names) | all 4 i18n files |
| Add `leaderboard.cityNeighborhood` ("{{city}} · {{neighborhood}}") | all 4 i18n files |
| Update landing subtitle ("keeping Sofia clean" → "keeping your city clean") | `en.json` |

**Phase 9 — Tests (3 suites)**
- `tests/leaderboard.test.js`: add `city` to mock data; test city+neighborhood grouping; remove `NEIGHBORHOOD_I18N` mapping assertions
- `tests/campaign-categories.test.js`: add `city` field to test campaign objects
- `tests/create-campaign.test.js`: replace `isWithinSofia` tests with `isWithinBulgaria`; test soft warning behavior

#### Affected files (18 total)
`constants.js` · `map.js` · `weather.js` · `create-campaign.js` · `create-campaign.html` · `dashboard.js` · `dashboard.html` · `profile.js` · `profile.html` · `admin.js` · `src/i18n/bg.json` · `src/i18n/en.json` · `public/i18n/bg.json` · `public/i18n/en.json` · `leaderboard.test.js` · `campaign-categories.test.js` · `create-campaign.test.js` · 3 SQL migration files

#### External prerequisite
Register free Stadia Maps account → get API key → add `VITE_STADIA_MAPS_KEY` to `.env` and Netlify environment variables before deploying.

#### Business note
"Чиста Дървеница" brand name becomes a scaling constraint alongside this work. Recommend scheduling a naming decision (e.g. "Чисто BG") before promoting the Bulgaria-wide feature publicly — the domain and app name tell users this is a single-neighborhood tool.

---

### v2.0 — Platform Expansion (6–18 months)

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Multi-city support | ✅ Moved to v1.5 | See detailed plan above. |
| Municipality API integration | P1 | Official data feeds + compliance reporting for district government. |
| **Anonymous illegal dumping map** | P1 | Public layer (no login required): anyone can drop a pin + photo to report illegal dumping. Reports appear on the map as orange markers. Authenticated users can create campaigns targeting these exact locations. This becomes the top-of-funnel: people discover the platform not through word-of-mouth but because they find real problem locations on the map, then register to do something about it. Requires: `dumping_reports` table with `lat`, `lng`, `photo_url`, `status` (reported / campaign_created / resolved), CAPTCHA for anonymous submissions. |
| **School / university community service integration** | P1 | Schools register as verified organizations. Student participants earn points that are simultaneously logged as volunteer hours. Admin generates a signed "Community Service Certificate" PDF (name, date, campaign, hours). Sofia has 50+ high schools with mandatory volunteer hours for graduation — this is a direct institutional channel that bypasses consumer acquisition entirely. Business model: free for students, 200 лв/year per school subscription for the certificate generation feature. |
| **Corporate team cleanup + ESG Impact Report** | P1 | Companies register a team (5–20 employees) and organize or join corporate cleanup campaigns. After completion, platform auto-generates a branded PDF: date, GPS coordinates, photos, participant count, estimated kg waste removed, campaign category. Designed for ESG reporting and social media. Sold as a premium subscription (150–500 лв/year depending on team size). Clean B2B revenue with minimal ops — all underlying data already exists. |
| **Hazardous waste flagging → municipality routing** | P2 | During campaign creation or proof upload, user can flag a location as containing hazardous material (chemical barrels, asbestos, medical waste, batteries). Flagged locations are shown with a warning icon on the map and automatically trigger an email to the relevant district municipality. No self-service cleanup — routes to professional disposal. Creates genuine public safety value absent from any civic app in Bulgaria. Differentiates the platform from amateur cleanup apps. |
| Environmental impact metrics | P2 | Estimated kg waste removed per campaign — measurable ESG reporting. |
| Mobile app shell (Capacitor) | P2 | PWA → App Store distribution for higher retention. |
| **Teams / Groups** | P2 | Persistent named group (e.g. "Darvenitsa Clean Team") with shared leaderboard and group rewards. Adds the missing social layer — currently the platform is entirely individual. Deferred to v2.0 due to DB complexity (group membership, group points aggregation, group rewards). |
| **Volunteer transport coordination** | P2 | Organizer marks "I have 3 seats available from X metro station". Participants request a seat via a toggle on the campaign detail page. Confirmed riders get a push notification when the organizer finalizes the group. One new `transport_offers` table + `transport_requests`. Removes the single biggest attendance barrier for campaigns outside walking distance — without transport, non-driving participants self-select out. |
| **Photo integrity validation (AI)** | P2 | Submitted proof photos are passed to Google Cloud Vision (first 1000 req/month free) or Clarifai free tier for: (a) is this an outdoor scene, (b) does it contain a bag or waste? A low confidence score doesn't auto-reject — it flags the participation for priority human review. Reduces admin review load dramatically as volume scales. Prerequisite before the platform can offer any automated approval flow. |
| **Reward delivery integration (Econt / Speedy)** | P2 | Physical rewards (vouchers, merchandise) require manual delivery coordination today. Integrate Econt or Speedy Bulgarian courier API: when admin marks a reward redemption as "shipped", the platform creates an Econt shipment via API and sends the tracking number to the user as a notification. Closes the reward fulfillment loop — currently there is no way for users to track physical reward delivery. Direct prerequisite for corporate sponsor rewards (branded merchandise). |
| **Sofia open data sync (data.sofia.bg)** | P2 | `data.sofia.bg` publishes an open API of citizen-submitted complaints including illegal dumping locations. A scheduled Supabase Edge Function (weekly cron) fetches new complaint entries, geocodes them, and upserts into the `dumping_reports` table (see Anonymous illegal dumping map, v2.0). Campaign organizers can then create campaigns pre-seeded with verified municipal problem coordinates. Makes the platform an official amplification channel for the municipality's own citizen feedback — strong argument for institutional partnership. |
| **Campaign "Boost" — first paid feature** | P2 | Organizer pays 5 лв to boost their campaign to a pinned slot at the top of the dashboard feed and a highlighted map marker for 48 hours. Payment via Stripe Checkout (3 clicks, no account required). Revenue: if 10% of campaign organizers boost once per campaign at current scale → ~200 лв/month passive. This is the simplest possible paid feature — no subscription, no account management, one-time transaction with immediate visible effect. Stripe integration is a prerequisite for the corporate ESG product (v2.0) — building it here amortizes the setup cost. |
| **Ukrainian / Turkish i18n expansion** | P3 | i18n infrastructure is complete — adding a new language requires only a new JSON file (`public/i18n/uk.json`) and a `<option>` in the language selector. Sofia has a significant Ukrainian diaspora (70k+ since 2022) and a Turkish-speaking community. Both are underserved by Bulgarian civic apps. Community-translated files can be crowdsourced via GitHub — technical cost is zero, acquisition potential is meaningful. |
| **Pollution heatmap (full implementation)** | P2 | The admin panel already has i18n keys for a heatmap: `heatmapTitle`, `heatmapShow`, `heatmapHide`, `heatmapHint` — the feature is translated but the visualization is a stub. Implement using Leaflet.heat (already a dependency via `leaflet.markercluster`): each `campaigns` row with lat/lng becomes a heat point, weighted by approved `participations` count. The darker the area, the more cleanups happened there. Toggle button already exists in admin UI. Exposes platform impact density at a glance — the single most compelling visual for municipality presentations. |
| **Comment editing** | P3 | Users can edit their own comments within a configurable window (e.g. 15 minutes) after posting. The `campaign_detail_comments` table already has soft-delete and `deleted_by` tracking via migration `20260223085453`. Add: `edited_at` timestamp column + `original_body` TEXT for audit log. Frontend: pencil icon appears on own comments within the edit window, inline textarea replaces the comment body. Closes the frustrating UX dead end where a typo requires deleting and re-posting the entire comment. |
| **Admin user activity dashboard** | P2 | `profiles.last_login_at` is tracked in the DB but never surfaced in the admin panel. Build a "User Activity" sub-tab in Admin → Users: sortable table of all users with last_login_at, total participations, total points earned, account created_at. Filterable by "inactive > 30 days" to identify churn candidates for the win-back email flow. Sortable by points for spotting fraudulent point farmers. All data already exists — this is aggregation + display only. Prerequisite for data-driven admin decisions at scale. |
| **Report auto-escalation & user banning** | P2 | The `reports` table has `status` field including `'under_review'` but there is no escalation logic. Add: (a) DB trigger counts `resolved` reports against a user — if a user accumulates 3 confirmed violations, automatically set their `profiles.role` to `'banned'` and create a `system` notification. (b) Admin panel shows "At-risk users" — users with 1–2 confirmed reports flagged in yellow. (c) Banned users see a clear message on login and cannot create campaigns or submit participations. Currently one abusive user can create unlimited campaigns with no consequence until an admin manually removes them. |
| **Offline mode indicator + cache control in settings** | P3 | The service worker implements Cache-First and Network-First strategies — but when the app serves stale data from cache due to connectivity loss, there is no indicator. Add: (a) a "⚠️ Offline — showing cached data" banner when `navigator.onLine` is false or fetch fails, (b) a "Clear App Cache" button in profile settings that calls `caches.delete()` for the app cache name. Small but eliminates the most common support confusion: "the app is showing old data" — which is the cache silently serving stale content. |
| **Session log export for support** | P3 | `src/services/logger.js` collects up to 1000 entries in localStorage (API calls, errors, user actions, performance timings) via `exportLogs()` and `sendLogs(endpoint)` methods — but these are never exposed in any UI. Add a hidden "Export Diagnostics" button in profile settings (shown only when `?debug=1` URL param is present). Generates a JSON download of the session log. When a user reports a bug, they can share this file instead of trying to reproduce the issue. The infrastructure is fully built — only the UI trigger is missing. |
| **Municipal SLA contract (B2G)** | P1 | Highest-value revenue stream. Propose a Service Level Agreement to individual Sofia district councils (Darvenitsa, Studentski Grad, Musagenitsa): platform delivers monthly cleanup compliance reports for their district, routes hazardous waste flags to their environmental department, mobilizes volunteers for municipality-flagged dumping sites, and provides verified attendance data for official monitoring. Price: 20,000–40,000 лв/year per district. Start with a **free 3-month pilot** in one district, then convert to paid contract. 5 district contracts = 150,000–200,000 лв ARR. This is a public procurement contract — slow to close but multi-year and extremely sticky. Prerequisite: Sofia open data sync (data.sofia.bg) and hazardous waste flagging features. |
| **"Clean City Index" — annual publishable report** | P1 | The platform accumulates unique data no one else in Bulgaria has: verified, timestamped, geotagged before/after photo evidence of public space transformation at neighborhood level. Package this as an annual "Sofia Neighborhood Cleanliness Report": rankings by cleanup frequency, volunteer density, waste removed, year-over-year trends. Published as: (a) interactive online dashboard, (b) PDF download, (c) press release. Revenue: exclusive 48h media preview — 2,000 лв (bTV, Nova, OFFNews); annual data subscription for real estate companies — 1,000 лв/year (Yavlena, Homes.bg, Адрес); bundled into municipal SLA at no extra charge. Near-zero production cost — all data already in DB. **Creates annual press moment, institutional credibility, and positions platform as Sofia's environmental data authority.** |
| **"Neighborhood Civic Score" widget for real estate** | P1 | Real estate thesis: neighborhoods with active cleanup communities have higher property values and lower perceived crime. If platform can demonstrate this with 2+ years of data, real estate companies will pay for the signal. Product: embeddable widget showing a neighborhood's civic engagement score (cleanup frequency, volunteer density, waste removed trend) displayed on property listing pages. Revenue: 500 лв/month branding embed fee per real estate portal. Alternatively sold as annual data subscription. Prerequisite: 1+ year of historical neighborhood data + statistical methodology. Positions platform as a **civic data provider**, not just a cleanup app. |
| **API access tier** | P2 | Publish a documented, rate-limited read API over platform data: neighborhood cleanup frequency, campaign history, engagement scores, volunteer counts. Free tier: 100 req/day. Starter (50 лв/month): 1,000 req/day, 1-year history. Pro (200 лв/month): unlimited, real-time, batch export. Target buyers: real estate apps, academic researchers (Sofia University urban studies, BAS), city data startups, other civic tech platforms. Prerequisite: GDPR-compliant anonymization (no individual user data in responses). **Converts the platform into a civic data infrastructure provider** — a fundamentally different and scalable business. |
| **Verified Organizer subscription** | P2 | Active organizers pay 50–100 лв/year for: "Verified Organizer" badge on their campaign cards and profile (social proof), priority placement in campaign discovery, access to organizer analytics dashboard ("My Campaigns" — views, RSVP rate, attendance), recurring campaign creation (feature-gated for Pro users), campaign template library (pre-filled descriptions, supply checklists), 1 free "Featured Campaign" slot per month on homepage. At 50 active organizers × 80 лв = 4,000 лв ARR. Small but zero marginal cost — monetizes the most engaged users who generate most of the platform's value. |
| **Gamification-as-a-Service (GaaS) licensing** | P2 | The points + rewards + leaderboard + photo verification + challenge system is a complete, tested civic engagement engine. License it to organizations with similar gamification needs: Bulgarian Red Cross (blood donation drives), Екопак/Елтехресурс (recycling reward programs), urban gardening networks, neighborhood watch programs. Pricing: 2,000–5,000 лв setup + 500–1,000 лв/month SaaS. Requires multi-tenancy isolation (separate `tenant_id` on all tables, separate admin panels). Converts the platform from a single-vertical app into a **horizontal civic engagement SaaS platform**. |
| **"Neighborhood Activation" consulting service** | P3 | Platform offers a packaged service: "We'll activate your community's cleanup culture in 90 days." Includes: dedicated platform instance + admin, onboarding workshop for first organizers, first 5 campaigns facilitated by platform staff, monthly progress reports, guaranteed minimum community metrics. Price: 3,000–5,000 лв per activation. Target: residential developments (large apartment complexes), university campuses, shopping center managements wanting community credentials. **This is a services revenue stream — no new code required, sells the community expertise and platform track record.** |
| Carbon credit tokenization | P3 | Long-term monetization via sustainability markets. |

---

## 🔍 Multi-Role Audit — Mar 24, 2026

Five deep-dive audits conducted simultaneously: Security Engineer, End User Journey, DevOps/SRE, Performance Engineer, Database Administrator. Findings organized by role and priority for future sprint planning.

---

### 🔐 Security Engineer Findings

**CRITICAL / HIGH — fix before next public release**

| Finding | Severity | Location | Attack Scenario |
|---------|----------|----------|-----------------|
| ~~Campaign delete has no `created_by` check in query — relies solely on RLS~~ | ~~CRITICAL~~ | ~~`campaign-detail.js:733`~~ | ✅ Resolved — `.eq("created_by", currentUser.id)` + `count === 0` guard added |
| ~~Campaign edit missing `.eq("created_by", currentUser.id)` in update query~~ | ~~HIGH~~ | ~~`campaign-detail.js:917–931`~~ | ✅ Resolved — `.eq("created_by", currentUser.id)` + `PGRST116` guard added |
| ~~`admin.js` trusts `localStorage.user.role` for admin access check~~ | ~~HIGH~~ | ~~`admin.js:100–116`~~ | ✅ Resolved — `checkAuth()` now throws on access denied (prevents `loadAdminData()` execution); only `demo-*` prefixed IDs use localStorage, real users verified via Supabase |
| ~~Participation approval/rejection exposed as global window functions~~ | ~~HIGH~~ | ~~`admin.js:~788`~~ | ✅ Resolved — `window.handleApprove`, `window.handleReject`, `window.showPhotoModal`, `window.handleResolveReport` removed; event delegation used throughout |
| Demo mode always creates user with `role: "admin"` | MEDIUM | `demoMode.js:77–87` | Demo admin executes real admin functions if auth checks are client-only |
| CSP includes `'unsafe-inline'` for both script-src and style-src | MEDIUM | `netlify.toml:82` | Any DOM XSS can inject inline scripts; CSP provides no protection |
| No SRI hashes on CDN scripts (SweetAlert2, Bootstrap, Leaflet) | LOW | All HTML pages | CDN compromise injects malicious code into all users |
| Campaign coordinate validation missing — can submit lat/lng outside Bulgaria | MEDIUM | `create-campaign.js:338–350` | Garbage data on map, potential abuse of storage |
| Session TTL only checked when `getCurrentUser()` called — gaps between checks | MEDIUM | `helpers.js:62–67` | Stale session can persist beyond 8h window |

**POSITIVE:** `escapeHTML()` is correct, Supabase anon key (not service role) used throughout, security headers configured, file upload type/size validated, SECURITY DEFINER functions use `SET search_path = ''`.

---

### 👤 End User Journey Findings

Six complete journeys walked: Registration, Campaign Discovery, Proof Upload, Reward Redemption, Campaign Creation, Mobile UX.

**HIGH friction — causes real drop-off**

| Journey | Drop-off Point | Root Cause |
|---------|----------------|-----------|
| Registration → Dashboard | No onboarding after login | User sees full dashboard with no "what now?" guidance |
| Registration | No username field at signup | User gets UUID as display name; must edit profile separately |
| Post-RSVP | No reminder that proof upload is needed after attending | User attends cleanup but forgets to return to app |
| Post-upload | No persistent "under review" status indicator | User doesn't know if submission worked; may resubmit |
| Campaign creation | Created campaign vanishes after "awaiting approval" toast | No "My Campaigns" section; user thinks creation failed |
| Campaign creation | Translated English title not previewed | User can't verify their campaign looks correct in EN |

**MEDIUM friction**

| Issue | Page |
|-------|------|
| Points balance not visible on dashboard — must navigate to Profile | Dashboard |
| No address/geocoding search when placing campaign on map | Create Campaign |
| Map click imprecise on mobile — hard to set exact location | Create Campaign |
| "Attending" (RSVP) vs "Joining" (participation) — two separate actions confuse new users | Campaign Detail |
| After approval, no celebration / push to Rewards page | Profile |

**WHAT WORKS WELL:** Campaign cards show enough info to decide (time, location, category, participant count), RSVP button is obvious, file upload communicates accepted types and size, demo mode covers the full journey, language switching accessible at all times.

---

### ⚙️ DevOps / SRE Findings

**CRITICAL — production blind spots**

| Finding | Severity | File | Fix |
|---------|----------|------|-----|
| No external error reporting — production errors invisible | CRITICAL | `errorHandler.js:260` | Integrate Sentry (free tier) |
| SW scope not explicitly set to `"/"` — may not control all pages | CRITICAL | `pwa.js:17` | Add `{ scope: "/" }` to `register()` call |
| SW cache name `'clean-quarter-v2'` hardcoded — must be bumped manually on every deploy | HIGH | `service-worker.js:6` | Auto-generate from build timestamp |
| No branch protection on `main` — force-push bypasses all CI checks | HIGH | GitHub settings | Enable required reviews + status checks |
| No staging environment before production | HIGH | Netlify config | Create `staging` branch + Netlify deploy context |
| No fallback when Supabase is down — users see blank page | HIGH | `supabase.js` | Circuit breaker + show cached data with warning banner |
| Offline fallback is plain text `503` response | MEDIUM | `service-worker.js:108` | Create `/offline.html` and serve it from cache |
| HTML pages have no explicit `Cache-Control: no-cache` header | MEDIUM | `netlify.toml` | Add `Cache-Control: no-cache` for `/*.html` |
| Vite build has no `manualChunks` — Leaflet + Supabase bundled separately per page | MEDIUM | `vite.config.js:50` | Add `manualChunks: { vendor: ['leaflet','@supabase/supabase-js'] }` |
| `console.log` / `console.error` not stripped in production build | MEDIUM | Multiple files | Add `drop_console: true` to esbuild/terser config |
| Lighthouse CI configured but not in CI pipeline | MEDIUM | `.github/workflows/ci.yml` | Add `npm run lhci` step after build |
| HSTS `preload` directive in header but domain not submitted to preload list | LOW | `netlify.toml:81` | Submit to hstspreload.org |

**POSITIVE:** Supabase anon key correctly managed via env vars, security headers (X-Frame-Options, HSTS, X-Content-Type-Options) all configured, asset caching with `immutable` flag correct for hashed filenames, exponential backoff retry logic exists in `api/client.js`.

---

### ⚡ Performance Engineer Findings

**Core Web Vitals risk: LCP ~2.5–3.5s on Slow 3G (target: <2.5s)**

**CRITICAL — immediate LCP impact**

| Finding | Severity | File | Impact |
|---------|----------|------|--------|
| SweetAlert2 loaded synchronously in `<head>` — blocks DOM parsing | CRITICAL | All HTML pages | +200–400ms FCP |
| Dashboard leaderboard queries start after campaigns load, not in parallel | CRITICAL | `dashboard.js:106–107` | +500–700ms LCP |
| No shared vendor chunk — Leaflet (149KB) + Supabase (70KB) bundled per page | CRITICAL | `vite.config.js` | +230KB wasted on 2nd page load |

**HIGH — significant at scale**

| Finding | Severity | Fix |
|---------|----------|-----|
| Bootstrap CSS CDN in `<head>` — render-blocking | HIGH | Inline critical CSS or use `rel="preload"` |
| `select("*")` in `campaign-detail.js:205`, `profile.js:243,355`, `rewards.js:117` | HIGH | Select only needed columns |
| No client-side caching — leaderboards reload on every dashboard visit | HIGH | sessionStorage with 5-min TTL |
| Before/after photo on campaign-detail not lazy-loaded | HIGH | Add `loading="lazy"` to slider images |
| Images served at original resolution (3–8MB phone photos) — no Supabase transforms | HIGH | Use `?width=300&height=200&quality=80` transform params |
| CLS from map/card heights not pre-allocated | HIGH | Add fixed `height: 400px` to `#map`, `aspect-ratio` to cards |

**Quick wins (< 30 min):**
1. Move `<script src="sweetalert2">` to end of `<body>` with `async`
2. Wrap `loadLeaderboard()` + `loadUserLeaderboard()` in `Promise.all()`
3. Add `loading="lazy"` to all `<img>` tags in JS-rendered cards
4. Replace `select("*")` with specific column lists in 3 files

---

### 🗄️ Database Administrator Findings

**Schema & Integrity — CRITICAL**

| Finding | Severity | Migration / File | Fix |
|---------|----------|-----------------|-----|
| `comments.campaign_id` stored as TEXT with no FK to `campaigns(id)` | CRITICAL | `20260208124114` | Add FK with `ON DELETE CASCADE` |
| `comments.user_id` stored as TEXT with no FK to `profiles(id)` | CRITICAL | `20260206145735:124` | Add FK with `ON DELETE CASCADE` |
| `participations` SELECT RLS policy uses `USING (true)` — all users see all participations including rejection reasons | CRITICAL | `20260207050230:212` | Restrict to `user_id = auth.uid()` OR admin role |
| `reports` SELECT may have legacy permissive policy — all users can list all reports | CRITICAL | `20260207050230:236` | Audit + remove legacy policy |
| `get_public_stats()` queries `type = 'award'` — enum value does not exist (should be `'earned'`) — stats always return 0 | HIGH | `20260321052409:114` | Change to `type = 'earned'` |
| User hard-delete cascades to participations + point_transactions — permanent history loss | HIGH | `20260206145735:10` | Implement soft-delete on profiles |
| Campaign hard-delete cascades to participations — points awarded for now-deleted event remain | HIGH | `campaign-detail.js:733` | Soft-delete only; trigger to soft-delete participations |

**Query Patterns — HIGH**

| Finding | Severity | File | Fix |
|---------|----------|------|-----|
| Admin panel fetches ALL participations with no `.limit()` — memory explosion at scale | HIGH | `admin.js:193–213` | Server-side pagination: `.range(page*50, page*50+49)` |
| Comments query has no `.limit()` — popular campaign with 1000+ comments loads all | HIGH | `campaign-detail.js:978` | Add `.limit(100)` |
| `getRsvpCountsForCampaigns()` fetches all RSVP rows and counts in JS — should use SQL `GROUP BY` | MEDIUM | `services/events.js` | Replace with RPC: `SELECT campaign_id, COUNT(*) GROUP BY campaign_id` |

**Missing Indexes**

| Table | Missing Index | Query Pattern |
|-------|--------------|---------------|
| `campaigns` | `(status, scheduled_date)` composite | Dashboard filter + sort |
| `participations` | `created_at DESC` | Admin panel sort |
| `point_transactions` | `(type, created_at DESC)` composite | Role change log |
| `login_attempts` | `(user_email, created_at DESC)` | Rate limit check |

**Cascade / Orphan Risks**

| Finding | Table | Fix |
|---------|-------|-----|
| Notifications reference campaign_id/participation_id with no `ON DELETE` specified | `notifications` | Add `ON DELETE CASCADE` or `SET NULL` |
| Soft-deleted records never purged — table bloat over time | Multiple tables | Scheduled cron to hard-delete after 90 days |

**POSITIVE:** All critical enum fields have CHECK constraints, FK indexes added in `20260321052659`, SECURITY DEFINER functions all use `SET search_path = ''`, Supabase anon key only (no service role exposure), rate limiting enforced server-side via RPC.

---

### 📋 Cross-Role Priority Matrix

| Priority | Finding | Role | Effort |
|----------|---------|------|--------|
| 🔴 P0 | RLS `participations` USING(true) — privacy violation | DB | Small (SQL) |
| 🔴 P0 | `get_public_stats()` always returns 0 points | DB | Tiny (1 word fix) |
| 🔴 P0 | No external error reporting — blind in production | DevOps | Medium |
| ~~🔴 P0~~ | ~~Campaign delete/edit missing creator check in query~~ | ~~Security~~ | ✅ Resolved |
| ~~🔴 P0~~ | ~~`localStorage` admin role trust in `admin.js`~~ | ~~Security~~ | ✅ Resolved |
| 🟠 P1 | SweetAlert2 render-blocking in `<head>` | Perf | Tiny |
| 🟠 P1 | Dashboard leaderboard not parallelized | Perf | Small |
| 🟠 P1 | Admin panel unbounded participations query | DB | Small |
| 🟠 P1 | SW cache version not tied to deployments | DevOps | Small |
| 🟠 P1 | No onboarding for new users | UX | Medium |
| 🟠 P1 | No "My Campaigns" / pending campaign tracking | UX | Medium |
| 🟡 P2 | `comments` FK constraints missing | DB | Small (migration) |
| 🟡 P2 | Missing composite indexes | DB | Small (migration) |
| 🟡 P2 | Image transform via Supabase CDN | Perf | Small |
| 🟡 P2 | No staging environment | DevOps | Medium |
| 🟡 P2 | Proof upload status not visible after submit | UX | Small |
| 🟡 P2 | User soft-delete (no history loss on deletion) | DB | Large |
| 🟢 P3 | No address search in campaign creation | UX | Medium |
| 🟢 P3 | `select("*")` → specific columns | Perf | Small |
| 🟢 P3 | RSVP count JS aggregation → SQL GROUP BY RPC | DB | Small |
| 🟢 P3 | No SRI hashes on CDN scripts | Security | Small |

---

## 🐛 Bug Backlog

Active bugs confirmed by code review. Not yet scheduled for a sprint.

| Bug | Severity | Location | Notes |
|-----|----------|----------|-------|
| ~~`fetchNotifications` swallows errors silently~~ | ~~Fixed~~ | `src/services/notifications.js:20` | Fixed 2026-03-22 — added `{ data, error }` destructuring + `if (error) throw error`. |
| ~~`createCampaign` stub in production service file~~ | ~~Fixed~~ | `src/services/supabase.js:63` | Fixed 2026-03-22 — deleted dead stub entirely. Confirmed by grep: no page script imported it. |
| ~~`store.set()` corrupts non-primitive state~~ | ~~Fixed~~ | `src/state/store.js:17` | Fixed 2026-03-22 — `localStorage.setItem(key, JSON.stringify(value))`. |
| ~~`onerror` inline handler in template literal~~ | ~~Fixed~~ | `src/scripts/dashboard.js:171` | Fixed 2026-03-22 — replaced `outerHTML` mutation with `insertAdjacentHTML` after hiding the broken img. |
| ~~Notification click navigated to wrong route~~ | ~~Fixed~~ | `src/services/notifications.js:220` | Fixed 2026-03-22 — `/campaign-detail?id=X` → `/campaign/${id}`. Regression test added. |
| ~~Leaflet loaded from unpkg.com (not in CSP)~~ | ~~Fixed~~ | `src/pages/admin.html:18-20` | Fixed 2026-03-22 — moved to `cdn.jsdelivr.net` (already in CSP). Regression test added in `deploy-config.test.js`. |
| ~~Notification channel never unsubscribed~~ | ~~Fixed~~ | `src/services/notifications.js:261` | Fixed 2026-03-19 — `window.addEventListener("beforeunload", () => channel.unsubscribe(), { once: true })` implemented correctly. |
| ~~`showSubmissionStatus` hardcoded EN strings~~ | ~~Fixed~~ | `src/scripts/campaign-detail.js:649-657` | Fixed 2026-03-22 — replaced 3 hardcoded EN strings with `t("campaign.joined")`, `t("campaign.proofSubmitted")`, `t("campaign.proofApproved")`. Added `proofApproved` key to all 4 i18n files. |
| ~~`handleDelete` Swal hardcoded EN~~ | ~~Fixed~~ | `src/scripts/campaign-detail.js:671-679` | Fixed 2026-03-22 — replaced 4 hardcoded strings with `t()`. Added `deleteTitle/Text/Confirm/Cancel` to all 4 i18n files. |
| ~~`localStorage.getItem` in `.map()` loop~~ | ~~Fixed~~ | `src/scripts/campaign-detail.js:1005` | Fixed 2026-03-22 — hoisted `commentLang` and `commentLocale` above `.map()`. |
| ~~Rewards/campaign-detail Swal dialogs hardcoded EN~~ | ~~Fixed~~ | `src/scripts/rewards.js`, `src/scripts/campaign-detail.js` | Fixed 2026-03-22 — 7 inline localStorage ternaries + 3 Swal strings replaced with `t()`. 12 new rewards keys + 3 new campaign keys added to all 4 i18n files. |
| ~~`handleApprove`/`handleReject`/`makeAdmin`/`removeAdmin` XSS via inline onclick~~ | ~~Fixed~~ | `src/scripts/admin.js:452,465,734,737` | Fixed 2026-03-22 — username passed unescaped in `onclick=` attribute. Replaced with `data-*` + `escapeHTML()` + `addEventListener`. Regression tests added. |
| ~~`create-campaign.js` catch Swal hardcoded EN/BG ternary~~ | ~~Fixed~~ | `src/scripts/create-campaign.js:473` | Fixed 2026-03-22 — inline localStorage ternary → `t("createCampaign.createError")`. Added key to all 4 i18n files. |
| **`profile.js` transaction table fully hardcoded in BG** | High | `src/scripts/profile.js:332–383` | EN users see Bulgarian text throughout: empty state `"Все още няма транзакции"`, table headers `"Дата"/"Тип"/"Количество"/"Причина"`, and transaction badges `"✓ Спечелени"`/`"✗ Изразходвани"`. None pass through `t()`. Affects all EN-language users on the Profile page. |
| **`profile.js` `displayRank()` uses inline ternaries instead of `t()`** | Medium | `src/scripts/profile.js:286–307` | Rank names (`"Bronze"`/`"Бронз"`, `"Silver"`/`"Сребро"`, `"Gold"`/`"Злато"`) and points label (`"points"`/`"точки"`) use `lang === "en" ? ... : ...` pattern. Same pattern fixed in `rewards.js` and `campaign-detail.js`. |
| **`profile.js` `localStorage.getItem` inside `.forEach()` loop** | Medium | `src/scripts/profile.js:357` | `localStorage.getItem("CLEAN_QUARTER_LANGUAGE")` called on every transaction iteration. Same pattern fixed in `campaign-detail.js:1005`. Hoist above the loop. |
| **`csvExport.js` campaign title may export raw JSON** | Medium | `src/services/csvExport.js:81` | `r.campaigns?.title ?? ""` — campaign titles are stored as bilingual JSON objects `{"bg":"...","en":"..."}`. Admin CSV export may contain `{"bg":"Почистване","en":"Cleanup"}` as cell value. Needs language-aware extraction before export. |
| **`create-campaign.js` `checkFormCompletion()` uses inline ternaries** | Low | `src/scripts/create-campaign.js:230–246` | 7 field label strings and 2 tooltip strings use `isBg ? "..." : "..."` pattern instead of `t()`. Not blocking but inconsistent with rest of codebase pattern. |
| **`dashboard.js` inline ternary fallback in counter text** | Low | `src/scripts/dashboard.js:252–255` | `t("dashboard.showingOf")?.replace(...) \|\| (localStorage.getItem(...) === "bg" ? ... : ...)` — the key exists in i18n so the fallback is never reached, but the pattern is wrong and masks any future key deletion. |
| **`stats.js` local `escapeHTML()` missing `'` escape** | Low | `src/scripts/stats.js:93–99` | Local duplicate of `escapeHTML` (doesn't import from helpers.js) omits `'` → `&#039;` replacement. The main `helpers.js` escapes all 5 HTML special chars. Stats data comes from DB (controlled), so XSS risk is low, but the inconsistency is a maintenance hazard. |
| **`dashboard.js` leaderboard renders raw DB neighborhood names** | Medium | `src/scripts/dashboard.js:484` | `loadLeaderboard()` calls `t(i18nKey)` without the `neighborhoods.` prefix, so `t("darvenitsa")` always returns `undefined` and falls back to the raw DB string (e.g. `"Darvenitsa"` instead of `"Дървеница"` / `"Darvenitsa"`). The `localizeNeighborhood()` helper at line 135 correctly uses `t(\`neighborhoods.${i18nKey}\`)` — the leaderboard diverged. |
| **`dashboard.js` multiple hardcoded BG/EN strings** | Medium | `src/scripts/dashboard.js:105,173,180,375,411,424` | (1) Init catch block: `'Грешка при зареждане. Опресни страницата.'` — hardcoded BG. (2) Fallback card image: `'Няма снимка'` in two places (lines 173, 191). (3) RSVP count: `rsvpCount === 1 ? "1 person planning..." : "${rsvpCount} планират..."` — inline BG/EN ternary. (4) `loadCampaignsPage` catch: `'Грешка при зареждане на кампаниите...'` — hardcoded BG. (5) `updateSectionTitle()`: `lang === "en" ? "Cleanups in" : "Почистване в"`. (6) `showAllCampaigns()`: `"Cleanups near you"` / `"Почистване в близост до вас"` — none use `t()`. |
| **`src/main.js` login/register dialogs hardcoded BG/EN** | Medium | `src/main.js:124,143,151,161,181` | `handleLogin()`: `title: "Login Error"` hardcoded EN. `handleRegister()`: `"Грешка"/"Всички полета са задължителни!"`, `"Паролите не съвпадат!"`, `"Слаба парола"`, `"Регистрацията неуспешна"` — all hardcoded BG, none use `t()`. EN users see Bulgarian validation errors on the registration page. |
| **`auth-helpers.js` `handleForgotPassword()` fully hardcoded BG** | Medium | `src/scripts/auth-helpers.js:9–53` | Every string in the forgot-password dialog uses hardcoded Bulgarian: title `"Забравена парола"`, body `"Въведи своя имейл..."`, buttons `"Изпрати линк"/"Отмяна"`, error/success messages `"Грешка"/"Имейлът е изпратен"`. Function called from the index page which has the language selector — EN users see Bulgarian. |
| **`auth.js` 4 functions with inline localStorage ternaries** | High | `src/services/auth.js:68,96,126,149` | `register()`, `login()` (×2), and `logout()` all call `localStorage.getItem("CLEAN_QUARTER_LANGUAGE")` inline inside Swal dialogs instead of using `t()`. Same pattern already fixed in `rewards.js`, `create-campaign.js`, and `campaign-detail.js`. Affects success/error messages for the entire auth flow. |
| **`auth-validation.js` 2 Swal dialogs hardcoded BG** | Medium | `src/scripts/auth-validation.js:44–62` | `acceptTerms` and `acceptRisk` validation Swals use `title: "Грешка"` + hardcoded BG text strings instead of `t()`. Registration terms validation runs on the index page — EN users see Bulgarian error dialogs. |
| **`profile.js` `handlePasswordRecovery()` fully hardcoded BG** | High | `src/scripts/profile.js:46–92` | All Swal strings hardcoded BG: `"Линкът е изтекъл"`, `"Нова парола"`, `"Запази паролата"`, `"Паролата е сменена"`. Profile page supports both languages — EN users see Bulgarian throughout the password recovery flow. |
| **`profile.js` `handleSaveProfile()` / `loadProfileData()` hardcoded strings** | Medium | `src/scripts/profile.js:274,580–584` | `loadProfileData()`: `"Failed to load profile. Please try again."` hardcoded EN. `handleSaveProfile()`: `title: "Грешка"`, `text: "Потребителското име е задължително!"` hardcoded BG. Neighborhood display: `"Not set"` hardcoded EN. |
| **`profile.js` `loadParticipations()` / `renderParticipations()` fully hardcoded BG** | High | `src/scripts/profile.js:394–505` | Empty state `"Все още не си се присъединил..."` (×2), error state `"Грешка при зареждане..."` (×2), status badges `"📝 Присъединил се"/"⏳ Изчакване"/"✅ Одобрен"/"❌ Отхвърлен"`, labels `"Непозната кампания"/"Квартал:"/"Дата:"/"Статус:"/"Неизвестен"` — all hardcoded BG, none pass through `t()`. The participations tab is the most-used section of the profile page. |
| **`profile.js` `renderParticipations()` hardcodes `"bg-BG"` locale** | Medium | `src/scripts/profile.js:474` | `toLocaleDateString("bg-BG", ...)` — locale is hardcoded regardless of current language. EN users see Bulgarian-formatted dates (e.g. `"15 яну 2026"` instead of `"Jan 15, 2026"`). Should use `lang === "bg" ? "bg-BG" : "en-US"`. |
| **`profile.js` saving Swal and success toast hardcoded BG** | Low | `src/scripts/profile.js:598–605, 665` | `handleSaveProfile()` loading Swal: `"Запазване..."/"Моля изчакайте"` hardcoded BG. `showSuccessToast("Профилът е обновен успешно!")` hardcoded BG. Should use `t("profile.saving")` / `t("profile.savedSuccess")`. |
| **`rewards.js` post-purchase success toast hardcoded EN** | Medium | `src/scripts/rewards.js:333` | `showSuccessToast(\`${rewardTitle} purchased! Balance: ${newPointsBalance} ⭐\`)` — hardcoded English. BG users see English confirmation. Should use `t("rewards.purchaseSuccess")` with `{{title}}` and `{{balance}}` interpolation. |
| ~~**`map.js` XSS via unescaped content in Leaflet popup HTML**~~ | ~~High~~ | ~~`src/services/map.js:100–104, 176–179`~~ | ✅ Resolved — `escapeHTML()` applied on `title`, `status`, `name`, `description`, `id` in both `loadCampaignMarkers()` and `loadDisposalPointMarkers()` |
| **`notifications.js` potential XSS in `renderNotifications()`** | Medium | `src/services/notifications.js:155` | `<p class="notification-msg">${msg}</p>` — `msg` is either an i18n string (safe) or a legacy plain-text DB message returned verbatim. DB triggers that wrote messages pre-pipeline included usernames directly: `'Участието ти беше одобрено от ' \|\| username`. If a username contains HTML, it renders unescaped. `msg` should be wrapped in `escapeHTML()` before innerHTML insertion. |
| **`auth.js` + `main.js` double error dialog on login/register/logout** | High | `src/services/auth.js:77,134,156` + `src/main.js:123–129,180–185` | `auth.js` calls `showError(...)` then `throw error`. The callers in `main.js` catch the re-thrown error and call `Swal.fire()` again. Result: **two sequential error popups** on every login failure, registration failure, and logout error. The `auth.js` service layer must not call Swal — it should throw and let the caller handle the UI. Same root cause as `storage.js` double dialog below. |
| **`storage.js` double error dialog on photo upload** | Medium | `src/services/storage.js:38,57,88` | `uploadCampaignPhoto()` and `uploadAvatar()` call `handleError()` (which shows a Swal) then `throw error`. `campaign-detail.js` and `profile.js` callers catch the re-thrown error and show a second Swal. Two error popups on every failed upload. Service layer must not show UI — throw only. |
| **`pwa.js` registers wrong service worker path** | High | `src/services/pwa.js:17` | `navigator.serviceWorker.register("/public/service-worker.js")` — the `/public/` prefix does not exist in production. Vite copies `public/` contents to `dist/` root, so the SW is at `/service-worker.js`. This registration silently 404s, meaning the PWA service worker is **never actually registered** via `pwa.js`. |
| **`auth-validation.js` conflicting duplicate SW registration** | Medium | `src/scripts/auth-validation.js:85–96` | Service Worker registration is done as a side-effect in the auth-validation script (correct path `/service-worker.js`). `pwa.js` also attempts registration (wrong path). Two modules both register a SW independently — one succeeds, one silently fails. SW registration belongs in one place (`pwa.js` or `main.js`), not in a validation script. |
| **`initializePWA()` is never called** | Medium | `src/services/pwa.js:13` | `pwa.js` exports `initializePWA()` but no page script imports or calls it. The install prompt, appinstalled event listener, and notification permission request are all dead code. The entire PWA service layer has no consumers. |
| **`setupGlobalErrorHandling()` is never called** | Medium | `src/services/errorHandler.js:260` | `setupGlobalErrorHandling()` registers `unhandledrejection` and `error` event listeners. It is exported but never imported or called. Unhandled promise rejections are silently swallowed in production with no logging. |
| **Neighborhood string mismatch — `"Vitosha (VEC)"` vs `"Kv. Vitosha (VEC)"`** | Medium | `src/scripts/dashboard.js:115` vs `src/utils/campaign-filters.js:9` | `dashboard.js` `NEIGHBORHOOD_I18N` maps key `"Vitosha (VEC)"`. `campaign-filters.js`, `neighborhood-stats.js`, and `profile-validator.js` use `"Kv. Vitosha (VEC)"`. These are different strings — the lookup in `localizeNeighborhood()` and `loadLeaderboard()` silently fails for this neighborhood. Whichever string the DB stores, one set of files will never match it. |
| **`profile.js` line 699 — `addEventListener` without null guard** | Low | `src/scripts/profile.js:699` | `document.getElementById("editProfileForm").addEventListener("submit", handleSaveProfile)` — called at module scope (outside `DOMContentLoaded`). If `#editProfileForm` is missing from the DOM, this throws a `TypeError` that breaks the entire script. Should be `?.addEventListener(...)`. |
| **`campaign-detail.js` comment post/delete hardcoded EN** | Medium | `src/scripts/campaign-detail.js:1121,1148` | `"Comment posted."` and `"Comment deleted."` are hardcoded English strings shown as toast messages. Keys `campaign.commentPosted` and `campaign.commentDeleted` are missing from all 4 i18n files. BG users see English confirmation on every comment action. |
| **`campaign-detail.js` null crash on `campaign.creator` after edit** | High | `src/scripts/campaign-detail.js:899,936` | After saving campaign edits, code merges: `campaign = { ...updatedCampaign, creator: campaign.creator }`. If `campaign.creator` is null (deleted user), accessing `campaign.creator.username` on line ~1408 throws `TypeError: Cannot read properties of null`. No null guard exists. |
| **`rewards.js` RPC result accessed before null check** | Medium | `src/scripts/rewards.js:317–326` | After `purchase_reward` RPC, code checks `if (rpcError)` then immediately reads `result.success` — but if RPC returns `null` data with no error, `result.success` throws. Should guard: `if (!result || !result.success)`. |
| **`rewards.js` demo mode stale balance after purchase** | Medium | `src/scripts/rewards.js:289–333` | In demo mode, `userProfile.points_balance` is updated locally but not re-fetched. After purchase, the displayed balance is computed from the in-memory object. If two reward purchases happen quickly, the second reads the un-updated balance from closure. Balance shown may be wrong until page reload. |
| **`create-campaign.js` success message hardcoded BG** | Medium | `src/scripts/create-campaign.js:409,466` | Both create paths (real + demo) show `"Кампанията е създадена успешно!"` as hardcoded Bulgarian. EN users see Bulgarian confirmation after creating a campaign. Should use `t("createCampaign.successMessage")`. |
| **`create-campaign.js` no debounce on title input → DOM thrash** | Medium | `src/scripts/create-campaign.js:173–177` | `campaignTitleBg` "input" listener fires `checkFormCompletion()` on every keystroke. `checkFormCompletion()` re-renders the full validation checklist (lines 227–273) on each keypress — up to 10 DOM updates per word typed. No debounce applied. Janky on slow devices. |
| **`rewards.js` out-of-stock button missing `aria-disabled`** | Low | `src/scripts/rewards.js:169–177` | When `quantity_available === 0`, button gets `disabled` attribute but not `aria-disabled="true"`. Screen readers may not announce the disabled state correctly. One attribute addition. |
| **`campaign-detail.js` Leaflet map popup hardcoded BG** | Low | `src/scripts/campaign-detail.js:127` | `"📍 Избрана локация"` is hardcoded Bulgarian in the Leaflet location picker popup. EN users see Bulgarian label when selecting a campaign location on the map. Key `createCampaign.selectedLocation` missing from all 4 i18n files. |
| **Dead imports in `campaign-detail.js`** | Low | `src/scripts/campaign-detail.js:5,10` | `compressImage` imported from `storage.js` but never called (compression not wired to the after-photo upload). `showInfoToast` imported from `helpers.js` but never used in the file. Both bloat the bundle and mislead future developers. |
| **Leaderboard user tab has no pagination — top 20 only** | Low | `src/scripts/dashboard.js:648–651` | User leaderboard query uses `.limit(20)` with no "Load More". Users ranked 21+ are invisible with no indication more exist. Neighbourhood leaderboard has the same cap. Should add "Show more" or at least a "Showing top 20" label. |
| **`campaign-detail.js` `renderComments()` — username and message unescaped in innerHTML** | High | `src/scripts/campaign-detail.js` (renderComments) | Comment author username and message body are interpolated directly into `innerHTML` without `escapeHTML()`. Comments are user-generated content stored in the DB. A username or message containing `<img onerror="...">` or `<script>` executes in the browser — **Stored XSS**. Both values must be wrapped in `escapeHTML()` before innerHTML insertion. |
| **`public/service-worker.js` — `caches.open()` not awaited in Network First handler** | Medium | `public/service-worker.js:79–96` | The Network First fetch handler calls `caches.open(CACHE_NAME)` without `await`. The promise is not settled before the handler continues — cache writes and reads may operate on an unresolved cache handle, creating a race condition. Pages may serve stale or empty cache responses inconsistently. The call must be `await caches.open(CACHE_NAME)`. |
| **HTML pages — inline `onclick` handlers bypass CSP and XSS mitigations** | Medium | `src/pages/dashboard.html`, `src/pages/campaign-detail.html` | `dashboard.html` contains `onclick="showAllCampaigns()"` and `onclick="filterByCategory(this)"`. `campaign-detail.html` contains `onclick="handleLogout()"` and `onclick="handleRsvp()"`. Inline event handlers require `'unsafe-inline'` in CSP `script-src`, weakening XSS protection. The codebase already uses `data-*` + `addEventListener` for admin.js and dashboard.js — this pattern must be applied consistently to all HTML pages. |
| **HTML pages — hardcoded text labels missing `data-i18n` attribute** | Low | Multiple HTML pages | Several visible text labels across HTML pages are hardcoded in Bulgarian and have no `data-i18n` attribute for the i18n engine to translate them on language switch. EN users see untranslated static labels on page load before JS runs. Audit all HTML pages for hardcoded visible strings not covered by `data-i18n`. |
| **HTML pages — empty or missing `alt` attributes on non-decorative images** | Low | Multiple HTML pages | Several `<img>` elements across HTML pages have empty `alt=""` or no `alt` attribute while displaying meaningful content. This fails WCAG 2.1 SC 1.1.1 and causes screen reader users to hear nothing for informational images. Non-decorative images require descriptive alt text. |
| **`helpers.js` `handleError()` uses hardcoded `"Error"` as Swal title** | Low | `src/utils/helpers.js:467` | `handleError()` shows `Swal.fire({ title: "Error", ... })` with a hardcoded English title regardless of the user's language setting. BG users see "Error" instead of "Грешка". Title should use `t("common.error")` which already exists in both i18n files. |
| **`helpers.js` `formatDate()` hardcodes `"en-US"` locale** | Low | `src/utils/helpers.js:304` | `new Date(dateStr).toLocaleDateString("en-US", ...)` — locale is hardcoded to English regardless of current language. BG users see English-formatted dates (e.g. `"March 15, 2026"` instead of `"15 март 2026"`). Should read current language and pass `"bg-BG"` or `"en-US"` accordingly. |
| **`admin.js` `loadReports()` — entire reports section uses inline ternaries instead of `t()`** | High | `src/scripts/admin.js:1082,1098,1114–1153,1188–1192` | The `loadReports()` function never uses `t()` — every visible string is a `lang === "en" ? ... : ...` ternary: empty state text (×2), reason labels (`spam`/`inappropriate`/`harassment`/`fake`/`other`), table headers (`Date`, `Reported by`, `Reason`, `Description`, `Actions`), button labels (`Resolve`, `Dismiss`), success toasts (`Report resolved.`, `Report dismissed.`). This is the same pattern already fixed in `rewards.js`, `create-campaign.js`, `campaign-detail.js`. The reports tab is the most-used admin workflow. Affects all EN admins. |
| **`admin.js:1130,1135` — inline `onclick` handlers in generated reports HTML** | Medium | `src/scripts/admin.js:1130,1135` | `renderReports()` builds button HTML with `onclick="handleResolveReport('${r.id}', 'resolved')"` and `onclick="handleResolveReport('${r.id}', 'dismissed')"`. The codebase already fixed the same pattern for approve/reject/makeAdmin/removeAdmin buttons in the same file — this function was missed. `handleResolveReport` is exposed as `window.handleResolveReport` (line 1211) for the inline handler. Should use `data-report-id` + `data-action` + `addEventListener` via event delegation. |
| **`campaign-detail.js:1020` — inline `onclick` in comment delete button HTML** | Low | `src/scripts/campaign-detail.js:1020` | `renderComments()` generates `onclick="handleDeleteComment('${escapeHTML(c.id)}')"` inside the template literal. `c.id` is a UUID from the DB so XSS risk is minimal, but it is architecturally inconsistent — the rest of the codebase (admin.js, dashboard.js) uses `data-*` + `addEventListener`. `handleDeleteComment` is exposed as `window.handleDeleteComment` (line 1298) for the inline handler. Migrate to `data-comment-id` + event delegation. |
| **Migration `20260320122510` — 3 SECURITY DEFINER functions missing `SET search_path`** | Medium | `supabase/migrations/20260320122510_public_stats_security_definer_functions.sql` | `get_public_stats()`, `get_public_category_stats()`, `get_public_neighborhood_stats()` are all `SECURITY DEFINER` but none include `SET search_path = public`. The ROADMAP entry "search_path fixed on all SECURITY DEFINER functions" (Mar 21) refers to earlier functions — this migration was added Mar 20 and post-dates the fix. Without a pinned `search_path`, a malicious schema search path could redirect the function to a shadow table. Add `SET search_path = public` to all three functions via a new migration. |

---

## 🔧 Tech Debt Backlog

| Item | Priority | Notes |
|------|----------|-------|
| **Eliminate duplicate i18n source** | P1 | `src/i18n/` and `public/i18n/` are manually-synced duplicates. Every translation change requires 4 files. Remove `src/i18n/`, use only `public/i18n/`. |
| **Adopt or delete `Store`** | P1 | `src/state/store.js` is used by `errorHandler.js`, `api/client.js`, and `hooks/index.js` — but not by any page script. Page scripts read auth/data directly from localStorage/Supabase, bypassing the store entirely. Either wire it into page scripts properly or delete the architecture layer. The split creates two parallel data access patterns. |
| **Consolidate auth pattern** | P1 | Scripts verify auth inconsistently — some check localStorage, some call `supabase.auth.getUser()`, some do both. A security bug in one path leaves others exposed. Needs a single `requireAuth()` that always calls Supabase. |
| Playwright visual baseline creation | P1 | Run `npm run playwright:update` once against staging |
| `npx playwright install chromium` on CI | P1 | Required before Playwright tests can run in GitHub Actions |
| ~~**Parallelize i18n fetch**~~ | ~~Done~~ | ~~`src/utils/i18n.js:22–30`~~ | Already implemented — `Promise.all([fetch(bg), fetch(en)])` confirmed at line 22. Verified 2026-03-22. |
| ~~**`Math.random()` → `crypto.randomUUID()`**~~ | ~~Done~~ | ~~`src/services/storage.js:28`~~ | Already implemented — `crypto.randomUUID()` confirmed at line 28. Verified 2026-03-22. |
| ~~**`setTimeout(300ms)` for `invalidateSize`**~~ | ~~Done~~ | ~~`src/scripts/dashboard.js:82`~~ | Already replaced with `ResizeObserver` (lines 81–85). Verified 2026-03-22. |
| **Normalize campaign title format** | P2 | Titles arrive as either plain strings or JSON objects `{bg, en}` — `dashboard.js` defensively `JSON.parse()`s on every card render. Normalize at DB level: either always JSON object or separate `title_bg`/`title_en` columns. Direct cause of `csvExport.js` bug (raw JSON in CSV). |
| **Replace `location.reload()` on language switch** | P2 | Destroys unsaved user input (form data). Replace with `applyLanguage()` + component re-render. |
| **Delete dead stubs** | P2 | `src/api/client.js:1–4` — `apiFetch` always returns `{ ok: true }`, nothing imports it (confirmed by grep). `src/hooks/index.js:3–5` — `useAuth()` returns `{ user: null, isAuthenticated: false }` always — dangerous stub if ever wired up. `src/hooks/index.js` React-style hooks unused in Vanilla JS codebase. Delete both files or replace with real implementations. |
| `npm run lhci` integration in GitHub Actions | P2 | `lighthouserc.js` configured but not wired to CI pipeline |
| **`events.js` repeated dynamic imports** | P2 | `src/services/events.js` — every exported function does `await import("./supabase.js")` independently (4 separate dynamic imports per page load). Import once at module top level like every other service. No functional impact but adds unnecessary overhead and obscures intent. |
| **Notification pagination** | P3 | `fetchNotifications` has hardcoded `limit(20)`. Active users with many participations silently lose older notifications. Add "load more" or increase limit with cursor-based pagination. |
| **Add `loading="lazy"` to campaign card images** | P3 | All campaign photos load eagerly. With Load More appending 30+ cards, this creates unnecessary network load for off-screen images. |
| **Read `currentLang` once before card render loop** | P3 | `src/scripts/dashboard.js:143` — `localStorage.getItem("CLEAN_QUARTER_LANGUAGE")` called on every card in the loop. Hoist above the `.map()`. |
| **`stats.js` — remove local `escapeHTML` duplicate** | P3 | `src/scripts/stats.js:93–99` defines its own `escapeHTML` that omits `'` escaping. Import from `../utils/helpers.js` instead. |
| **`geolocation.js` uses raw `console.log/error`** | P3 | `src/services/geolocation.js:18,22,26` — 3 direct `console.*` calls instead of the project-wide `logger` service. Inconsistent with every other service file. |
| **`pwa.js` install banner hardcoded EN** | P3 | `src/services/pwa.js:104–131` — `createInstallBanner()` uses hardcoded `"📱 Install App"`, `"Get instant access to Clean Quarter"`, `"✓ Install"`, `"✕ Later"` — EN only. Banner shown to all users regardless of language preference. |
| **`store.js` `notify()` called with wrong signature in `errorHandler.js`** | P2 | `src/services/errorHandler.js:62,68,75,81,88,94,99,106` — strategy callbacks call `store.notify("message", "type")` but `Store.notify()` takes no arguments (it's an internal pub-sub notify). Dead code today since the Store is unused by page scripts, but would silently fail if ever wired up. Should be `store.addNotification(...)`. |
| **`NEIGHBORHOODS` constant duplicated in 3 files with key mismatch** | P2 | `src/utils/campaign-filters.js:5`, `src/utils/neighborhood-stats.js:5`, `src/validators/profile-validator.js:22` — three independent definitions of the same array. `campaign-filters.js` and `neighborhood-stats.js` use `"Kv. Vitosha (VEC)"` while `dashboard.js` uses `"Vitosha (VEC)"`. Single source of truth needed in one shared constants file; dashboard.js NEIGHBORHOOD_I18N must use the same key. |
| **`pwa.js` service is dead — never imported by any page** | P2 | `src/services/pwa.js` — `initializePWA()`, `sendNotification()`, `cacheData()`, `getCachedData()` are all exported but no page script imports this module. The install banner, app-installed event, and notification permission request never fire. Either wire it up or delete it. |
| **`store.js` `notify()` logs every state change at `INFO` level** | P2 | `src/state/store.js:176` — `logger.info("📢 State updated:", this.state)` runs on every `setState()`, `set()`, `addNotification()`, and `clearErrors()` call. Every state change writes a full state snapshot to localStorage logs (via logger). Should be `logger.debug()`. |
| **`languageChanged` custom event dispatched but never consumed** | P3 | `src/utils/i18n.js:156` — `window.dispatchEvent(new CustomEvent("languageChanged", ...))` fires on every language change, but no page script listens for this event. Pages use `location.reload()` instead. Dead code — can be removed or wired up to replace the `location.reload()` hack. |
| **`rewards.js` `window.handleBuy` dead global exposure** | P3 | `src/scripts/rewards.js:360` — `window.handleBuy = handleBuy` is set after refactoring to event delegation. No HTML uses `onclick="handleBuy(...)"` anymore — the function is only called via `addEventListener` at line 214. The global assignment is dead and pollutes the window namespace. |
| **`profile.js` inline password strength bar duplicates `passwordStrength.js`** | P3 | `src/scripts/profile.js:113–132` — manually inlines the strength bar update logic (score calculation + color changes). `src/components/passwordStrength.js` already encapsulates this. The existing `applyPasswordChecklist()` at line 178 correctly reuses helpers.js. The inline bar code should also use the shared component. |
| **`auth-validation.js` SW registration as module side-effect** | P3 | `src/scripts/auth-validation.js:85–96` — Service Worker registration fires automatically when this module is imported, as a side-effect outside any function. SW registration belongs in a deliberate initialization call (`initializePWA()` or `main.js`), not as an implicit side-effect of loading a validation script. |
| **`t()` returns key string when translation missing** | P3 | `src/utils/i18n.js:81` — `return value \|\| key`. When a translation key is absent, `t("missing.key")` returns `"missing.key"` (truthy), so downstream `\|\|` fallbacks are never reached. Missing keys show technical key names to users. A `return value ?? null` pattern would make `\|\|` fallbacks work correctly. |
| `docs/PRODUCT_DOCUMENTATION.md` — update roadmap section | P3 | Section 10 reflects pre-v1.1 state |
| **Duplicate `checkAuth()` in 5 page scripts** | P1 | `src/scripts/dashboard.js`, `src/scripts/campaign-detail.js`, `src/scripts/admin.js`, `src/scripts/profile.js`, `src/scripts/rewards.js` — each defines its own `checkAuth()` function with slightly different logic (some check only localStorage, some call `supabase.auth.getUser()`, some do both). Already tracked under "Consolidate auth pattern" above — but the specific duplication across 5 files means a security fix in one `checkAuth()` will not propagate to the others. Extract to `src/utils/auth.js` as a single `requireAuth()` and import everywhere. |
| **Duplicate DOMContentLoaded language setup boilerplate in 15+ scripts** | P2 | `src/scripts/dashboard.js`, `profile.js`, `rewards.js`, `create-campaign.js`, `campaign-detail.js`, and 10+ others — every page script copy-pastes the same 10-line block: `await initI18n(false)`, `applyLanguage(...)`, `langSel.value = ...`, `langSel.addEventListener("change", ...)`. Any change to i18n init (e.g. adding a new option) requires updating 15 files. Extract to `src/utils/pageInit.js` with a single `initPage()` call. |
| **`storage.integration.test.js` tests only happy path — no error path coverage** | P2 | `tests/storage.integration.test.js` — all mocks return successful responses. There are zero tests for: upload failure (network error, file too large, wrong MIME type), `handleError()` being called on failure, or the double-dialog bug (service calls Swal + re-throws). Error path coverage is critical for storage since it directly affects the campaign proof upload flow. |
| **Missing test coverage for critical user actions** | P2 | `tests/` — no unit or integration tests for: `handleBuy()` in `rewards.js` (purchase flow + demo mode), `handleJoin()` / `handleUploadPhoto()` in `campaign-detail.js`, admin proof approval/rejection flow, `checkAuth()` redirect behavior in any page script. These are the core monetization and participation flows — failures here are the highest-impact regressions. |

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
| **In-app chat** | Discord and WhatsApp group chats serve this need better. Building a real-time chat duplicates solved infrastructure and pulls focus from the core cleanup loop. |
| **AI location recommendations** | Premature at current scale (~50 campaigns). Recommendation quality requires volume of data that doesn't exist yet. Revisit at v2.0 with real usage data. |
| **Marketplace between users** | Point trading between users breaks the reward economy (inflation, abuse) and is outside the civic mission of the platform. |
| **Organizer rating system** | Rating systems in small communities (5 neighborhoods) create toxic dynamics and discourage new organizers. Quality is enforced through admin approval, not peer ratings. |

---

## 📋 Reference

### Database Index Review

**Next review date:** 2026-04-21

See [docs/INDEX_REVIEW.md](docs/INDEX_REVIEW.md) for the SQL query and decision criteria.
