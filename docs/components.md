# Key Components

## Map Container (`components/map-container.tsx`)

The core component that renders the Google Maps interface and handles map interactions.

### Responsibilities:
- Initialize and render Google Maps
- Handle map click events to save locations
- Display saved locations as markers
- Manage location saving dialog
- Fetch and display user's saved locations

### Key Functions:
- `loadLocations()`: Fetches user's saved locations from Supabase
- `addMarkerToMap()`: Adds a marker to the map for a saved location
- `saveLocation()`: Saves a new location to Supabase
- `saveLocationFromCoordinates()`: Saves a location from manually entered coordinates

## Coordinate Input (`components/coordinate-input.tsx`)

Component that allows users to manually enter coordinates to save locations.

### Responsibilities:
- Provide a dialog for entering latitude and longitude
- Validate coordinate inputs
- Allow setting location name and privacy
- Save coordinates as a new location

### Key Functions:
- `validateCoordinates()`: Validates that latitude and longitude are within valid ranges
- `handleSubmit()`: Processes the form submission and saves the location

## User Provider (`components/user-provider.tsx`)

Context provider that manages authentication state across the application.

### Responsibilities:
- Manage user authentication state
- Provide login, signup, and logout functions
- Listen for auth state changes from Supabase

### Key Functions:
- `signIn()`: Authenticates a user with email and password
- `signUp()`: Creates a new user account
- `signOut()`: Logs out the current user

## Search Bar (`components/search-bar.tsx`)

Component for searching locations using Google Places API.

### Responsibilities:
- Provide search input for locations
- Display search results
- Handle location selection

### Key Functions:
- `handleSearch()`: Queries Google Places API for locations
- `selectLocation()`: Handles selection of a location from search results

## Header (`components/header.tsx`)

Navigation component displayed at the top of every page.

### Responsibilities:
- Provide navigation links
- Display user authentication state
- Provide access to user profile

## Profile Page (`app/profile/page.tsx`)

User profile page that displays saved locations and routes.

### Responsibilities:
- Display user information
- List user's saved locations and routes
- Provide management functions (delete, share)

### Key Functions:
- `fetchUserData()`: Retrieves user's locations and routes
- `deleteLocation()`: Removes a saved location
- `deleteRoute()`: Removes a saved route

\`\`\`

Let's add documentation for the coordinate formatting utilities:
