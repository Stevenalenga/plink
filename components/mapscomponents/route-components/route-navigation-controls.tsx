"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { SavedRoute } from "@/types"
import { Navigation, X, MapPin, ArrowRight, Route as RouteIcon } from "lucide-react"

interface RouteNavigationControlsProps {
  route: SavedRoute
  currentWaypointIndex: number
  distanceToNextWaypoint: number
  totalDistanceRemaining: number
  onStop: () => void
  onRecalculate?: () => void
}

export function RouteNavigationControls({
  route,
  currentWaypointIndex,
  distanceToNextWaypoint,
  totalDistanceRemaining,
  onStop,
  onRecalculate,
}: RouteNavigationControlsProps) {
  const totalWaypoints = route.points?.length || 0
  const progress = totalWaypoints > 0 ? ((currentWaypointIndex + 1) / totalWaypoints) * 100 : 0

  // Format distance for display
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(2)}km`
  }

  // Get current and next waypoint
  const currentWaypoint = route.points?.[currentWaypointIndex]
  const nextWaypoint = route.points?.[currentWaypointIndex + 1]

  // Check if route is completed
  const isCompleted = currentWaypointIndex >= totalWaypoints - 1

  return (
    <Card className="absolute top-4 left-4 z-10 p-4 shadow-lg bg-background/95 backdrop-blur-sm w-96">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Navigating</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onStop}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Route Name */}
        <div>
          <h4 className="font-medium text-lg">{route.name}</h4>
          {route.description && (
            <p className="text-sm text-muted-foreground">{route.description}</p>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {currentWaypointIndex + 1} / {totalWaypoints}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {!isCompleted ? (
          <>
            {/* Current Step */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Current Waypoint</span>
              </div>
              <p className="text-lg font-semibold">
                {currentWaypoint?.name || `Point ${currentWaypointIndex + 1}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentWaypoint?.lat.toFixed(5)}, {currentWaypoint?.lng.toFixed(5)}
              </p>
            </div>

            {/* Next Step */}
            {nextWaypoint && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Next Waypoint</span>
                </div>
                <p className="font-medium">
                  {nextWaypoint.name || `Point ${currentWaypointIndex + 2}`}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">Distance</span>
                  <span className="text-sm font-semibold text-blue-500">
                    {formatDistance(distanceToNextWaypoint)}
                  </span>
                </div>
              </div>
            )}

            {/* Distance Remaining */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
              <div>
                <div className="text-xs text-muted-foreground">To Next</div>
                <div className="text-lg font-semibold">
                  {formatDistance(distanceToNextWaypoint)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Remaining</div>
                <div className="text-lg font-semibold">
                  {formatDistance(totalDistanceRemaining)}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Route Completed */
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h4 className="font-semibold text-lg text-green-700 dark:text-green-400">
              Route Completed!
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              You've reached all waypoints
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {onRecalculate && !isCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRecalculate}
              className="flex-1"
            >
              <RouteIcon className="h-4 w-4 mr-1" />
              Recalculate
            </Button>
          )}
          <Button
            variant={isCompleted ? "default" : "outline"}
            size="sm"
            onClick={onStop}
            className="flex-1"
          >
            {isCompleted ? "Finish" : "Exit Navigation"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
