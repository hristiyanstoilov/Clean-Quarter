# Admin Dashboard Guide

## Access

Requires `role = 'admin'` or `role = 'superadmin'` in the `profiles` table. Role is set via the Admin Panel itself (by another admin) or directly in Supabase Dashboard → Table Editor.

Superadmin role cannot be self-demoted — enforced at DB level.

## Sections

### 1. Pending Participations

Paginated table (20 per page) of participation proofs awaiting review.

- **Approve** — awards points to the user (DB trigger creates `point_transactions` row)
- **Reject** — rejection reason is **required** before submitting. Reason is stored in `participations.rejection_reason` and shown to the user.

### 2. Campaign Management

Paginated list of all campaigns. Admin can:
- View campaign details
- Change campaign status (active / completed / cancelled)
- Delete campaigns (only if no external participants)

### 3. User Management

Paginated list of all users. Admin can:
- View profile details (email, neighborhood, points balance, role)
- Change user role (user ↔ admin). Superadmin cannot be demoted.

### 4. Disposal Points

Manage the map's disposal/recycling points:
- Add new disposal point (name, description, latitude, longitude, neighborhood)
- Edit existing points
- Soft-delete points (they disappear from the map)

### 5. Abuse Reports

Paginated table of user-submitted abuse reports pending review.

- Reports are submitted by users from campaign detail pages (spam / inappropriate / harassment / fake / other)
- Admin can **Resolve** (mark as actioned) or **Dismiss** (mark as unfounded)
- DB trigger fires `notify_report_resolved` — reporter receives an in-app notification when resolved
- Duplicate reports from the same user within 24h are blocked at DB level

### 6. Statistics Banner

Shown at the top of the dashboard — displays count of pending participations requiring review.

### 7. Pollution Heatmap

Toggle button in the header switches the campaign map to a Leaflet.heat overlay showing campaign density per location. Uses session-cached data (refreshed on page load, cleared on reload). Heatmap is built from approved campaign coordinates.

## CSV Export

Admin can download a CSV of all participations for municipality reporting:
- Columns: date, username, neighborhood, campaign title, status, points earned, rejection reason
- File name: `clean-quarter-participations-YYYY-MM-DD.csv`
- Encoding: UTF-8 with BOM (Excel-compatible)
- Available via the **Export CSV** button in the Pending Participations section

## Neighborhood Dashboard (All Users)

Per-neighborhood metrics visible to all authenticated users on the dashboard leaderboard:
- Total points per neighborhood
- Number of participants
- Highlights the current user's neighborhood

## Notes

- All admin actions are protected by RLS — cannot be performed by regular users even if the frontend is bypassed
- Admin panel is not accessible to demo users
- Role changes are audit-logged in `point_transactions` (type=`role_change`)
- Superadmin cannot self-demote — enforced at DB level
- `point_transactions.type` supports `'admin_adjustment'` in the schema — a manual point correction UI is planned for v1.3 but not yet built

## Known Gaps (tracked in ROADMAP.md)

| Gap | Status |
|-----|--------|
| Approval/rejection is one-at-a-time — no batch select | v1.3 planned |
| `loadReports()` uses inline BG/EN ternaries instead of `t()` — EN admins see Bulgarian | Bug Backlog |
| `renderReports()` uses inline `onclick=` handlers — CSP & XSS risk | Bug Backlog |
| `admin_adjustment` point type defined in schema but no UI to use it | v1.3 planned |
| No "User Activity" tab — `profiles.last_login_at` tracked but never surfaced | v2.0 planned |
| No "Flagged Submissions" tab — fraud detection is fully manual | v1.3 planned |
| Heatmap toggle exists in i18n but rendering is a stub | v2.0 planned |
| Report auto-escalation (auto-flag for ban at 3 confirmed violations) | v2.0 planned |
