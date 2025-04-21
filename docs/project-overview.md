# MapSocial Project Overview

## Core Features

- **Interactive Map**: Google Maps integration with custom markers
- **Location Management**: Save, edit, and delete locations with privacy controls
- **Coordinate Input**: Directly enter latitude and longitude coordinates to save locations
- **User Authentication**: Complete authentication flow using Supabase
- **Social Features**: Share locations and routes with other users
- **Route Planning**: Create and save custom routes with multiple waypoints
- **Search Functionality**: Find locations using Google Places API

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, React 18+, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Map Integration**: Google Maps JavaScript API, Places API
- **Authentication & Database**: Supabase (Auth, PostgreSQL, Row-Level Security)
- **State Management**: React Context API and React Hooks

## Architecture

The application follows a client-side rendering approach for map interactions with server components for data fetching where appropriate. Authentication state is managed globally through a context provider, while map state is managed locally within components.

## Key Directories

- `/app`: Next.js App Router pages and layouts
- `/components`: Reusable React components
- `/lib`: Utility functions and configuration
- `/hooks`: Custom React hooks
- `/supabase`: Database schema and configuration

\`\`\`

Now, let's add documentation for the new coordinate input component:
