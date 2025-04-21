# Architecture

## File Structure

\`\`\`
/app                    # Next.js App Router pages
  /login                # Authentication pages
  /profile              # User profile pages
  /routes               # Routes pages
  /explore              # Explore/discovery pages
  /env.ts               # Environment variables
  /layout.tsx           # Root layout with providers
  /page.tsx             # Home page with map

/components             # React components
  /map-container.tsx    # Main map component
  /search-bar.tsx       # Location search component
  /header.tsx           # Navigation header
  /user-provider.tsx    # Authentication context provider
  /explore-locations.tsx # Location discovery component
  /routes-list.tsx      # Routes listing component
  /ui/                  # shadcn/ui components

/lib                    # Utility functions
  /supabase.ts          # Supabase client and types

/hooks                  # Custom React hooks
  /use-user.ts          # Authentication hook

/supabase               # Supabase configuration
  /schema.sql           # Database schema
\`\`\`

## Data Flow

1. **Authentication Flow**:
   - User credentials → User Provider → Supabase Auth → Update global auth state

2. **Map Interaction Flow**:
   - User interaction → Map Container → Google Maps API → UI update
   - Save location → Map Container → Supabase → Database → UI update

3. **Data Fetching Flow**:
   - Component mount → Hook/Effect → Supabase query → Update component state
