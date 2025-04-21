# API Reference

## Supabase Client Functions

### Authentication

\`\`\`typescript
// Sign up a new user
const signUp = async (email: string, password: string, name: string) => {
  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  })
  
  // Create profile record...
}

// Sign in an existing user
const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  })
}

// Sign out the current user
const signOut = async () => {
  const { error } = await supabase.auth.signOut()
}
\`\`\`

### Locations

\`\`\`typescript
// Get user's private locations
const getPrivateLocations = async (userId: string) => {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("user_id", userId)
    .eq("is_public", false)
}

// Get all public locations
const getPublicLocations = async () => {
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("is_public", true)
}

// Save a new location
const saveLocation = async (location: NewLocation) => {
  const { data, error } = await supabase
    .from("locations")
    .insert([location])
    .select()
}

// Save a location from coordinates
const saveLocationFromCoordinates = async (locationData: {
  lat: number
  lng: number
  name: string
  isPublic: boolean
  user_id: string
}) => {
  const { data, error } = await supabase
    .from("locations")
    .insert([
      {
        user_id: locationData.user_id,
        name: locationData.name,
        lat: locationData.lat,
        lng: locationData.lng,
        is_public: locationData.isPublic,
      },
    ])
    .select()
}

// Delete a location
const deleteLocation = async (id: string) => {
  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", id)
}
\`\`\`

### Routes

\`\`\`typescript
// Get user's routes
const getUserRoutes = async (userId: string) => {
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("user_id", userId)
}

// Get route points
const getRoutePoints = async (routeId: string) => {
  const { data, error } = await supabase
    .from("route_points")
    .select("*")
    .eq("route_id", routeId)
    .order("order_index", { ascending: true })
}

// Delete a route and its points
const deleteRoute = async (id: string) => {
  // Delete route points first
  const { error: pointsError } = await supabase
    .from("route_points")
    .delete()
    .eq("route_id", id)
    
  // Then delete the route
  const { error } = await supabase
    .from("routes")
    .delete()
    .eq("id", id)
}
\`\`\`

## Google Maps API Functions

\`\`\`typescript
// Initialize map
const initializeMap = async () => {
  const loader = new Loader({
    apiKey: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    version: "weekly",
    libraries: ["places"],
  })
  
  const google = await loader.load()
  const googleMap = new google.maps.Map(mapRef.current, {
    center: { lat: 40.7128, lng: -74.006 },
    zoom: 12,
    // Options...
  })
}

// Add marker to map
const addMarkerToMap = (location) => {
  const marker = new google.maps.Marker({
    position: { lat: location.lat, lng: location.lng },
    map,
    title: location.name,
    icon: {
      // Custom icon options...
    },
  })
  
  // Add info window with formatted coordinates
  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div>
        <strong>${location.name}</strong><br/>
        ${formatLocation(location.lat, location.lng)}<br/>
        <span style="color: ${location.is_public ? "#22c55e" : "#64748b"}">
          ${location.is_public ? "Public" : "Private"}
        </span>
      </div>
    `,
  })
}

// Search for places
const searchPlaces = (query: string) => {
  placesService.findPlaceFromQuery(
    {
      query,
      fields: ["name", "geometry", "formatted_address"],
    },
    (results, status) => {
      // Handle results...
    }
  )
}
\`\`\`

## Coordinate Formatting Functions

\`\`\`typescript
// Format a single coordinate to DMS
const formatCoordinate = (coordinate: number, isLatitude: boolean): string => {
  const absolute = Math.abs(coordinate)
  const degrees = Math.floor(absolute)
  const minutesNotTruncated = (absolute - degrees) * 60
  const minutes = Math.floor(minutesNotTruncated)
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60)

  const direction = isLatitude ? (coordinate >= 0 ? "N" : "S") : coordinate >= 0 ? "E" : "W"

  return `${degrees}° ${minutes}' ${seconds}" ${direction}`
}

// Format a complete location with lat/lng
const formatLocation = (lat: number, lng: number): string => {
  return `${formatCoordinate(lat, true)}, ${formatCoordinate(lng, false)}`
}
\`\`\`

\`\`\`

Finally, let's add a new section specifically about the coordinate input feature:
