# Clean Quarter — Business Model & Monetization Implementation Plan

**Created:** 2026-03-23 | **Author:** Business Analysis Session
**Purpose:** Central reference for ALL monetization ideas — what they are, how to implement them, what's code vs. what's business development.

---

## How to Read This Document

Each idea is rated on two axes:

- **Implementation Type:** `CODE` (buildable in the codebase), `BD` (requires business development / partnerships / contracts), `OPS` (operational/logistics), or a combination
- **Effort:** `XS` (< 1 day), `S` (1–3 days), `M` (1–2 weeks), `L` (1–2 months), `XL` (3+ months)
- **Time to First Revenue:** how fast from decision to first € received

---

## Tier 1 — Quick Wins: Pure Code, No Partnerships Needed

These can be built entirely within the existing codebase. No contracts, no external companies required. **Start here.**

---

### 1. Green Wallet (Points → NGO Donations)

**What it is:** "Donate my points" button on the rewards page. User selects a verified NGO (WWF Bulgaria, Balkani Wildlife Society) and donates accumulated points. Platform converts at 200 pts = €1, collects donations monthly, transfers to NGO minus 5–8% platform fee.

**Revenue model:** 5–8% fee on total donations processed.
**Revenue estimate:** If 200 users donate avg. 500 pts (= €2.50) = €500 donated → **€25–40/month**. Grows with user base. Small but zero-cost.

| What | Type | Effort |
|------|------|--------|
| `rewards.html` — add "Donate Points" tab | CODE | XS |
| `rewards.js` — donation flow (deduct points, log transaction) | CODE | S |
| Admin panel — NGO management (add/remove verified NGOs) | CODE | S |
| DB: `ngos` table + `point_donations` table | CODE | XS |
| Supabase Edge Function: monthly batch NGO payout report | CODE | S |
| Bank transfer to NGO + 5% fee invoicing | OPS | recurring |

**Total code effort: 3–4 days.** Revenue starts immediately after launch.
**Non-code:** Get 2–3 NGOs to agree (email, free for them — they gain donations). Easy outreach.

---

### 2. Campaign Pledge Drive

**What it is:** Organizer sets a pledge threshold on their campaign: "If 30 people RSVP, Kaufland donates €250 in rewards." Campaign card shows live progress bar. When threshold is hit, platform notifies the sponsor and holds them to the pledge.

**Revenue model:** 10% platform fee on fulfilled pledge value (= €25 from a €250 pledge).

| What | Type | Effort |
|------|------|--------|
| DB: `pledge_matches` (campaign_id, sponsor_id, threshold, reward_value, fulfilled_at) | CODE | XS |
| Campaign creation form: optional pledge section | CODE | S |
| Campaign card + detail: live progress bar UI | CODE | S |
| Admin: pledge management panel (verify completion, mark fulfilled) | CODE | S |
| Notification trigger when threshold is reached | CODE | XS |
| Invoice/payment from sponsor | OPS | per fulfillment |

**Total code effort: 4–5 days.** Revenue per pledge: 10% of value.
**Non-code:** First 2–3 pledges require manual outreach to local businesses. After that, self-serve.

---

### 3. NGO Grant Report PDF Generator

**What it is:** A one-click PDF report formatted for EU grant applications (Horizon Europe, Green Deal, Interreg). Contains: volunteer hours (participants × campaign duration), unique volunteers, neighborhoods covered, before/after photo evidence, cleanup frequency trend, waste estimated (kg).

**Revenue model:** €150/report OR €750/year unlimited subscription (for NGOs that apply multiple times/year).
**Revenue estimate:** 10 NGOs × €150 = **€1,500/year** initially. 200+ eligible NGOs in Sofia.

| What | Type | Effort |
|------|------|--------|
| PDF template (PDFKit or jsPDF) with EU grant sections | CODE | M |
| Data aggregation queries (volunteer hours, kg, neighborhood map) | CODE | S |
| Admin: "Generate Grant Report" for specific date range + neighborhoods | CODE | S |
| Stripe payment before download (€150/report) | CODE | S (reuses Boost Stripe integration) |
| DB: `grant_reports` (generated_at, date_range, paid_at, ngо_id) | CODE | XS |
| Sales outreach to NGOs | BD | ongoing |

**Total code effort: 2–3 weeks.** Requires Stripe (also needed for other features — amortized cost).

---

### 4. iCal / Google Calendar Export

