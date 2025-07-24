"use client"

import { useEffect, useRef } from "react"


export interface MarkerProps {
  map: google.maps.Map | null
  position: { lat: number; lng: number }
  title?: string
  icon?: google.maps.Icon | google.maps.Symbol | string
  animation?: google.maps.Animation
  onClick?: () => void
  onMount?: (marker: google.maps.Marker) => void
  onUnmount?: (marker: google.maps.Marker) => void
}

export function CustomMarker({ map, position, title, icon, animation, onClick, onMount, onUnmount }: MarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null)

  // Create marker only when map is ready
  useEffect(() => {
    if (!map) return

    const marker = new google.maps.Marker({
      position,
      map,
      title,
      icon,
      animation,
    })

    markerRef.current = marker

    if (onClick) {
      marker.addListener("click", onClick)
    }

    if (onMount) {
      onMount(marker)
    }

    return () => {
      if (onUnmount) {
        onUnmount(marker)
      }
      marker.setMap(null)
      markerRef.current = null
    }
    // Only recreate marker if map changes
  }, [map])

  // Update marker position
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setPosition(position)
    }
  }, [position])

  // Update marker title
  useEffect(() => {
    if (markerRef.current && title) {
      markerRef.current.setTitle(title)
    }
  }, [title])

  // Update marker icon
  useEffect(() => {
    if (markerRef.current && icon) {
      markerRef.current.setIcon(icon)
    }
  }, [icon])

  // Update marker animation
  useEffect(() => {
    if (markerRef.current && animation) {
      markerRef.current.setAnimation(animation)
    }
  }, [animation])

  return null // This component doesn't render anything visible
}
