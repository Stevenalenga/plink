"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { NEXT_PUBLIC_GOOGLE_MAPS_API_KEY } from "@/app/env"
import { useRouter, useSearchParams } from "next/navigation"
import { formatLocation } from "@/lib/format-coordinates"

import { CustomMarker } from "./custom-marker"
import { LiveLocation } from "./live-location"
import { LocationControl } from "./location-control.tsx"

type Location = {
  id: string
  name: string
  lat: number
  lng: number
  is_public: boolean
  user_id: string
}

// Mock route data for demonstration
const mockRoutes = {
  "1": {
    id: "1",
    name: "Central Park Loop",
    points: [
      { lat: 40.7812, lng: -73.9665 },
      { lat: 40.7682, lng: -73.9719 },
      { lat: 40.7642, lng: -73.9546 },
      { lat: 40.7744, lng: -73.953 },
    ],
  },
  "2": {
    id: "2",
    name: "Brooklyn Bridge Walk",
    points: [
      { lat: 40.7127, lng: -74.0134 },
      { lat: 40.7061, lng: -73.9969 },
    ],
  },
  "3": {
    id: "3",
    name: "High Line Stroll",
    points: [
      { lat: 40.748, lng: -74.0048 },
      { lat: 40.7465, lng: -74.0063 },
      { lat: 40.742, lng: -74.008 },
      { lat: 40.74, lng: -74.0094 },
      { lat: 40.7395, lng: -74.0076 },
    ],
  },
}

// Function to load Google Maps script
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      resolve()
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve())
      existingScript.addEventListener("error", reject)
      return
    }

    // Create and load the script
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true

    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Google Maps script"))

    document.head.appendChild(script)
  })
}