**What it is:** "Add to Calendar" button on campaign detail page. Generates `.ics` file (RFC 5545) with title, date, time, location (Google Maps link), description. Works with Google Calendar, Apple, Outlook, any Android app.

**Revenue model:** None — pure retention/engagement feature. Prevents the #1 dropout cause: people forget the date.

| What | Type | Effort |
|------|------|--------|
| Client-side `.ics` generation (no backend) | CODE | XS |
| Campaign detail: "Add to Calendar" button | CODE | XS |

**Total code effort: 1 day.** Zero revenue but directly reduces attendance dropout.

---

### 5. API Access Tier for Developers & Researchers

**What it is:** Rate-limited read API over anonymized platform data: neighborhood cleanup frequency, campaign counts, engagement scores, top volunteer stats. Documented, with API key management.

**Revenue model:**
- Free: 100 req/day, 30-day history
- Starter (€25/month): 1,000 req/day, 1-year history
- Pro (€100/month): unlimited, real-time, batch export

**Revenue estimate:** 5 Starter + 2 Pro subscribers = **€330/month = €4,000/year.**

| What | Type | Effort |
|------|------|--------|
| Supabase Edge Function: public API endpoints (neighborhoods, stats, campaigns) | CODE | M |
| API key management (DB table + middleware) | CODE | S |
| Rate limiting per API key | CODE | S |
| Developer documentation page | CODE | S |
| Stripe subscription for Starter/Pro tiers | CODE | S |
| GDPR anonymization layer (no user PII in responses) | CODE | S |

**Total code effort: 3–4 weeks.** Target first customers: Sofia University, Homes.bg, city data researchers.

---

### 6. LinkedIn Verifiable Micro-credentials

**What it is:** After 5 / 25 / 50 cleanups, user can claim a verifiable credential that gets added to their LinkedIn profile (Skills & Certifications section). In-platform badge is free; the official credential is €5–€10.

**Revenue model:** €5–€10 per credential issuance.
**Revenue estimate:** 100 credentials/year × €8 = **€800/year.**

| What | Type | Effort |
|------|------|--------|
| LinkedIn API integration (OAuth + Certifications API) | CODE | M |
| Profile page: "Claim Credential" button at milestone | CODE | S |
| Stripe: €5–€10 payment before issuance | CODE | XS (reuses Stripe) |
| Credential record in DB | CODE | XS |

**Total code effort: 2–3 weeks.** LinkedIn API is well-documented. High perceived value for young users.

---

## Tier 2 — Moderate Complexity: Code + 1 External Service

---

### 7. "Clean Quarter Pro" Freemium Membership

**What it is:** Paid tier (€2.50/month or €25/year) unlocking: 24h early reward access, Pro badge, private campaigns, impact PDF export, recurring campaign creation. Built on Stripe Checkout + webhook.

**Revenue model:** Subscription revenue.
**Revenue estimate:** 500 users × 5% conversion × €25/year = **€640/year** at current scale. Scales linearly with user growth.

| What | Type | Effort |
|------|------|--------|
| Stripe Checkout integration (subscription product) | CODE | M |
| `profiles.subscription_tier` column (free/pro/expired) | CODE | XS |
| Stripe webhook handler (subscription created/cancelled/expired) | CODE | S |
| Pro features gating across all page scripts | CODE | M |
| Profile settings: subscription management (cancel, billing portal) | CODE | S |
| Pro badge rendering on leaderboard, campaign cards, profile | CODE | S |
| Private campaign flow (invite-only RSVP) | CODE | M |

**Total code effort: 4–6 weeks.** Stripe is the main dependency — but it's also needed for Boost and Grant Reports, so this setup cost is shared across 3 revenue streams.

---

### 8. Corporate Volunteer Day — Automated Report

**What it is:** Company runs a cleanup event on the platform. After completion, platform auto-generates a branded "Volunteer Day Report" PDF: date, location, participant count, photos, impact metrics. Priced at €150–€500 per event.

**Revenue model:** Per-event fee.

| What | Type | Effort |
|------|------|--------|
| Campaign type flag: `is_corporate_event` (boolean) | CODE | XS |
| Corporate branding on campaign card (logo upload) | CODE | S |
| Post-completion PDF report generator (same engine as Grant Report) | CODE | S (reuses PDF engine) |
| Stripe: one-time payment (€150–€500) gated before report download | CODE | XS |
| Admin: corporate campaign management | CODE | S |
| Sales outreach to HR departments | BD | ongoing |

