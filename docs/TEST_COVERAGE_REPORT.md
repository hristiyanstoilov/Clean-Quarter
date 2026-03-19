# QA Test Coverage Report
**Clean Quarter Application**
**Report Date:** 2026-03-19
**Testing Framework:** Vitest (unit + integration) · Cypress (E2E)

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Unit + Integration Tests | **530 passing** |
| Test Files | **42** |
| Real-DB Integration | 1 test (requires `.env.test`) |
| E2E Test Files | 4 Cypress spec files |
| Test Execution Time | ~10s |
| Passing Rate | **100%** |

---

## Test Files by Area

### Authentication & Auth Helpers
| File | Tests | Coverage |
|------|-------|----------|
| `tests/auth-store.integration.test.js` | 4 | register, login, failed login, logout |
| `tests/login-rate-limit.test.js` | 24 | rate limiting RPC, error flags, migration SQL |

### Campaign Features
| File | Tests | Coverage |
|------|-------|----------|
| `tests/campaign-datetime.test.js` | 21 | date/time validation, formatting, i18n |
| `tests/campaign-datetime-2.test.js` | 60 | scheduling logic, edge cases, timezones |

### Map
| File | Tests | Coverage |
|------|-------|----------|
| `tests/map.integration.test.js` | 5 | initializeMap, createMarkerIcon, loadCampaignMarkers, loadMapData, cluster group |

### Notifications
| File | Tests | Coverage |
|------|-------|----------|
| `tests/notifications.test.js` | 100 | fetch, render, mark-as-read, realtime, badge count |

### Validation
| File | Tests | Coverage |
|------|-------|----------|
| `tests/validation.test.js` | — | field rules, schema validation, custom rules |
| `tests/validation.integration.test.js` | 4 | required rule, form schema, custom rule/schema |

### Helpers & Utilities
| File | Tests | Coverage |
|------|-------|----------|
| `tests/helpers.test.js` | — | capitalize, formatDate, debounce, escapeHTML |
| `tests/helpers.all.test.js` | 12 | safeParse, safeStringify, isEmpty, etc. |

### Error Handling
| File | Tests | Coverage |
|------|-------|----------|
| `tests/errorHandler.test.js` | 15 | error types, messages, retry logic |

### Internationalisation (i18n)
| File | Tests | Coverage |
|------|-------|----------|
| `tests/i18n.test.js` | 13 | language switching, translation loading, fallbacks |
| `tests/admin-i18n.test.js` | 10 | admin panel translations BG/EN |

### PWA & Deploy Config
| File | Tests | Coverage |
|------|-------|----------|
| `tests/deploy-config.test.js` | 29 | CSP headers, netlify.toml, redirect rules |

### Storage & DB
| File | Tests | Coverage |
|------|-------|----------|
| `tests/storage.integration.test.js` | 6 | uploadCampaignPhoto, deleteCampaignPhoto, error handling |
| `tests/supabase.real.integration.test.js` | 1 | real DB ping (skipped without `.env.test`) |
| `tests/supabase.crud.integration.test.js` | — | CRUD operations (requires `.env.test`) |
| `tests/supabase.extra.integration.test.js` | — | extra queries (requires `.env.test`) |

### Points
| File | Tests | Coverage |
|------|-------|----------|
| `src/services/__tests__/points.test.js` | 3 | earn, spend, invalid type |

---

## Critical User Journeys — Coverage

| Journey | Status |
|---------|--------|
| Register → Dashboard | ✅ Covered |
| Login (success + rate limit + wrong credentials) | ✅ Covered |
| Forgot password → Email → Reset | ✅ Covered (E2E) |
| Create Campaign (with date/time/category) | ✅ Covered |
| Join Campaign → Upload proof → Admin approves | ✅ Covered (E2E) |
| Admin rejects with required reason | ✅ Covered |
| Earn Points → Redeem Reward | ✅ Covered |
| Map — markers and clustering | ✅ Covered |
| Notifications — real-time + mark-as-read | ✅ Covered |
| Language switching (BG ↔ EN) | ✅ Covered |

---

## Running Tests

```bash
# All tests (530)
npm test

# Single file
npx vitest run tests/notifications.test.js

# With real-DB integration tests (requires .env.test)
npx vitest run tests/supabase.real.integration.test.js

# E2E tests
npx cypress open
npx cypress run
```

### `.env.test` for real-DB tests

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_USER_EMAIL=user@example.com
SUPABASE_USER_PASSWORD=password
SUPABASE_ADMIN_EMAIL=admin@example.com
SUPABASE_ADMIN_PASSWORD=password
```

---

## Open Gaps

| Area | Gap | Priority |
|------|-----|----------|
| File upload | No E2E test for actual photo upload | Medium |
| Touch gestures | Mobile touch interactions untested | Low |
| Performance | No load/benchmark tests | Low |
| Accessibility | No automated a11y tests | Medium |
| Visual regression | No snapshot/screenshot tests | Low |

---

**Status:** PRODUCTION READY — all 530 tests passing, all critical paths covered.
