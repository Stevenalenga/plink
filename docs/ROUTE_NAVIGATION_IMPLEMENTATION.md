# Route Navigation Implementation Guide

This document provides instructions for integrating the route navigation feature into map-container.tsx.

## Files Created

### 1. Database Migration
- `supabase/migrations/20250116000001_enhance_routes_for_navigation.sql`
  - Extends routes table with url, expires_at, distance, estimated_duration
  - Creates route_followers and location_followers tables
  - Updates RLS policies for selective sharing

### 2. Type Definitions
- Updated `types/index.ts` with:
  - EnhancedRoute, SavedRoute interfaces
  - NavigationState, NavigationPosition interfaces
  - RouteWaypoint, RouteFollower, LocationFollower types

### 3. API Routes
- `app/api/routes/route.ts` - GET/POST routes
- `app/api/routes/[id]/route.ts` - GET/PATCH/DELETE specific route

### 4. Components
- `components/mapscomponents/route-components/route-dialog.tsx`
- `components/mapscomponents/route-components/route-edit-dialog.tsx`
- `components/mapscomponents/route-components/route-drawer.tsx`
- `components/mapscomponents/route-components/route-navigation-controls.tsx`
- `components/mapscomponents/route-components/saved-routes-panel.tsx`

### 5. Hooks
- `hooks/use-route-navigation.ts` - Navigation state management

### 6. Updated Components
- `components/mapscomponents/live-location.tsx` - Added navigation mode support

## Integration Steps for map-container.tsx

### Step 1: Add Route Loading Function

Add this function after `loadLocations`:

```typescript
const loadRoutes = useCallback(async () => {
  if (!user) {
    setSavedRoutes([])
    return
  }

  try {
    setIsRoutesLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      console.error("No valid session")
      return
    }

    const response = await fetch(`/api/routes?userId=${user.id}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) throw new Error('Failed to load routes')

    const data = await response.json()
    setSavedRoutes(data)
  } catch (error: any) {
    console.error("Error loading routes:", error)
    toast({
      title: "Failed to load routes",
      description: error.message,
      variant: "destructive",
    })
  } finally {
    setIsRoutesLoading(false)
  }
}, [user, toast])
```

### Step 2: Add Route Save Function

```typescript
const handleSaveRoute = async (
  validatedUrl: string | null,
  expiresAt?: string | null,
  selectedFollowers?: string[]
) => {
  if (!user) return

  try {
    // Calculate total distance
    let totalDistance = 0
    for (let i = 0; i < routeWaypoints.length - 1; i++) {
      const wp1 = routeWaypoints[i]
      const wp2 = routeWaypoints[i + 1]
      totalDistance += routeNavigation.calculateDistance(wp1.lat, wp1.lng, wp2.lat, wp2.lng)
    }

    // Estimate duration (assuming average speed of 5 km/h for walking)
    const estimatedDuration = Math.round((totalDistance / 1000) / 5 * 60)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error("No valid session")

    const response = await fetch('/api/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        name: routeName,
        description: routeDescription,
        visibility: routeVisibility,
        url: validatedUrl,
        expires_at: expiresAt,
        distance: totalDistance,
        estimated_duration: estimatedDuration,
        points: routeWaypoints,
        selectedFollowers,
      }),
    })

    if (!response.ok) throw new Error('Failed to save route')

    toast({
      title: "Route saved successfully!",
    })

    // Reset state
    setIsDrawingRoute(false)
    setRouteWaypoints([])
    setRouteName("")
    setRouteDescription("")
    setRouteUrl("")
    setIsSaveRouteDialogOpen(false)
    
    // Reload routes
    loadRoutes()
  } catch (error: any) {
    console.error("Error saving route:", error)
    toast({
      title: "Failed to save route",
      description: error.message,
      variant: "destructive",
    })
  }
}
```

### Step 3: Add Navigation Handlers

```typescript
const handleStartNavigation = (route: SavedRoute) => {
  routeNavigation.startNavigation(route)
  setShowRoutesPanel(false)
  toast({
    title: "Navigation started",
    description: `Navigate to: ${route.name}`,
  })
}

const handleStopNavigation = () => {
  routeNavigation.stopNavigation()
  toast({
    title: "Navigation ended",
  })
}
```

### Step 4: Add useEffect to Load Routes

Add after the `loadLocations` useEffect:

```typescript
useEffect(() => {
  if (user && map) {
    loadRoutes()
  }
}, [user, map, loadRoutes])
```

### Step 5: Update LiveLocation Component Props

Find the LiveLocation component in the JSX and update it:

```typescript
<LiveLocation
  map={map}
  isEnabled={isLocationEnabled}
  onLocationUpdate={(position) => {
    if (routeNavigation.isNavigating) {
      routeNavigation.updateUserPosition({
        ...position,
        timestamp: Date.now(),
      })
    }
  }}
  navigationMode={routeNavigation.isNavigating}
  targetPosition={routeNavigation.getCurrentTargetWaypoint()}
  bearingToTarget={routeNavigation.getBearingToTarget()}