**Total code effort: 1–2 weeks** (after Grant Report PDF engine is built). The PDF engine is the main investment — reused across 3 products (Grant Report, Volunteer Day, Impact Certificate).

---

### 9. Physical "Impact Certificate" — Print-on-Demand

**What it is:** At milestone (10/25/50 cleanups), user orders a personalized printed A4 certificate. Platform generates PDF, sends to print-on-demand service (Canva Print, Vistaprint API, or local BG printer), ships via Econt/Speedy. €8–€10 including shipping.

**Revenue model:** Product margin (~30–40%) + shipping.

| What | Type | Effort |
|------|------|--------|
| Milestone detection + "Order Certificate" CTA in profile | CODE | S |
| Certificate PDF generation (personalized, branded) | CODE | S (reuses PDF engine) |
| Stripe: €8–€10 payment | CODE | XS |
| Integration with print-on-demand API OR manual print queue | CODE/OPS | S |
| Econt API: create shipment, send tracking to user | CODE | M |
| Shipping address collection UI | CODE | S |

**Total code effort: 2–3 weeks.** Econt API is the main new integration (also needed for reward delivery).

---

### 10. "Adopt a Spot" — Corporate Location Sponsorship

**What it is:** Company pays €250–€1,000/year to adopt a map location. Gets logo on map pin, monthly before/after photo report email, priority cleanup campaigns at that location. Admin panel: manage adopted locations, generate monthly reports.

**Revenue model:** Annual subscription per location.

| What | Type | Effort |
|------|------|--------|
| DB: `location_sponsors` (lat, lng, company_name, logo_url, expires_at, contact_email) | CODE | XS |
| Map: logo overlay on adopted location pins | CODE | S |
| Admin: Sponsors tab (add/edit/remove adopted spots, expiry tracking) | CODE | M |
| Monthly automated report email (Supabase Edge Function cron) | CODE | M |
| Stripe: annual subscription payment | CODE | S |
| Sales outreach to retailers and property developers | BD | ongoing |

**Total code effort: 3–4 weeks.** First 3 customers via direct outreach. Revenue before full self-serve is built.

---

## Tier 3 — Business Development Required (Code is Secondary)

These features have straightforward code implementations, but the real work is **selling and relationship-building**. The code can be built in 1–2 weeks; closing the first customer takes 1–3 months of BD work.

---

### 11. Municipal SLA Contract (B2G)

**What it needs:**
1. **BD work (3–6 months):** Identify the right contact at Sofia Municipality's Environmental Directorate. Book a demo. Propose a free 3-month pilot for one district (Darvenitsa). After pilot, convert to paid annual contract.
2. **Code work (2–3 weeks):** Municipality-specific dashboard (monthly reports, hazardous waste routing, verified cleanup data formatted for official use).
3. **Contract work:** Standard public procurement or direct service agreement (lawyer needed).

**Revenue potential:** €10,000–€20,000/year per district. **Game-changer if closed.**
**Realistic timeline:** First contract Q4 2026 at earliest.

---

### 12. School / University Community Service

**What it needs:**
1. **BD work:** Contact school directors or student affairs offices at 5 Sofia high schools. Pitch free pilot year.
2. **Code work (1–2 weeks):** School admin account, volunteer hours logging, signed PDF certificate generation, class leaderboard.
3. **Pricing:** €100/year per school after free pilot.

**Revenue potential:** 50 schools × €100 = €5,000/year ARR.
**First BD target:** SU "Kliment Ohridski" student volunteer programs (large, has existing volunteer hour requirements).

---

### 13. Corporate ESG Subscription

**What it needs:**
1. **BD work:** Target companies with published sustainability reports (A1, Vivacom, Kaufland BG, Lidl BG). Approach their CSR/Sustainability Manager.
2. **Code work (1 week):** Corporate team account, ESG PDF report after each team cleanup.
3. **Pricing:** €75–€250/year per team.

---

### 14. HOA / Building Management (домоуправители)

**What it needs:**
1. **BD work:** Contact 3–5 property management companies (Bulgarian Properties management arm, Era BG). Pitch "building cleanup subscription" €100/year.
2. **Code work (2–3 days):** Building-tagged campaigns, quarterly impact PDF for tenant noticeboard.

---

### 15. Insurance Micro-discount Partnership

