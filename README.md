# KSTVET Attendance Management System

A fullstack web application for the Kenya School of Technical and Vocational Education and Training (KSTVET) to manage trainee attendance using QR codes and GPS location verification.

## Features

### Trainer Features
- Generate attendance sessions with unique QR codes
- Define specific locations with GPS coordinates and radius
- Set date, time, and location for each session
- View QR codes for trainees to scan
- Generate comprehensive attendance reports
- Filter reports by session, date, or user

### Trainee Features
- Scan QR codes using phone camera
- Automatic GPS location verification
- Mark attendance only when within defined location radius
- View personal attendance history
- Real-time location verification

### Security Features
- Prevent proxy attendance (trainees cannot mark for others)
- GPS-based location verification
- Role-based access control
- Secure QR token validation

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **QR Code**: Custom QR scanner component
- **GPS**: Browser Geolocation API
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your URL and keys
3. Create a `.env.local` file in the root directory (see `env-setup.md` for template)

### 3. Database Setup

1. Open the Supabase SQL Editor
2. Run the SQL script from `database-schema.sql`
3. This will create all necessary tables, functions, and RLS policies

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Tables

- **users**: User profiles with roles (trainer/trainee)
- **locations**: Training locations with GPS coordinates and radius
- **sessions**: Attendance sessions with QR tokens and schedules
- **attendance**: Attendance records with GPS verification

### Functions

- `calculate_distance`: Calculate distance between two GPS points
- `is_within_location_radius`: Check if user is within location radius

## Usage

### For Trainers

1. Sign up with a trainer account
2. Create locations where training sessions will occur
3. Generate attendance sessions with QR codes
4. Display QR codes for trainees to scan
5. View attendance reports and analytics

### For Trainees

1. Sign up with a trainee account
2. Enable location services on your device
3. Scan QR codes when prompted by trainers
4. Attendance is automatically verified using GPS
5. View your attendance history

## API Endpoints

### Sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create new session

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance

### Locations
- `GET /api/locations` - List locations
- `POST /api/locations` - Create new location

## Security Features

- Row Level Security (RLS) on all tables
- Role-based access control
- QR token validation
- GPS location verification
- Prevention of duplicate attendance marking

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

## Mobile Optimization

The application is fully responsive and works on:

- Desktop browsers
- Tablets
- Mobile phones (iOS and Android)
- Progressive Web App (PWA) capabilities

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
