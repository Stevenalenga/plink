"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RouteWaypoint } from "@/types"
import { MapPin, Trash2, Undo, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RouteDrawerProps {
  map: google.maps.Map | null
  waypoints: RouteWaypoint[]
  onWaypointsChange: (waypoints: RouteWaypoint[]) => void
  onSave: () => void
  onCancel: () => void
  isActive: boolean
}

export function RouteDrawer({
  map,
  waypoints,
  onWaypointsChange,
  onSave,
  onCancel,
  isActive,
}: RouteDrawerProps) {
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const { toast } = useToast()

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }, [])

  // Calculate total distance of the route
  const calculateTotalDistance = useCallback((): number => {
    if (waypoints.length < 2) return 0

    let totalDistance = 0
    for (let i = 0; i < waypoints.length - 1; i++) {
      const wp1 = waypoints[i]
      const wp2 = waypoints[i + 1]
      totalDistance += calculateDistance(wp1.lat, wp1.lng, wp2.lat, wp2.lng)
    }

    return totalDistance
  }, [waypoints, calculateDistance])

  // Add a waypoint
  const addWaypoint = useCallback(
    (lat: number, lng: number) => {
      const newWaypoint: RouteWaypoint = {
        lat,
        lng,
        order: waypoints.length,
      }
      onWaypointsChange([...waypoints, newWaypoint])
    },
    [waypoints, onWaypointsChange]
  )

  // Remove last waypoint
  const removeLastWaypoint = useCallback(() => {
    if (waypoints.length > 0) {
      onWaypointsChange(waypoints.slice(0, -1))
    }
  }, [waypoints, onWaypointsChange])

  // Clear all waypoints
  const clearWaypoints = useCallback(() => {
    onWaypointsChange([])
  }, [onWaypointsChange])

  // Handle map click to add waypoint
  useEffect(() => {
    if (!map || !isActive) return

    const clickListener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        addWaypoint(e.latLng.lat(), e.latLng.lng())
      }
    })

    return () => {
      google.maps.event.removeListener(clickListener)
    }
  }, [map, isActive, addWaypoint])

  // Update polyline and markers when waypoints change
  useEffect(() => {
    if (!map || !window.google) return

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null))
    setMarkers([])

    // Clear existing polyline
    if (polyline) {
      polyline.setMap(null)
    }

    if (waypoints.length === 0) {
      setPolyline(null)
      return
    }

    // Create new markers
    const newMarkers = waypoints.map((waypoint, index) => {
      const marker = new google.maps.Marker({
        position: { lat: waypoint.lat, lng: waypoint.lng },
        map,
        label: {
          text: (index + 1).toString(),
          color: "white",
          fontSize: "12px",
          fontWeight: "bold",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: index === 0 ? "#22c55e" : index === waypoints.length - 1 ? "#ef4444" : "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 12,
        },
        draggable: true,
      })

      // Handle marker drag
      marker.addListener("dragend", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const updatedWaypoints = [...waypoints]
          updatedWaypoints[index] = {
            ...updatedWaypoints[index],
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          }
          onWaypointsChange(updatedWaypoints)
        }
      })

      return marker
    })

    setMarkers(newMarkers)

    // Create polyline if there are at least 2 waypoints
    if (waypoints.length >= 2) {
      const path = waypoints.map((wp) => ({ lat: wp.lat, lng: wp.lng }))
      const newPolyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map,
      })
      setPolyline(newPolyline)
    }

    return () => {
      newMarkers.forEach((marker) => marker.setMap(null))
    }
  }, [map, waypoints])

  // Format distance for display
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(2)}km`
  }

  if (!isActive) return null

  const totalDistance = calculateTotalDistance()

  return (
    <Card className="absolute top-20 left-4 z-10 p-4 shadow-lg bg-background/95 backdrop-blur-sm w-80">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Drawing Route
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          Click on the map to add waypoints
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg">
          <div>
            <div className="text-xs text-muted-foreground">Waypoints</div>
            <div className="text-lg font-semibold">{waypoints.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Distance</div>
            <div className="text-lg font-semibold">{formatDistance(totalDistance)}</div>
          </div>
        </div>

        {waypoints.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Waypoints:</div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {waypoints.map((wp, index) => (
                <div
                  key={index}
                  className="text-xs p-2 bg-muted/30 rounded flex items-center justify-between"
                >
                  <span>
                    {index + 1}. {wp.name || `${wp.lat.toFixed(5)}, ${wp.lng.toFixed(5)}`}
                  </span>
                  {index === 0 && (
                    <span className="text-green-500 text-xs">Start</span>
                  )}
                  {index === waypoints.length - 1 && index > 0 && (
                    <span className="text-red-500 text-xs">End</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={removeLastWaypoint}
            disabled={waypoints.length === 0}
            className="flex-1"
          >
            <Undo className="h-4 w-4 mr-1" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearWaypoints}
            disabled={waypoints.length === 0}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (waypoints.length < 2) {
                toast({
                  title: "Need more waypoints",
                  description: "Add at least 2 waypoints to save the route",
                  variant: "destructive",
                })
                return
              }
              onSave()
            }}
            disabled={waypoints.length < 2}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-1" />
            Save Route
          </Button>
        </div>
      </div>
    </Card>
  )
}