**What it needs:**
1. **BD work:** This is a C-suite partnership conversation with Bulstrad or Generali. Needs a data deck showing correlation between civic engagement and reduced property damage claims. Realistic timeline: 6–12 months to close.
2. **Code work (1 week):** Eligibility verification API (returns bool: user has 3+ cleanups this quarter) + anonymized bulk data export.

---

### 16. Employer Benefit via HR Platforms

**What it needs:**
1. **BD work:** Apply to be listed on Worksmile and/or Edenred Benefits catalogue. Both have online partner application forms. Bulk pricing negotiation (€20/employee vs. €25 direct).
2. **Code work:** Company license management (admin creates sub-accounts for employees) — 1 week.

---

## Tier 4 — Non-Code (Operations, Logistics, Partnerships)

### 17. Monthly "Volunteer Box" Subscription

**What it is:** €10/month box with cleanup supplies + local eco-brand coupon.
**Implementation:** Pure logistics and supply chain. No meaningful new code beyond a "subscribe" Stripe billing page.

**Steps:**
1. Source suppliers: biodegradable bags (ЕкоПак-approved supplier), gloves (bulk from Praktiker/OBI B2B), grabber tool, reflective vest.
2. Negotiate with 2–3 local eco-brands for coupon inclusion (they pay €25–€50/month for inclusion in 200 boxes = great ROI for them).
3. Econt Fulfillment contract (they offer warehousing + monthly subscription delivery for e-commerce).
4. Design and print the "Volunteer of the Month" card (monthly, personalized).
5. Launch with pre-orders: need 50 subscribers to be economically viable.

**Break-even:** 50 subscribers at €10 = €500/month, minus ~€6 COGS = **€200/month margin.** At 200 subscribers: **€800/month.**

---

### 18. EU Grant Applications

**What it is:** Apply for EU funding directly for the platform.
**Why:** Clean Quarter IS an EU-fundable civic tech + environmental project. The right programs:

| Program | Amount | Deadline | Fit |
|---------|--------|----------|-----|
| LIFE Programme (Environment) | 50,000–500,000 EUR | Rolling | ✅ Direct fit: urban waste reduction, citizen science |
| Urban Innovative Actions (UIA) | up to 5M EUR | Annual | ✅ Scalable civic tech for cities |
| EEA Grants Bulgaria (NGO fund) | 10,000–250,000 EUR | Annual | ✅ Civil society environmental projects |
| Horizon Europe (Digital Society) | 500,000–2M EUR | Rolling | ⚠️ Needs research partner |
| Bulgarian OPEND (EU Structural Funds) | €25,000–€100,000 | Annual | ✅ Digital transformation for civil society |

**Implementation:** Partner with an experienced EU grant consultant (8–15% success fee, no upfront cost). Platform provides impact data; consultant writes the application.
**Realistic outcome:** 1 successful grant = €25,000–€100,000. Changes the financial picture entirely.

---

### 19. Voluntourism / Sofia Tourism Partnership

**Steps:**
1. Contact Sofia Municipality Tourism directorate or Visit Sofia (публично дружество).
2. Pitch: "I Cleaned Sofia" experience for eco-tourists — 1-day campaign, local guide, certificate.
3. Platform co-branded in their "Sustainable Sofia" marketing materials.
4. Revenue: €1,500–€2,500/year sponsorship OR referral fee per tourist booking.

**Code needed:** Practically none — just a landing page in English and a special "tourist-friendly" campaign category.

---

### 20. Neighborhood Activation Consulting Service

**What it is:** Platform team (founder + 1 community manager) run a 90-day neighborhood onboarding: organize first 5 campaigns, facilitate first organizers, guarantee 50+ unique volunteers.
**Price:** €1,500–€2,500 per neighborhood.
**Code needed:** None — sells the existing platform + community expertise.
**Target:** Residential developments, shopping centers, university campuses.

---

## New Ideas (Round 3 — Not Yet in Roadmap)

---

### 21. "Neighborhood Restaurant Week" — Weekly Local Business Sponsor Slot

Restaurants pay €25–€100/week to be featured as the week's cleanup sponsor. All participants in any cleanup that week get a discount coupon from that restaurant (e.g., "15% off at Divaka this week — just for Clean Quarter volunteers"). Implementation: new `weekly_sponsor` table + banner on dashboard. Closes the loop between cleanup effort and immediate local reward. Revenue: **4 weeks × €50 = €200/month** from 1 restaurant. At 3 concurrent restaurants: €600/month.