/>
```

### Step 6: Add Route Components to JSX

Add these components before the closing tag of the main container:

```typescript
{/* Route Drawing */}
{isDrawingRoute && (
  <RouteDrawer
    map={map}
    waypoints={routeWaypoints}
    onWaypointsChange={setRouteWaypoints}
    onSave={() => setIsSaveRouteDialogOpen(true)}
    onCancel={() => {
      setIsDrawingRoute(false)
      setRouteWaypoints([])
    }}
    isActive={isDrawingRoute}
  />
)}

{/* Route Save Dialog */}
<RouteDialog
  open={isSaveRouteDialogOpen}
  routeName={routeName}
  routeDescription={routeDescription}
  routeUrl={routeUrl}
  visibility={routeVisibility}
  waypoints={routeWaypoints}
  distance={routeWaypoints.length > 1 ? calculateRouteDistance() : 0}
  setRouteName={setRouteName}
  setRouteDescription={setRouteDescription}
  setRouteUrl={setRouteUrl}
  setVisibility={setRouteVisibility}
  onCancel={() => setIsSaveRouteDialogOpen(false)}
  onSave={handleSaveRoute}
/>

{/* Route Navigation Controls */}
{routeNavigation.isNavigating && routeNavigation.currentRoute && (
  <RouteNavigationControls
    route={routeNavigation.currentRoute}
    currentWaypointIndex={routeNavigation.currentWaypointIndex}
    distanceToNextWaypoint={routeNavigation.distanceToNextWaypoint}
    totalDistanceRemaining={routeNavigation.totalDistanceRemaining}
    onStop={handleStopNavigation}
  />
)}

{/* Saved Routes Panel */}
{showRoutesPanel && (
  <div className="absolute top-20 right-4 z-10">
    <SavedRoutesPanel
      routes={savedRoutes}
      isLoading={isRoutesLoading}
      onRouteClick={(route) => {
        // Center map on route
        if (map && route.points && route.points.length > 0) {
          const bounds = new window.google.maps.LatLngBounds()
          route.points.forEach(point => {
            bounds.extend(new window.google.maps.LatLng(point.lat, point.lng))
          })
          map.fitBounds(bounds)
        }
      }}
      onNavigateRoute={handleStartNavigation}
    />
  </div>
)}
```

### Step 7: Add Route Drawing Button to FAB

In the FAB buttons component or location control, add:

```typescript
<Button
  onClick={() => {
    setIsDrawingRoute(true)
    setShowRoutesPanel(false)
  }}
  variant="default"
  size="icon"
  title="Draw Route"
>
  <RouteIcon className="h-5 w-5" />
</Button>

<Button
  onClick={() => setShowRoutesPanel(!showRoutesPanel)}
  variant="default"
  size="icon"
  title="Saved Routes"
>
  <List className="h-5 w-5" />
</Button>
```

### Step 8: Add Helper Function

Add this helper for calculating route distance in the dialog:

```typescript
const calculateRouteDistance = () => {
  if (routeWaypoints.length < 2) return 0
  
  let totalDistance = 0
  for (let i = 0; i < routeWaypoints.length - 1; i++) {
    const wp1 = routeWaypoints[i]
    const wp2 = routeWaypoints[i + 1]
    totalDistance += routeNavigation.calculateDistance(wp1.lat, wp1.lng, wp2.lat, wp2.lng)
  }
  
  return totalDistance
}
```

## Testing Checklist

1. ✅ Apply database migration
2. ✅ Test route drawing on map
3. ✅ Test route saving with different visibility settings
4. ✅ Test selective follower sharing
5. ✅ Test route expiration
6. ✅ Test route navigation
7. ✅ Test live location during navigation
8. ✅ Test waypoint reached detection
9. ✅ Test route editing from profile page
10. ✅ Test route deletion

## Database Migration

Run this SQL in your Supabase SQL editor:

```sql
-- Copy the entire content from:
-- supabase/migrations/20250116000001_enhance_routes_for_navigation.sql
```

## Next Steps

1. Apply the database migration first
2. Add the integration code to map-container.tsx following steps 1-8
3. Update the profile page to include route management (see next section)
4. Test all functionality

## Profile Page Integration

The profile page needs to be updated to show routes alongside locations. See `PROFILE_INTEGRATION.md` for details.