export function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [locationName, setLocationName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLocationEnabled, setIsLocationEnabled] = useState(false)
  const { user, isAuthenticated } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Use refs for objects that need to persist between renders but don't affect rendering
  const infoWindows = useRef<Map<string, google.maps.InfoWindow>>(new Map())
  const tempMarkerRef = useRef<google.maps.Marker | null>(null)
  const routePolylineRef = useRef<google.maps.Polyline | null>(null)
  const routeMarkersRef = useRef<google.maps.Marker[]>([])
  const [searchInput, setSearchInput] = useState("")
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const placesService = useRef<google.maps.places.PlacesService | null>(null)

  // Initialize map only once
  useEffect(() => {
    if (!NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      toast({
        title: "API Key Missing",
        description: "Google Maps API key is not configured",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    let googleMap: google.maps.Map | null = null

    const initializeMap = async () => {
      if (!mapRef.current) {
        console.error("mapRef is not attached to a DOM element.")
        return
      }

      try {
        // Load Google Maps script first
        await loadGoogleMapsScript(NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)

        // Now we can safely use google.maps
        googleMap = new google.maps.Map(mapRef.current, {
          center: { lat: 0, lng: 0 }, // Default to center of the world
          zoom: 3, // Zoom out to show more of the world
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        })

        setMap(googleMap)
        setIsLoading(false)

        placesService.current = new google.maps.places.PlacesService(googleMap)
        autocompleteService.current = new google.maps.places.AutocompleteService()

        // Add click listener to map
        googleMap.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return
          if (isAuthenticated) {
            setSelectedLocation({
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            })
          } else {
            toast({
              title: "Login required",
              description: "Please login to save locations",
              variant: "destructive",
            })
          }
        })
      } catch (error) {
        console.error("Error loading Google Maps:", error)
        toast({
          title: "Error",
          description: "Failed to load Google Maps",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    initializeMap()

    // Cleanup function
    return () => {
      // Clear all info windows
      infoWindows.current.forEach((window) => window.close())
      infoWindows.current.clear()
    }
  }, [isAuthenticated, toast])

  // Function to create a temporary marker when clicking on the map
  const createTempMarker = useCallback(
    (position: google.maps.LatLngLiteral) => {
      if (!map) return

      // Remove previous temp marker if it exists
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setMap(null)
      }

      // Create new temp marker
      tempMarkerRef.current = new google.maps.Marker({
        position,
        map,
        animation: google.maps.Animation.DROP,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#3b82f6", // Blue color for temp marker
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
          scale: 10,
        },
      })
    },
    [map],
  )

  // Function to display a route on the map
  const displayRoute = useCallback(
    (routeId: string) => {
      if (!map) return

      // Clear previous route if any
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null)
      }

      // Clear previous route markers
      routeMarkersRef.current.forEach((marker) => marker.setMap(null))
      routeMarkersRef.current = []

      // Get route data
      const route = mockRoutes[routeId as keyof typeof mockRoutes]
      if (!route) {
        toast({
          title: "Route not found",
          description: `Could not find route with ID ${routeId}`,
          variant: "destructive",
        })
        return
      }

      // Create path for polyline
      const path = route.points.map((point) => ({ lat: point.lat, lng: point.lng }))

      // Create polyline
      routePolylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#3b82f6",
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map,
      })

      // Add markers for start and end points
      const startMarker = new google.maps.Marker({
        position: path[0],
        map,
        title: "Start",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#22c55e", // Green for start
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
          scale: 8,
        },
      })

      const endMarker = new google.maps.Marker({
        position: path[path.length - 1],
        map,
        title: "End",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#ef4444", // Red for end
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
          scale: 8,
        },
      })

      routeMarkersRef.current.push(startMarker, endMarker)

      // Add waypoint markers
      for (let i = 1; i < path.length - 1; i++) {
        const waypointMarker = new google.maps.Marker({
          position: path[i],
          map,
          title: `Waypoint ${i}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#f59e0b", // Amber for waypoints
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
            scale: 6,
          },
        })
        routeMarkersRef.current.push(waypointMarker)
      }

      // Fit map to route bounds
      const bounds = new google.maps.LatLngBounds()
      path.forEach((point) => bounds.extend(point))
      map.fitBounds(bounds)

      // Show route info
      toast({
        title: `Route: ${route.name}`,
        description: `Displaying route with ${path.length} points`,
      })
    },
    [map, toast],
  )

  const handlePlaceSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current || !map) return

    const request = {
      placeId: prediction.place_id,
      fields: ["geometry", "name"],
    }

    placesService.current.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        }
        map.panTo(location)
        map.setZoom(15)
        setSearchInput("")
        setSuggestions([])
      }
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchInput(value)

    if (!value.trim() || !autocompleteService.current) {
      setSuggestions([])
      return
    }

    // Add a small delay to avoid too many API calls
    const timeoutId = setTimeout(() => {
      const request = {
        input: value,
        types: ["geocode", "establishment"],
        //componentRestrictions: { country: "za" }, // Change this to your desired country code
      }

      autocompleteService.current!.getPlacePredictions(request, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions)
        } else {
          setSuggestions([])
        }
      })
    }, 300)

    return () => clearTimeout(timeoutId)
  }

  const saveLocationFromCoordinates = async (locationData: {
    lat: number
    lng: number
    name: string
    isPublic: boolean
  }) => {
    if (!user) return

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from("locations")
        .insert([
          {
            user_id: user.id,
            name: locationData.name,
            lat: locationData.lat,
            lng: locationData.lng,
            is_public: locationData.isPublic,
          },
        ])
        .select()

      if (error) throw error

      const newLocation = data[0]

      // Update local state
      setMarkers((prev) => [...prev, newLocation])

      // Center map on the new location
      if (map) {
        map.panTo({ lat: locationData.lat, lng: locationData.lng })
        map.setZoom(15)
      }

      toast({
        title: "Location saved",
        description: `${newLocation.name} has been saved ${locationData.isPublic ? "publicly" : "privately"}`,
      })
    } catch (error: any) {
      toast({
        title: "Error saving location",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const loadLocations = useCallback(async () => {
    if (!user) return

    try {
      // Get user's private locations
      const { data: privateLocations, error: privateError } = await supabase
        .from("locations")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_public", false)

      if (privateError) throw privateError

      // Get all public locations
      const { data: publicLocations, error: publicError } = await supabase
        .from("locations")
        .select("*")
        .eq("is_public", true)

      if (publicError) throw publicError

      // Combine locations
      const allLocations = [...(privateLocations || []), ...(publicLocations || [])]
      setMarkers(allLocations)
    } catch (error: any) {
      toast({
        title: "Error loading locations",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [toast, user])

  // Check for URL parameters to center the map or display a route
  useEffect(() => {
    if (!map) return

    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const routeId = searchParams.get("route")

    if (lat && lng) {
      const position = {
        lat: Number.parseFloat(lat),
        lng: Number.parseFloat(lng),
      }
      // Center map on the specified location
      map.panTo(position)
      map.setZoom(15)
      // Create a temporary marker
      createTempMarker(position)
    } else if (routeId) {
      // Display the route
      displayRoute(routeId)
    }
  }, [map, searchParams, createTempMarker, displayRoute])

  // Load locations when map is ready and user is authenticated
  useEffect(() => {
    if (map && user) {
      loadLocations()
    }
  }, [map, user, loadLocations])

  const saveLocation = async () => {
    if (!selectedLocation || !user) return

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from("locations")
        .insert([
          {
            user_id: user.id,
            name: locationName || "Unnamed location",
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            is_public: isPublic,
          },
        ])
        .select()

      if (error) throw error

      const newLocation = data[0]

      // Remove temporary marker
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setMap(null)
        tempMarkerRef.current = null
      }

      // Update local state
      setMarkers((prev) => [...prev, newLocation])
      setSelectedLocation(null)
      setLocationName("")

      toast({
        title: "Location saved",
        description: `${newLocation.name} has been saved ${isPublic ? "publicly" : "privately"}`,
      })
    } catch (error: any) {
      toast({
        title: "Error saving location",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleLocationUpdate = useCallback((position: { lat: number; lng: number }) => {
    // Optional: You can add additional logic here when location updates
    console.log("User location updated:", position)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest(".relative")) {
        setSuggestions([])
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  return (
    <div className="h-full relative" role="region" aria-label="Map container" aria-busy={isLoading}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Google Places Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="relative max-w-md mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search for places..."
              className="w-full px-4 py-3 pr-10 text-sm bg-white border border-gray-300 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoComplete="off"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Search Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-30">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.place_id}
                  onClick={() => handlePlaceSelect(suggestion)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{suggestion.structured_formatting.main_text}</div>
                  <div className="text-gray-500 text-xs mt-1">{suggestion.structured_formatting.secondary_text}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Location Control Button */}
      <div className="absolute top-4 right-4 z-20">
        <LocationControl onToggle={setIsLocationEnabled} />
      </div>

      <div ref={mapRef} className="w-full h-full" />

      {/* Live Location Component */}
      <LiveLocation map={map} isEnabled={isLocationEnabled} onLocationUpdate={handleLocationUpdate} />

      {/* Render saved location markers using CustomMarker */}
      {markers.map((location) => (
        <CustomMarker
          key={location.id}
          map={map}
          position={{ lat: location.lat, lng: location.lng }}
          title={location.name}
          onClick={() => {
            // Close all other info windows
            infoWindows.current.forEach((window) => window.close())

            // Create or get info window for this location
            let infoWindow = infoWindows.current.get(location.id)
            if (!infoWindow) {
              infoWindow = new google.maps.InfoWindow({
                content: `
                  <div>
                    <strong>${location.name}</strong><br/>
                    ${formatLocation(location.lat, location.lng)}<br/>
                    <span style="color: ${location.is_public ? "#22c55e" : "#64748b"}">
                      ${location.is_public ? "Public" : "Private"}
                    </span>
                  </div>
                `,
              })
              infoWindows.current.set(location.id, infoWindow)
            }

            if (map) {
              infoWindow.open(map)
              infoWindow.setPosition({ lat: location.lat, lng: location.lng })
            }
          }}
        />
      ))}
    </div>
  )
}
