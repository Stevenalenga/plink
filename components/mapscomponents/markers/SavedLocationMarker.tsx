"use client"

import { useEffect, useRef } from "react"

type Props = {
  map: any | null
  id: string
  position: { lat: number; lng: number }
  title: string
  onClick?: () => void
}

export default function SavedLocationMarker({ map, id, position, title, onClick }: Props) {
  const markerRef = useRef<any | null>(null)
  const infoWindowRef = useRef<any | null>(null)

  // Small colored dot icon; green if public would be handled by parent via different component/props if needed
  const buildIcon = () => ({
    path: (window as any).google.maps.SymbolPath.CIRCLE,
    fillColor: "#2563eb",
    fillOpacity: 1,
    strokeWeight: 2,
    strokeColor: "#ffffff",
    scale: 7,
  })

  useEffect(() => {
    if (!map || !(window as any).google) {
      if (markerRef.current) {
        markerRef.current.setMap(null)
        markerRef.current = null
      }
      return
    }

    if (!markerRef.current) {
      markerRef.current = new (window as any).google.maps.Marker({
        position,
        map,
        title,
        icon: buildIcon(),
      })
    } else {
      markerRef.current.setPosition(position)
      markerRef.current.setTitle(title)
      if (markerRef.current.getMap() !== map) {
        markerRef.current.setMap(map)
      }
    }

    // Click handling
    const listener = markerRef.current.addListener("click", () => {
      if (onClick) onClick()
    })

    return () => {
      if (listener) listener.remove()
      if (markerRef.current) {
        markerRef.current.setMap(null)
        markerRef.current = null
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close()
        infoWindowRef.current = null
      }
    }
  }, [map, position.lat, position.lng, title])

  return null
}