# Campaign Creation Guide

## Overview

Any authenticated user can create a cleanup campaign. The campaign appears on the dashboard map and in the campaign list once created.

## Steps

1. Navigate to **Create Campaign** (`/create-campaign`)
2. Fill in campaign details:
   - **Title** (required) — enter in Bulgarian and/or English
   - **Description** (required)
   - **Neighborhood** (required) — select from the 5 supported Sofia districts
   - **Category** (required) — e.g. Park, Street, Playground, etc.
   - **Scheduled Date** (required) — must be today or in the future
   - **Start Time** (required)
   - **End Time** (optional) — must be after start time if provided
3. Add a **"Before" photo** (required) — shows the area before cleanup
4. Select **location on map** — click to place pin, or use geolocation button
5. Complete the **visual checklist** — all required fields must be filled
6. Click **Submit** — campaign is created with status `active`

## Validation Rules

| Field | Rule |
|-------|------|
| Title | 5–100 characters |
| Description | 10–500 characters |
| Photo | Max 5 MB, JPG/PNG only; compressed client-side before upload |
| Location | Must be within Sofia bounds |
| Scheduled Date | Must be today or future (frontend check) |
| End Time | Must be after Start Time (DB-level CHECK constraint) |

## After Creation

- The creator is **automatically joined** as a participant
- Campaign appears on the dashboard map and campaign list (sorted by scheduled date ascending)
- Other users can join and upload "after" photos
- Admin reviews and approves/rejects participation proofs

## Demo Mode

In demo mode, campaigns are saved to `localStorage` with generated IDs and future dates. Data is not persisted across browser sessions.