**Code effort: S (2–3 days).** No external integration. Revenue starts from outreach to first restaurant.

---

### 22. "Adopt a Tree" — Urban Greening Companion Feature

Residents adopt and maintain a specific city tree via the platform. Sofia has ~200,000 street trees, many unmaintained. Registered tree adopters receive care reminders (seasonal), log maintenance activities (watering, debris clearing), and earn points. Partnership with Sofia Green System (ОП Озеленяване, Sofia Municipality). Revenue: €10/tree/year adoption fee to a co-managed fund (municipality + platform split). **Expands the platform's mission beyond litter — positions it as the complete urban civic stewardship app.**

**Code effort: M (2 weeks) — new entity type (trees) with map pins, care log, adopt flow.**
**BD:** Agreement with Sofia Green System for official data (tree registry with GPS coordinates).

---

### 23. Media Content Subscription — Weekly "Story of the Week"

Platform auto-generates a weekly content package: best before/after photo pair of the week + stats + human-interest angle, formatted for publication. Sold to local BG news sites (Dnes.bg, Blitz.bg, Sofia Live, OFFNews) as a weekly content subscription: **€250/month per outlet**.

They get: authentic, verified, hyperlocal environmental content (rare and valuable).
Platform gets: revenue + PR + backlinks + SEO.

**Code effort: S (1 week) — admin panel selects "Story of the Week" from approved photo pairs, generates a formatted HTML/PDF press kit.**
**BD:** Cold email to 5 local news editors.

---

### 24. "Gamification for Recycling" Pilot with Екопак

Екопак Bulgaria manages nationwide packaging recycling infrastructure. They have drop-off points across Sofia but zero community engagement. Pitch: platform provides gamification layer on top of their recycling infrastructure — residents earn points for verified recycling drop-offs (verified via QR code scan at Екопак stations). Platform charges Екопак **€2,500–€7,500/year** for the integration.

**This is the first concrete GaaS (Gamification-as-a-Service) use case — directly validates the long-term v3.0 platform thesis.** If this works with Екопак, it works with blood donation, food banks, and every other civic infrastructure operator.

**Code effort: L (1–2 months) — QR code system, new activity type, Екопак API integration if available, multi-tenant basic isolation.**

---

### 25. "Carbon Footprint → Carbon Credits" Integration

After each cleanup: platform estimates CO₂ impact (trees saved from pollution damage, reduced particulate matter, avoided illegal burning of dumped waste). Running total displayed as "Darvenitsa removed X tonnes CO₂-equivalent this year." Users can optionally "sell" accumulated credits to a carbon offset marketplace (e.g., South Pole, Pachama, or the EU voluntary carbon market). Platform takes 5% of carbon credit proceeds.

**This is the most futuristic idea here** — but the waste weight field (already planned) is the prerequisite. If platform can credibly estimate kg waste removed per campaign, the jump to CO₂-equivalent is one formula.

**Code effort: S (once waste weight field exists) — formula + display + carbon marketplace API.**
**BD:** Accreditation with a carbon registry is the hard part (multi-month process).

---

## Prioritization Matrix

