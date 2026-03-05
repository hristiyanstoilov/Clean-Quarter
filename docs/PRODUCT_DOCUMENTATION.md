# CLEAN QUARTER — Enterprise Product Documentation

**Version:** 1.0 | **Date:** March 2026 | **Classification:** Internal

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Strategy](#2-product-vision--strategy)
3. User Segments & Personas *(coming soon)*
4. Core User Journeys *(coming soon)*
5. Feature Breakdown *(coming soon)*
6. System Architecture *(coming soon)*
7. Non-Functional Requirements *(coming soon)*
8. Trade-offs & Product Decisions *(coming soon)*
9. Gaps for Enterprise Readiness *(coming soon)*
10. Suggested Product Roadmap *(coming soon)*

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
