# Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. A Supabase project with the database schema applied
2. A Google Cloud project with Maps JavaScript API and Places API enabled
3. API keys and environment variables ready

## Deployment Steps

### 1. Supabase Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase/schema.sql` in the SQL editor
3. Configure authentication providers in the Auth settings
4. Note your project URL and anon key

### 2. Google Cloud Setup

1. Create a new Google Cloud project
2. Enable the Maps JavaScript API and Places API
3. Create an API key with appropriate restrictions:
   - Restrict to HTTP referrers (your domain)
   - Restrict to specific APIs (Maps JavaScript API, Places API)

### 3. Vercel Deployment

1. Push your code to a Git repository
2. Import the project in Vercel
3. Configure environment variables:
   \`\`\`
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   \`\`\`
4. Deploy the application

### 4. Post-Deployment

1. Test authentication flow
2. Verify map functionality
3. Check that locations can be saved and retrieved
4. Update Google Maps API key restrictions with your deployed domain

## Local Development

1. Clone the repository
2. Create a `.env.local` file with the required environment variables
3. Run `npm install` to install dependencies
4. Run `npm run dev` to start the development server
5. Access the application at `http://localhost:3000`
