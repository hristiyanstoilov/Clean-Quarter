# Clean Quarter - Чист Квартал

A gamified web platform for organizing neighborhood cleanups in Sofia's "Studentski" district.

## Project Overview

"Clean Quarter" (Чист Квартал) is a web application that enables residents to:
- Create cleanup campaigns
- Participate in cleanup activities
- Upload proof photos (Before/After)
- Earn points for completed cleanups
- Exchange points for local services and rewards
- Admins approve cleanup proofs and manage the platform

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES Modules), Vite, Bootstrap 5 (CDN)
- **Backend**: Supabase (Auth, Database, Storage)
- **Maps**: Leaflet.js (OpenStreetMap)
- **Architecture**: Modular (service pattern)

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- npm or yarn
- Supabase account

### Installation

```bash
# Install dependencies
npm install

# Create .env.local file with Supabase credentials
# Add the following variables:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_anon_key

# Start development server
npm run dev

# Build for production
npm run build
```

## Folder Structure

```
src/
├── pages/           # Individual page HTML files
│   ├── index.html           # Login/Register
│   ├── dashboard.html       # Main dashboard with map
│   ├── create-campaign.html # Create cleanup campaign
│   ├── campaign-detail.html # Campaign details & join
│   ├── profile.html         # User profile
│   ├── admin.html           # Admin panel
│   └── rewards.html         # Rewards shop
├── services/        # Business logic
│   ├── supabase.js          # Supabase client initialization
│   ├── auth.js              # Authentication functions
│   └── storage.js           # Image upload handling
├── assets/          # Static files & styles
│   └── style.css            # Global styles
└── main.js          # Application entry point

public/             # Static assets
```

## Features

### Core Features
1. **User Authentication**: Register, Login, Logout
2. **Campaigns**: Create cleanup campaigns with location and photos
3. **Map Integration**: View campaigns and disposal points on interactive map
4. **Participation**: Join campaigns and upload proof photos
5. **Admin Approval**: Review and approve submitted cleanup proofs
6. **Points System**: Earn points for approved cleanups
7. **Rewards Shop**: Exchange points for services
8. **User Profile**: View points, history, and achievements

### Database Schema

- `profiles`: User profiles with points and neighborhood
- `campaigns`: Cleanup campaign records
- `participations`: User participation with photo proofs
- `rewards`: Available rewards and services
- `point_transactions`: Points history

## Neighborhoods

- Studentski Grad
- Darvenitsa
- Musagenitsa
- Vitosha (VEC)
- Malinova Dolina

## Contributing

1. Create a new branch for each feature
2. Make commits with clear messages
3. Submit pull request for review

## License

MIT License
