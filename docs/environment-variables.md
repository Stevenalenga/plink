# Environment Variables

## Required Variables

| Variable                      | Description                                   | Example                                  |
|-------------------------------|-----------------------------------------------|------------------------------------------|
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | Google Maps JavaScript API key              | AIzaSyC1a5xJ2L9x7Q9vXI3jDsfqT1c3X7U1234 |
| NEXT_PUBLIC_SUPABASE_URL      | URL of your Supabase project                 | https://abcdefghijklm.supabase.co        |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Anonymous key for your Supabase project      | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |

## Configuration

Create a `.env.local` file in the project root with these variables:

\`\`\`
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

## Usage

Environment variables are imported and used in the application:

\`\`\`typescript
// app/env.ts
export const NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
export const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
\`\`\`

These are then imported where needed:

\`\`\`typescript
import { NEXT_PUBLIC_GOOGLE_MAPS_API_KEY } from "@/app/env"
\`\`\`

## Security Considerations

- The Google Maps API key should be restricted to specific domains and APIs
- The Supabase anon key has limited permissions defined by Row-Level Security policies
- Both keys are exposed to the client, so proper security measures must be in place
