# Project Instructions for AI Agent

## Project Overview
"Clean Quarter" (Чист Квартал) is a gamified web platform for organizing neighborhood cleanups in the "Studentski" district of Sofia.
Users earn points for cleaning, which they exchange for services/rewards.
Admins approve cleanup proofs (Before/After photos).

## Tech Stack
- **Frontend:** Vanilla JavaScript (ES Modules), Vite, Bootstrap 5 (CDN).
- **Backend:** Supabase (Auth, Database, Storage).
- **Maps:** Leaflet.js (OpenStreetMap) - No Google Maps.
- **Architecture:** Modular (separate files for logic/UI in `src/`). No TypeScript.

## Core Business Logic
1. **Neighborhoods:** Hardcoded list: Studentski Grad, Darvenitsa, Musagenitsa, Vitosha (VEC), Malinova Dolina.
2. **Roles:** 'user' and 'admin' (set manually in DB).
3. **Points System:** Earn by cleaning, spend on Rewards.
4. **Validation:** Users upload "Before" photo to create campaign, "After" photo to claim points. Admin approves "After" photos.
5. **Geolocation:** Campaigns have Lat/Lng coordinates selected via Leaflet map.

## Database Schema (Supabase)
- `profiles`: id, username, role, points_balance, neighborhood.
- `campaigns`: id, title, description, location_lat, location_lng, status, before_photo_url, created_by.
- `participations`: id, campaign_id, user_id, status (pending/approved/rejected), after_photo_url.
- `rewards`: id, title, cost, category.
- `point_transactions`: history of points earned/spent.

## Coding Style
- Use `async/await` for all DB calls.
- Use `type="module"` in HTML.
- Keep UI separate from Logic (Service pattern).
- Comments in Bulgarian or English are fine.
