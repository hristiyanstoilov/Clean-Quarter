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

### 5. Statistics Banner

Shown at the top of the dashboard — displays count of pending participations requiring review.

## Neighborhood Dashboard

Per-neighborhood metrics visible to all authenticated users on the dashboard leaderboard:
- Total points per neighborhood
- Number of participants
- Highlights the current user's neighborhood

## Notes

- All admin actions are protected by RLS — cannot be performed by regular users even if the frontend is bypassed
- Admin panel is not accessible to demo users
