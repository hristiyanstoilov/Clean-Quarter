# Clean Quarter (Чист Квартал)

Clean Quarter is a gamified web platform for organizing neighborhood cleanups in Sofia.
Users register / login, then browse cleanup campaigns on an interactive map, join campaigns by uploading "Before" and "After" photos, and earn points for verified cleanups.
Points can be exchanged for rewards (services/discounts). Admins approve cleanup proofs and manage users.

## Architecture and Tech Stack

Classical client-server app:
  - Front-end: JS app, Bootstrap 5, HTML, CSS
  - Back-end: Supabase
  - Database: PostgreSQL (Supabase)
  - Authentication: Supabase Auth
  - Maps: Leaflet.js (OpenStreetMap) - No Google Maps
  - Build tools: Vite, npm
  - API: Supabase REST API
  - Hosting: Netlify
  - Source code: GitHub

## Modular Design

Use modular code structure, with separate files for different components, pages and features. Use ES6 modules to organize the code.
  - `src/scripts/` - page-specific JS logic (admin.js, dashboard.js, etc.)
  - `src/services/` - business logic and API calls (supabase.js, auth.js, map.js, points.js, etc.)
  - `src/utils/` - utility functions (i18n.js, helpers.js, env.js, demoMode.js)
  - `src/state/` - application state management (store.js)
  - `src/components/` - reusable UI components (passwordToggle.js, passwordStrength.js)
  - `src/pages/` - HTML pages (admin.html, dashboard.html, profile.html, etc.)
  - `src/assets/` - CSS styles per page (admin.css, dashboard.css, etc.)
  - `src/i18n/` - translation files (bg.json, en.json)
  - `supabase/migrations/` - database migration SQL files (timestamped)
  - `supabase/seed.sql` - development seed data
  - `supabase/schema.sql` - full schema snapshot (reference only)

## UI Guidelines

  - Use HTML, CSS, Bootstrap 5 and Vanilla JS for the front-end.
  - Use Bootstrap components and utilities to create a responsive and user-friendly interface.
  - Implement modern, responsive UI design, with semantic HTML.
  - Use a consistent color scheme (red #dc3545 primary) and typography throughout the app.
  - Use appropriate icons, effects and visual cues to enhance usability.
  - Support bilingual interface (Bulgarian / English) via i18n module.

## Pages and Navigation

  - Split the app into multiple pages, each in a separate HTML file.
  - Implement pages as reusable components (HTML, CSS and JS code).
  - Use full URLs for navigation between pages.
  - Available pages:
    - `/` - Landing page (login / register)
    - `/src/pages/dashboard.html` - Campaign map and list
    - `/src/pages/create-campaign.html` - Create new cleanup campaign
    - `/src/pages/campaign-detail.html` - View campaign details, join, upload photos
    - `/src/pages/profile.html` - User profile, settings, point history
    - `/src/pages/admin.html` - Admin panel (approve photos, manage users)
    - `/src/pages/rewards.html` - Browse and redeem rewards

## Backend and Database

  - Use Supabase as the backend and database for the app.
  - Use PostgreSQL as the database, with tables for users, campaigns, participations, rewards, and transactions.
  - Use Supabase Storage for file uploads (Before/After cleanup photos, profile pictures).
  - When changing the DB schema, always use migrations to keep track of changes.
  - After applying a migration in Supabase, keep a copy of the migration SQL file in `supabase/migrations/` (format: `YYYYMMDDHHMMSS_description.sql`).

### Database Schema (6 tables)

  - `profiles`: id, username, role, points_balance, neighborhood
  - `disposal_points`: id, name, description, latitude, longitude, neighborhood, address
  - `campaigns`: id, title, description, location_lat, location_lng, disposal_point_id, status, before_photo_url, created_by, neighborhood
  - `participations`: id, campaign_id, user_id, status (pending/approved/rejected), after_photo_url, points_earned
  - `rewards`: id, title, description, cost, category, image_url, quantity_available
  - `point_transactions`: id, user_id, amount, type, description, campaign_id, reward_id, created_at
  - never edit existing migrations after they have been applied -> create a new migration for any changes to the DB shema.

## DB Migrations

Always follow this workflow when making schema changes:

  1. Write the migration SQL.
  2. Apply it directly in Supabase via the MCP `apply_migration` tool — this is the source of truth.
  3. Verify the migration was recorded by checking `supabase_migrations.schema_migrations` (name + inserted_at only — the SQL is not stored there).
  4. Save the migration as a local SQL file in `supabase/migrations/YYYYMMDDHHMMSS_description.sql`.
  - Never edit an existing migration after it has been applied — always create a new one.
  - Local files in `supabase/migrations/` are a mirror of what Supabase has applied, not a source.

## Authentication and Authorization

  - Use Supabase Auth for user authentication and authorization.
  - Implement RLS policies to restrict access to data based on user roles and permissions.
  - Implement user roles: `admin` and `user` (stored in `profiles.role` column).
  - Admin users can: approve/reject cleanup submissions, manage user roles, view all data.
  - Regular users can: create campaigns, join campaigns, upload photos, view own profile.
  - Demo mode available for testing without Supabase connection (uses localStorage).

## Core Business Logic

  1. **Neighborhoods:** Hardcoded list: Studentski Grad, Darvenitsa, Musagenitsa, Vitosha (VEC), Malinova Dolina.
  2. **Points System:** Users earn 20 points per approved cleanup, spend points on Rewards.
  3. **Campaign Flow:** User creates campaign with "Before" photo -> Other users join and upload "After" photo -> Admin approves -> Points awarded.
  4. **Geolocation:** Campaigns have Lat/Lng coordinates selected via Leaflet map picker.
  5. **File Storage:** Before/After photos stored in Supabase Storage buckets.

## Coding Style

  - Use `async/await` for all DB calls and asynchronous operations.
  - Use `type="module"` in HTML script tags.
  - Keep UI separate from Logic (Service pattern).
  - Use named exports for testability.
  - Comments in Bulgarian or English are fine.
  - Use ES6+ features: arrow functions, template literals, destructuring, optional chaining.
