import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Route as RouteIcon, MapPin, Clock, Eye, EyeOff, Users } from "lucide-react"
import { SavedRoute } from "@/types"
import React from "react"

interface SavedRoutesPanelProps {
  routes: SavedRoute[]
  isLoading: boolean
  onRouteClick?: (route: SavedRoute) => void
  onNavigateRoute?: (route: SavedRoute) => void
}

export function SavedRoutesPanel({ 
  routes, 
  isLoading,
  onRouteClick,
  onNavigateRoute 
}: SavedRoutesPanelProps) {
  // Format distance for display
  const formatDistance = (meters?: number | null) => {
    if (!meters) return "N/A"
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(2)}km`
  }

  // Format duration for display
  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return "N/A"
    if (minutes < 60) return `${Math.round(minutes)} min`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  // Get visibility icon
  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Eye className="h-3 w-3 text-green-500" />
      case 'followers':
        return <Users className="h-3 w-3 text-yellow-500" />
      case 'private':
        return <EyeOff className="h-3 w-3 text-slate-500" />
      default:
        return null
    }
  }

  return (
    <Card className="w-80 shadow-lg max-h-[600px] flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center">
          <RouteIcon className="h-4 w-4 mr-2" />
          Saved Routes
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading routes...</p>
        ) : routes.length === 0 ? (
          <div className="text-center py-8">
            <RouteIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No saved routes yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Draw Route" to create your first route
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {routes.map((route) => (
              <div
                key={route.id}
                className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => onRouteClick?.(route)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{route.name}</h4>
                    {route.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {route.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-2 flex items-center gap-1">
                    {getVisibilityIcon(route.visibility)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>{route.points?.length || 0} pts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RouteIcon className="h-3 w-3 text-muted-foreground" />
                    <span>{formatDistance(route.distance)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{formatDuration(route.estimated_duration)}</span>
                  </div>
                </div>

                {onNavigateRoute && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation()
                      onNavigateRoute(route)
                    }}
                  >
                    Navigate
                  </Button>
                )}

                {route.expires_at && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Expires: {new Date(route.expires_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
