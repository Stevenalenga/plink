"use client"

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react"

export type SearchMarkerOptions = {
  color: string
  size: number
}

export type SearchMarkerHandle = {
  updateIcon: (opts: Partial<SearchMarkerOptions>) => void
  setPosition: (pos: { lat: number; lng: number }) => void
  getMarker: () => any | null
  remove: () => void
}

type Props = {
  map: any | null
  position: { lat: number; lng: number } | null
  options: SearchMarkerOptions
}

const SearchMarker = forwardRef<SearchMarkerHandle, Props>(({ map, position, options }, ref) => {
  const markerRef = useRef<any | null>(null)
  const currentOptsRef = useRef<SearchMarkerOptions>(options)

  // Helper to build the icon from current options
  const buildIcon = (opts: SearchMarkerOptions) => ({
    path: (window as any).google.maps.SymbolPath.CIRCLE,
    fillColor: opts.color,
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#ffffff",
    scale: opts.size,
  })

  useEffect(() => {
    currentOptsRef.current = options
  }, [options.color, options.size])

  // Create / update marker when map or position changes
  useEffect(() => {
    if (!map || !position || !(window as any).google) {
      // Remove if cannot render
      if (markerRef.current) {
        markerRef.current.setMap(null)
        markerRef.current = null
      }
      return
    }

    if (!markerRef.current) {
      markerRef.current = new (window as any).google.maps.Marker({
        map,
        position,
        animation: (window as any).google.maps.Animation.DROP,
        icon: buildIcon(currentOptsRef.current),
      })
    } else {
      markerRef.current.setPosition(position)
      markerRef.current.setIcon(buildIcon(currentOptsRef.current))
      if (markerRef.current.getMap() !== map) {
        markerRef.current.setMap(map)
      }
    }

    return () => {
      // Do not auto-remove here; allow parent to control lifecycle.
      // If needed, uncomment to cleanup on unmount:
      // if (markerRef.current) {
      //   markerRef.current.setMap(null)
      //   markerRef.current = null
      // }
    }
  }, [map, position])

  // Expose imperative API
  useImperativeHandle(ref, () => ({
    updateIcon: (opts: Partial<SearchMarkerOptions>) => {
      const merged: SearchMarkerOptions = {
        color: opts.color ?? currentOptsRef.current.color,
        size: typeof opts.size === "number" ? opts.size : currentOptsRef.current.size,
      }
      currentOptsRef.current = merged
      if (markerRef.current && (window as any).google) {
        markerRef.current.setIcon(buildIcon(merged))
      }
    },
    setPosition: (pos: { lat: number; lng: number }) => {
      if (markerRef.current) markerRef.current.setPosition(pos)
    },
    getMarker: () => markerRef.current,
    remove: () => {
      if (markerRef.current) {
        markerRef.current.setMap(null)
        markerRef.current = null
      }
    },
  }))

  return null
})

SearchMarker.displayName = "SearchMarker"

export default SearchMarker