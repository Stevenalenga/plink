"use client"

import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { CustomMarker } from "./custom-marker"


interface LiveLocationProps {
  map: any | null
  isEnabled: boolean
  onLocationUpdate?: (position: { lat: number; lng: number }) => void
  navigationMode?: boolean
  targetPosition?: { lat: number; lng: number } | null
  onWaypointReached?: () => void
  bearingToTarget?: number
}

export function LiveLocation({ 
  map, 
  isEnabled, 
  onLocationUpdate,
  navigationMode = false,
  targetPosition = null,
  onWaypointReached,
  bearingToTarget = 0
}: LiveLocationProps) {
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)
  const { toast } = useToast()

  const handleLocationSuccess = useCallback(
    (position: GeolocationPosition) => {
      const newPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }

      setCurrentPosition(newPosition)
      setIsTracking(true)

      if (onLocationUpdate) {
        onLocationUpdate(newPosition)
      }

      // Center map on user location (only on first location update)
      if (map && !currentPosition) {
        map.panTo(newPosition)
        map.setZoom(15)
      }
    },
    [map, currentPosition, onLocationUpdate],
  )

  const handleLocationError = useCallback(
    (error: GeolocationPositionError) => {
      let errorMessage = "Unable to get your location"

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied by user"
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable"
          break
        case error.TIMEOUT:
          errorMessage = "Location request timed out"
          break
      }

      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive",
      })

      setIsTracking(false)
    },
    [toast],
  )

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      })
      return
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // Cache position for 1 minute
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(handleLocationSuccess, handleLocationError, options)

    // Start watching position
    const id = navigator.geolocation.watchPosition(handleLocationSuccess, handleLocationError, options)
    setWatchId(id)
  }, [handleLocationSuccess, handleLocationError, toast])

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsTracking(false)
    setCurrentPosition(null)
  }, [watchId])

  useEffect(() => {
    if (isEnabled && map && typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.SymbolPath) {
      startTracking()
    } else {
      stopTracking()
    }

    return () => {
      stopTracking()
    }
  }, [isEnabled, map])

  // Calculate distance between two points
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

  // Check if waypoint is reached in navigation mode
  useEffect(() => {
    if (navigationMode && currentPosition && targetPosition && onWaypointReached) {
      const distance = calculateDistance(
        currentPosition.lat,
        currentPosition.lng,
        targetPosition.lat,
        targetPosition.lng
      )

      // If within 50 meters of target, consider waypoint reached
      if (distance <= 50) {
        onWaypointReached()
      }
    }
  }, [navigationMode, currentPosition, targetPosition, onWaypointReached, calculateDistance])

  // Create custom icon for user location (smaller size)
  const userLocationIcon = typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.SymbolPath
    ? {
        path: navigationMode 
          ? window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW 
          : window.google.maps.SymbolPath.CIRCLE,
        fillColor: navigationMode ? "#3b82f6" : "#ef4444",
        fillOpacity: 0.9,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: navigationMode ? 8 : 6, // Reduced from 14/12 to 8/6
        rotation: navigationMode ? bearingToTarget : 0,
      }
    : undefined;

  if (!currentPosition || !isTracking || !userLocationIcon || !map) {
    return null
  }

  // Render the user's live location using the CustomMarker component (now draggable)
  return (
    <CustomMarker
      map={map}
      position={currentPosition}
      title="Your Location (Drag to adjust)"
      icon={userLocationIcon}
      draggable={true}
      animation={undefined} // Removed bounce animation for smoother dragging
      onClick={() => {
        toast({
          title: "Live Location",
          description: "Drag the marker to manually adjust your position",
        })
      }}
      onDragEnd={(newPosition: { lat: number; lng: number }) => {
        // Update position when dragged
        setCurrentPosition(newPosition)
        if (onLocationUpdate) {
          onLocationUpdate(newPosition)
        }
        toast({
          title: "Position Updated",
          description: `New location: ${newPosition.lat.toFixed(6)}, ${newPosition.lng.toFixed(6)}`,
        })
      }}
    />
  )
}
