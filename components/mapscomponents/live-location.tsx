"use client"

import { useEffect, useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { CustomMarker } from "./custom-marker"


interface LiveLocationProps {
  map: any | null
  isEnabled: boolean
  onLocationUpdate?: (position: { lat: number; lng: number }) => void
}

export function LiveLocation({ map, isEnabled, onLocationUpdate }: LiveLocationProps) {
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

  // Create custom icon for user location
  const userLocationIcon = typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.SymbolPath
    ? {
        path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: "#ef4444", // Changed to red
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
        scale: 12,
      }
    : undefined;

  if (!currentPosition || !isTracking || !userLocationIcon || !map) {
    return null
  }

  // Render the user's live location using the CustomMarker component
  return (
    <CustomMarker
      map={map}
      position={currentPosition}
      title="Your Location"
      icon={userLocationIcon}
      animation={window.google && window.google.maps ? window.google.maps.Animation.BOUNCE : undefined}
    />
  )
}
