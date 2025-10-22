# Profile Page Route Integration Guide

This guide shows how to add route management to the profile page.

## Overview

The profile page already has a tab structure for locations. We'll add a "Routes" tab with similar functionality:
- List all user's routes
- Edit route details
- Delete routes
- Navigate routes
- View routes on map

## Implementation

### Step 1: Import Route Components

Add these imports at the top of `app/(routes)/profile/page.tsx`:

```typescript
import { RouteEditDialog } from "@/components/mapscomponents/route-components/route-edit-dialog"
import { SavedRoute } from "@/types"
import { Route as RouteIcon, Navigation, MapPin, Clock, Eye, EyeOff, Users } from "lucide-react"
```

### Step 2: Add Route State

Add these state variables after the existing location states:

```typescript
const [routes, setRoutes] = useState<SavedRoute[]>([])
const [editingRoute, setEditingRoute] = useState<SavedRoute | null>(null)
const [isRouteEditDialogOpen, setIsRouteEditDialogOpen] = useState(false)
```

### Step 3: Add Route Loading

Add this function after `fetchUserData`:

```typescript
const fetchRoutes = async () => {
  if (!user) return
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    const response = await fetch(`/api/routes?userId=${user.id}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) throw new Error('Failed to fetch routes')

    const data = await response.json()
    setRoutes(data)
  } catch (error: any) {
    console.error('Error fetching routes:', error)
    toast({
      title: "Failed to load routes",
      description: error.message,
      variant: "destructive",
    })
  }
}
```

### Step 4: Add Route Delete Function

```typescript
const deleteRoute = async (id: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error("No valid session")

    const response = await fetch(`/api/routes/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) throw new Error('Failed to delete route')

    setRoutes(routes.filter(r => r.id !== id))
    toast({
      title: "Route deleted successfully",
    })
  } catch (error: any) {
    console.error('Error deleting route:', error)
    toast({
      title: "Failed to delete route",
      description: error.message,
      variant: "destructive",
    })
  }
}
```

### Step 5: Add Route Update Function

```typescript
const updateRoute = async (routeId: string, updates: {
  name: string
  description?: string
  url?: string
  visibility: 'public' | 'followers' | 'private'
  expires_at?: string | null
  selectedFollowers?: string[]
}) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error("No valid session")

    const response = await fetch(`/api/routes/${routeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) throw new Error('Failed to update route')

    const updatedRoute = await response.json()
    setRoutes(routes.map(r => r.id === routeId ? updatedRoute : r))
    
    toast({
      title: "Route updated successfully",
    })
  } catch (error: any) {
    console.error('Error updating route:', error)
    toast({
      title: "Failed to update route",
      description: error.message,
      variant: "destructive",
    })
  }
}

const handleEditRoute = (route: SavedRoute) => {
  setEditingRoute(route)
  setIsRouteEditDialogOpen(true)
}

const handleSaveRouteEdit = (updates: {
  name: string
  description?: string
  url?: string
  visibility: 'public' | 'followers' | 'private'
  expires_at?: string | null
  selectedFollowers?: string[]
}) => {
  if (editingRoute) {
    updateRoute(editingRoute.id, updates)
  }
  setIsRouteEditDialogOpen(false)
  setEditingRoute(null)
}
```

### Step 6: Update useEffect to Load Routes

In the existing `fetchUserData` useEffect, add:

```typescript
await fetchRoutes()
```

### Step 7: Add Routes Tab to JSX

Add a new Tab after the Locations tab:

```typescript
<TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="overview">Overview</TabsTrigger>
  <TabsTrigger value="locations">Locations</TabsTrigger>
  <TabsTrigger value="routes">Routes</TabsTrigger>
</TabsList>
```

### Step 8: Add Routes Tab Content

Add this after the Locations TabsContent:

```typescript
<TabsContent value="routes" className="space-y-4">
  <Card>
    <CardHeader>
      <CardTitle>Saved Routes</CardTitle>
      <CardDescription>
        Manage your saved routes and navigation paths
      </CardDescription>
    </CardHeader>
    <CardContent>
      {isDataLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading routes...</div>
      ) : routes.length === 0 ? (
        <div className="text-center py-12">
          <RouteIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No saved routes yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Go to the map and draw your first route!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map(route => (
            <Card key={route.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{route.name}</h3>
                      {route.visibility === 'public' && (
                        <Eye className="h-4 w-4 text-green-500" />
                      )}
                      {route.visibility === 'followers' && (
                        <Users className="h-4 w-4 text-yellow-500" />
                      )}
                      {route.visibility === 'private' && (
                        <EyeOff className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                    {route.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {route.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Waypoints</div>
                      <div className="font-semibold">{route.points?.length || 0}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RouteIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Distance</div>
                      <div className="font-semibold">
                        {route.distance
                          ? route.distance < 1000
                            ? `${Math.round(route.distance)}m`
                            : `${(route.distance / 1000).toFixed(2)}km`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Duration</div>
                      <div className="font-semibold">
                        {route.estimated_duration
                          ? route.estimated_duration < 60
                            ? `${Math.round(route.estimated_duration)} min`
                            : `${Math.floor(route.estimated_duration / 60)}h ${Math.round(route.estimated_duration % 60)}m`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {route.url && (
                  <div className="mb-3">
                    <a
                      href={route.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                    >
                      <LinkIcon className="h-3 w-3" />
                      {route.url}
                    </a>
                  </div>
                )}

                {route.expires_at && (
                  <div className="mb-3 text-sm text-amber-600 dark:text-amber-400">
                    Expires: {new Date(route.expires_at).toLocaleString()}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      router.push(`/?routeId=${route.id}`)
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    View on Map
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      router.push(`/?routeId=${route.id}&navigate=true`)
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Navigate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRoute(route)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete route "${route.name}"?`)) {
                        deleteRoute(route.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  Created: {new Date(route.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>

{/* Route Edit Dialog */}
<RouteEditDialog
  isOpen={isRouteEditDialogOpen}
  route={editingRoute}
  onClose={() => {
    setIsRouteEditDialogOpen(false)
    setEditingRoute(null)
  }}
  onSave={handleSaveRouteEdit}
/>
```

## Notes

1. The profile page now supports both locations and routes
2. Routes can be viewed on the map by clicking "View on Map"
3. Routes can be navigated by clicking "Navigate"
4. The routeId parameter in the URL allows the map to load and display/navigate specific routes
5. All route operations (edit, delete) work the same way as locations

## Testing

1. Create a route from the map
2. Go to profile page
3. Verify route appears in Routes tab
4. Test editing route details
5. Test deleting a route
6. Test "View on Map" button
7. Test "Navigate" button
