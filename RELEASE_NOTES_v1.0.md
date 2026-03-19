# Clean Quarter v1.0 Release Notes

## Initial Release — March 2026

### Core Features

- ✅ User authentication (register / login / logout)
- ✅ Password recovery via email (forgot-password + reset-password pages)
- ✅ Campaign creation with map location picker and before-photo upload
- ✅ Scheduled date, start time and optional end time per campaign
- ✅ Campaign categories
- ✅ Participation and after-photo proof submission
- ✅ Admin approval / rejection of participation proofs (rejection reason required)
- ✅ Points system with rewards catalog and redeem flow
- ✅ Admin dashboard with paginated tables (users, participations, campaigns)
- ✅ Neighborhood leaderboard on dashboard
- ✅ Real-time notification bell (DB-trigger driven)
- ✅ Weather widget on dashboard (Open-Meteo API)
- ✅ Interactive map with campaign and disposal-point markers (marker clustering)
- ✅ Bilingual UI — Bulgarian / English (custom i18n module)
- ✅ Demo mode — full offline simulation via localStorage (no account required)
- ✅ PWA support — service worker, offline fallback, installable
- ✅ Privacy Policy page

### Technical Stack

- Vite + Vanilla JavaScript (ES Modules)
- Supabase (Auth + PostgreSQL + Storage)
- Bootstrap 5
- Leaflet.js + leaflet.markercluster
- Open-Meteo weather API
- Vitest (unit + integration tests)
- Cypress (E2E tests)

### Database

- 10 tables: profiles, campaigns, participations, rewards, point_transactions, comments, notifications, reports, disposal_points + auth.users (managed by Supabase)
- 45 migration files applied in chronological order
- Row Level Security (RLS) on all tables
- DB-level constraints: `end_time > start_time`, unique participation per user/campaign, rejection reason enforced
- Server-side login rate limiting via `check_login_rate_limit` RPC
- 5 DB triggers: profile creation on signup, point transaction on approval, participation integrity, approval notification, join notification

### Testing

- **530 unit + integration tests** — all passing
- **42 test files** (Vitest)
- Demo mode compatibility tested
- RLS policy integration tests (require `.env.test` with real DB credentials)

### Security

- RLS enforced at DB level — cannot be bypassed from frontend
- JS role checks at UX level (redirects, conditional rendering)
- `escapeHTML()` applied on all dynamic innerHTML
- No `eval`, no `innerHTML` without sanitisation
- Content Security Policy headers via Netlify
- Password: min 8 chars, uppercase, lowercase, digit — validated via `rules.password()`

### Known Limitations

- Demo mode uses localStorage — data not synced across devices or sessions
- Mobile native app not available (PWA covers installability)
- Neighborhoods limited to 5 Sofia districts

### Merged Pull Requests (v1.0)

PRs #1–#44 merged to `main`, including security fixes (XSS avatar, rewards onclick), i18n fixes across all pages, password recovery, notification bell, weather widget, campaign date/time, and all features listed above.

---

**Contributors:** hristiyanstoilov
**License:** MIT
**Support:** GitHub Issues — https://github.com/hristiyanstoilov/Clean-Quarter/issues