```
HIGH VALUE, LOW EFFORT (Do first)
┌─────────────────────────────────────────────────────┐
│ • Green Wallet (3–4 days, immediate revenue)        │
│ • iCal Export (1 day, retention)                    │
│ • Pledge Drive (4–5 days, unlock business money)    │
│ • Restaurant Week Sponsor (2–3 days, weekly revenue)│
│ • Adopt a Spot (3–4 weeks, highest margin B2B)      │
└─────────────────────────────────────────────────────┘

HIGH VALUE, MEDIUM EFFORT (Do second)
┌─────────────────────────────────────────────────────┐
│ • Clean Quarter Pro (4–6 weeks, core B2C)           │
│ • NGO Grant Report PDF (2–3 weeks, B2B SaaS)        │
│ • Corporate Volunteer Day Report (1–2 weeks)         │
│ • API Access Tier (3–4 weeks, data product)         │
│ • EU Grant Application (BD, no code, 50K–500K EUR)  │
└─────────────────────────────────────────────────────┘

HIGH VALUE, HIGH EFFORT (Do with investment)
┌─────────────────────────────────────────────────────┐
│ • Municipal SLA (BD-heavy, €10K–€20K/district)      │
│ • School Certificates (BD + 1–2 weeks code)         │
│ • Volunteer Box (logistics, €2K/month at scale)   │
│ • LinkedIn Credentials (2–3 weeks)                  │
│ • Gamification for Екопак (1–2 months, GaaS proof)  │
└─────────────────────────────────────────────────────┘

STRATEGIC / LONG-TERM (Do after proof of concept)
┌─────────────────────────────────────────────────────┐
│ • Insurance Partnership (6–12 months BD)            │
│ • Adopt a Tree (requires Sofia Green System BD)     │
│ • Carbon Credits (requires registry accreditation)  │
│ • Civic OS Multi-category (3+ months code)          │
│ • GaaS Multi-tenancy (3+ months architecture)       │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Roadmap by Quarter

### Q2 2026 (April–June) — Revenue Foundation

**Goal: First 3 paying customers. Prove the model works.**

| Week | Action | Type | Owner |
|------|--------|------|-------|
| W1–2 | Build Stripe integration (one-time payment + subscription) | CODE | Dev |
| W1–2 | iCal export + campaign countdown timer | CODE | Dev |
| W3–4 | Green Wallet (points → NGO donations) | CODE | Dev |
| W3–4 | Contact 3 local NGOs (WWF BG, Balkani, BDZP) | BD | Founder |
| W5–6 | Pledge Drive feature | CODE | Dev |
| W5–6 | Cold outreach to 5 local businesses for first pledges | BD | Founder |
| W7–8 | "Adopt a Spot" admin panel + map overlay | CODE | Dev |
| W7–8 | Close first 2 Adopt a Spot deals (manual contract) | BD | Founder |
| W9–10 | Restaurant Week Sponsor feature | CODE | Dev |
| W9–10 | Outreach to 3 local restaurants | BD | Founder |

**Q2 2026 Revenue Target: ~€1,500–€2,500**

---

### Q3 2026 (July–September) — Product Monetization

**Goal: Recurring B2C revenue. First institutional customer.**

| Action | Type | Effort |
|--------|------|--------|
| Clean Quarter Pro membership (Stripe subscription) | CODE | 4–6 weeks |
| NGO Grant Report PDF generator | CODE | 2–3 weeks |
| Push notification expansion (RSVP, new campaign, comments) | CODE | 1 week |
| EU Grant application (start process with consultant) | BD | ongoing |
| First school pilot outreach (5 Sofia high schools) | BD | ongoing |
| First corporate ESG prospect meetings | BD | ongoing |

**Q3 2026 Revenue Target: ~€4,000–€8,000**

---

### Q4 2026 (October–December) — Institutional Revenue

**Goal: First B2B institutional contract. First paid B2G conversation.**

| Action | Type | Effort |
|--------|------|--------|
| Corporate Volunteer Day report generator | CODE | 1–2 weeks |
| Impact Certificate (print-on-demand) | CODE | 2–3 weeks |
| LinkedIn Credentials | CODE | 2–3 weeks |
| API Access Tier (developer API) | CODE | 3–4 weeks |
| Municipal pilot proposal (Darvenitsa district) | BD | 1–2 months negotiation |
| Close first 3 school subscriptions | BD | ongoing |

**Q4 2026 Revenue Target: ~€10,000–€15,000 cumulative**

---

### 2027 — Scale & Diversify

| Action | Type |
|--------|------|
| "Volunteer Box" logistics launch | OPS |
| Adopt a Tree (Sofia Green System partnership) | BD + CODE |
| Media Content Subscription (weekly story) | BD + CODE |
| HOA/Building management outreach | BD |
| Property Developer Vitality Reports | BD + CODE |
| Employer Benefits via HR platforms | BD |
| Екопак GaaS pilot | BD + CODE |

**2027 Revenue Target: ~€40,000–€60,000 ARR**

---

## What This Is NOT

To stay focused, these monetization ideas are explicitly **not** in scope:

- ❌ Paywalling core cleanup participation (fundamental design principle)
- ❌ Selling individual user data (GDPR violation, trust destruction)
- ❌ Advertising banners or pop-ups on the platform (degrades UX)
- ❌ Cryptocurrency / NFTs (complexity without civic value)
- ❌ Venture capital fundraising (keeps the platform mission-driven, not VC-exit driven)

---

*Last updated: 2026-03-23. Created as dedicated monetization reference to accompany ROADMAP.md § Business Model.*
