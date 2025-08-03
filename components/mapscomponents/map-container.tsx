"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { NEXT_PUBLIC_GOOGLE_MAPS_API_KEY } from "@/app/env"
import { useRouter, useSearchParams } from "next/navigation"
import { formatLocation } from "@/lib/format-coordinates"
import { LiveLocation } from "./live-location"
import { LocationControl } from "./location-control.tsx"
import { Input } from "@/components/ui/input"
import SearchMarker, { type SearchMarkerOptions } from "./markers/SearchMarker"
import SavedLocationMarker from "./markers/SavedLocationMarker"
import { LocationDialog } from "./location-dialog"

// Minimal global declarations to satisfy TS when Google Maps JS API loads at runtime
declare global {
  interface Window {
    // keep it as any to avoid compilation dependency on @types/google.maps
    google: any
  }
}

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
  const [map, setMap] = useState<any | null>(null)
  const [markers, setMarkers] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [locationName, setLocationName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLocationEnabled, setIsLocationEnabled] = useState(false)
  // Explicit UI state to force-open dialog (start closed)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState<boolean>(false)
  const { user, isAuthenticated } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Directions state
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null)
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null)
  const [travelMode, setTravelMode] = useState<"DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT">("DRIVING")
  const [routeInfo, setRouteInfo] = useState<{ distanceText: string; durationText: string } | null>(null)
  const directionsRendererRef = useRef<any | null>(null)
  const directionsServiceRef = useRef<any | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  // Search marker customization state (color and size)
  const [searchMarkerOptions, setSearchMarkerOptions] = useState<SearchMarkerOptions>({
    color: "#3b82f6",
    size: 10,
  })
  const [searchMarkerPosition, setSearchMarkerPosition] = useState<{ lat: number; lng: number } | null>(null)

  // Use refs for objects that need to persist between renders but don't affect rendering
  const infoWindows = useRef<Map<string, any>>(new Map())
  // temp search marker is moved to its own component; retain ref for imperative access if needed
  const tempMarkerRef = useRef<any | null>(null)
  const routePolylineRef = useRef<any | null>(null)
  const routeMarkersRef = useRef<any[]>([])

  const [searchInput, setSearchInput] = useState("")
  const autocompleteService = useRef<any | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const placesService = useRef<any | null>(null)

  // Persist last computed route payload for saving
  const lastDirectionsResultRef = useRef<any | null>(null)

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

    let googleMap: any | null = null
    const initializeMap = async () => {
      if (!mapRef.current) {
        console.error("mapRef is not attached to a DOM element.")
        return
      }

      try {
        // Load Google Maps script first
        await loadGoogleMapsScript(NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string)

        // Now we can safely use google.maps
        googleMap = new window.google.maps.Map(mapRef.current, {
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
        // Defer clearing loading state to next tick so initial render keeps aria-busy="true"
        setTimeout(() => setIsLoading(false), 0)

        placesService.current = new window.google.maps.places.PlacesService(googleMap)
        autocompleteService.current = new window.google.maps.places.AutocompleteService()

        // Initialize Directions services
        directionsServiceRef.current = new window.google.maps.DirectionsService()
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: googleMap,
          suppressMarkers: false,
          preserveViewport: false,
          polylineOptions: {
            strokeColor: "#2563eb",
            strokeWeight: 5,
          },
        })

        // Add click listener to map
        googleMap.addListener("click", (event: any) => {
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
        // Ensure initial paint reflects loading state even on instant errors/mocks
        setTimeout(() => setIsLoading(false), 0)
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

  // Function to create/update the temporary search marker position
  const createTempMarker = useCallback(
    (position: { lat: number; lng: number }) => {
      if (!map) return
      setSearchMarkerPosition(position)
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
      routePolylineRef.current = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#3b82f6",
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map,
      })

      // Add markers for start and end points
      const startMarker = new window.google.maps.Marker({
        position: path[0],
        map,
        title: "Start",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#22c55e", // Green for start
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
          scale: 8,
        },
      })
      const endMarker = new window.google.maps.Marker({
        position: path[path.length - 1],
        map,
        title: "End",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
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
        const waypointMarker = new window.google.maps.Marker({
          position: path[i],
          map,
          title: `Waypoint ${i}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
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
      const bounds = new window.google.maps.LatLngBounds()
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

  const handlePlaceSelect = async (prediction: any) => {
    if (!placesService.current || !map) return

    const request = {
      placeId: prediction.place_id,
      fields: ["geometry", "name"],
    }

    placesService.current.getDetails(request, (place: any, status: any) => {
      if (window.google && status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
        const placeName = place.name || "Searched location"
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        }

        // Pan and zoom to the selected place
        map.panTo(location)
        map.setZoom(15)

        // Create/update the temporary search marker so the icon is visible
        createTempMarker(location)

        // set as destination for navigation
        setDestination(location)

        // If the Save dialog is currently open, sync its coordinate fields to the new search
        if (isSaveDialogOpen) {
          setSelectedLocation({ lat: location.lat, lng: location.lng })
          // Ensure the visible temp marker and viewport reflect updates too
          setSearchMarkerPosition(location)
        }

        // Optionally set the marker title and open an info window at the searched location
        if (tempMarkerRef.current) {
          tempMarkerRef.current.setTitle(placeName)
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <strong>${placeName}</strong><br/>
                ${formatLocation(location.lat, location.lng)}
              </div>
            `,
            position: location,
          })
          // Close other info windows and open this one anchored to the temp marker
          infoWindows.current.forEach((win) => win.close())
          infoWindow.open(map, tempMarkerRef.current)
        }

        setSearchInput("")
        setSuggestions([])
      }
    })
  }

  // Public API: customize only color and size of the temporary search marker
  const customizeSearchMarker = useCallback((options: { color?: string; size?: number }) => {
    setSearchMarkerOptions((prev) => ({
      color: options.color ?? prev.color,
      size: typeof options.size === "number" ? options.size : prev.size,
    }))
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (!value.trim() || !autocompleteService.current) {
      setSuggestions([])
      return
    }

    // Add a small delay to avoid too many API calls
    const timeoutId = window.setTimeout(() => {
      const request = {
        input: value,
        types: ["geocode", "establishment"],
        //componentRestrictions: { country: "za" }, // Change this to your desired country code
      }
      autocompleteService.current!.getPlacePredictions(request, (predictions: any, status: any) => {
        if (window.google && status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
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

  const handleLocationUpdate = useCallback(
    (position: { lat: number; lng: number }) => {
      setOrigin(position)

      // If the Save dialog is open, keep its coordinates in sync with live location updates
      if (isSaveDialogOpen) {
        setSelectedLocation({ lat: position.lat, lng: position.lng })
        setSearchMarkerPosition(position)
        if (map) {
          map.panTo(position)
        }
      }

      if (isNavigating && destination) {
        // re-calc quietly to keep route fresh as user moves
        // Note: calculateRoute is defined below but stable via useCallback; we avoid referencing it in deps to prevent hoist errors
        // Instead, call through a ref-like pattern by relying on latest closure of travelMode/destination
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        calculateRoute(position, destination, travelMode, true)
      }
    },
    // Keep dependencies minimal to avoid "used before declaration" while still updating when relevant state changes
    [isSaveDialogOpen, map, isNavigating, destination, travelMode],
  )

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

  // Calculate and render route
  const calculateRoute = useCallback(
    (from: { lat: number; lng: number }, to: { lat: number; lng: number }, mode: typeof travelMode, silent = false) => {
      if (!directionsServiceRef.current || !directionsRendererRef.current) return

      directionsServiceRef.current.route(
        {
          origin: from,
          destination: to,
          travelMode: window.google.maps.TravelMode[mode],
          provideRouteAlternatives: false,
        },
        (result: any, status: any) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            directionsRendererRef.current!.setDirections(result)
            const leg = result.routes?.[0]?.legs?.[0]
            if (leg) {
              setRouteInfo({
                distanceText: leg.distance?.text ?? "",
                durationText: leg.duration?.text ?? "",
              })
              if (!silent && map) {
                // fit bounds to route
                const bounds = new window.google.maps.LatLngBounds()
                result.routes[0].overview_path.forEach((p: any) => bounds.extend(p))
                map.fitBounds(bounds)
              }
            }
          } else if (!silent) {
            toast({
              title: "Directions error",
              description: `Failed to get directions: ${status}`,
              variant: "destructive",
            })
          }
          // keep last result for saving if available
          if (result) {
            lastDirectionsResultRef.current = result
          }
        },
      )
    },
    [map, toast],
  )

  const startNavigation = useCallback(() => {
    if (!origin) {
      toast({ title: "Origin missing", description: "Enable live location first.", variant: "destructive" })
      return
    }
    if (!destination) {
      toast({ title: "Destination missing", description: "Search and select a destination.", variant: "destructive" })
      return
    }
    setIsNavigating(true)
    calculateRoute(origin, destination, travelMode)
  }, [origin, destination, travelMode, calculateRoute, toast])

  const stopNavigation = useCallback(() => {
    setIsNavigating(false)
    setRouteInfo(null)
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] })
    }
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
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search for places..."
              autoComplete="off"
              className="w-full pr-10 h-12 rounded-lg shadow-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                className="w-5 h-5 text-gray-400 dark:text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto z-30 bg-white text-gray-900 border border-gray-300 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  onClick={() => handlePlaceSelect(suggestion)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800 dark:border-neutral-800"
                >
                  <div className="font-medium text-gray-900 dark:text-neutral-100">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-gray-500 dark:text-neutral-400 text-xs mt-1">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Directions Controls */}
      <div className="absolute top-4 left-4 z-30 mt-16">
        <div className="bg-white/95 dark:bg-neutral-900/95 rounded-lg shadow p-3 flex items-center gap-2">
          <select
            className="border rounded px-2 py-1 text-sm bg-white dark:bg-neutral-800"
            value={travelMode}
            onChange={(e) => setTravelMode(e.target.value as any)}
          >
            <option value="DRIVING">Driving</option>
            <option value="WALKING">Walking</option>
            <option value="BICYCLING">Bicycling</option>
            <option value="TRANSIT">Transit</option>
          </select>
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
            onClick={startNavigation}
            disabled={!origin || !destination}
          >
            Navigate
          </button>
          <button className="px-3 py-1 rounded bg-gray-200 dark:bg-neutral-700 text-sm" onClick={stopNavigation}>
            Stop
          </button>
        </div>
      </div>

      {/* Route Info */}
      {routeInfo && (
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-white/95 dark:bg-neutral-900/95 rounded-lg shadow p-3 text-sm">
            <div className="font-medium">Route</div>
            <div className="text-gray-700 dark:text-neutral-300">Distance: {routeInfo.distanceText}</div>
            <div className="text-gray-700 dark:text-neutral-300">ETA: {routeInfo.durationText}</div>
          </div>
        </div>
      )}

      {/* Location Control Button */}
      <div className="absolute top-4 right-4 z-20 mt-24">
        <LocationControl onToggle={setIsLocationEnabled} />
      </div>

      <div ref={mapRef} className="w-full h-full" />

      {/* Live Location Component */}
      <LiveLocation
        map={map}
        isEnabled={isLocationEnabled}
        onLocationUpdate={(pos) => {
          // Always pass through to core handler
          handleLocationUpdate(pos)

          // If the save dialog is open and user explicitly clicks "My Location" to enable/update,
          // ensure the dialog coordinates immediately reflect live location even after a prior search
          if (isSaveDialogOpen) {
            setSelectedLocation({ lat: pos.lat, lng: pos.lng })
            setSearchMarkerPosition(pos)
          }
        }}
      />

      {/* Render saved location markers using SavedLocationMarker */}
      {markers.map((location) => (
        <SavedLocationMarker
          key={location.id}
          map={map}
          id={location.id}
          position={{ lat: location.lat, lng: location.lng }}
          title={location.name}
          onClick={() => {
            // Close all other info windows
            infoWindows.current.forEach((window) => window.close())

            // Create or get info window for this location
            let infoWindow = infoWindows.current.get(location.id)
            if (!infoWindow) {
              infoWindow = new window.google.maps.InfoWindow({
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
            // Also allow quick navigate by setting destination when clicking a saved marker
            setDestination({ lat: location.lat, lng: location.lng })
            createTempMarker({ lat: location.lat, lng: location.lng })
          }}
        />
      ))}

      {/* Floating Add (+) Button opens save dialog; themed and safe-area aware */}
      <div
        className="
          absolute z-[2147483644]
          right-4 bottom-4
          supports-[padding:max(0px)]:pr-[max(1rem,env(safe-area-inset-right))]
          supports-[padding:max(0px)]:pb-[max(1rem,env(safe-area-inset-bottom))]
          pointer-events-none
        "
      >
        <div className="pointer-events-auto">
          <button
            aria-label="Add location"
            onClick={() => {
              const loc = destination ?? searchMarkerPosition ?? origin
              if (loc) {
                setSelectedLocation({ lat: loc.lat, lng: loc.lng })
                setIsSaveDialogOpen(true)
                if (map) {
                  map.panTo(loc)
                  map.setZoom(15)
                }
              } else {
                setIsSaveDialogOpen(true)
                toast({
                  title: "No location selected",
                  description:
                    "Click on the map or search a place to choose a location. You can also enable live location.",
                })
              }
            }}
            className="
              h-14 w-14 rounded-full shadow-lg
              bg-primary text-primary-foreground
              hover:bg-primary/90
              flex items-center justify-center text-3xl leading-none
              border border-border
              transition-colors
            "
            style={{ lineHeight: 0 }}
            title="Add location"
          >
            <span className="select-none" aria-hidden="true">+</span>
          </button>
        </div>
      </div>

      {/* Temporary search marker */}
      <SearchMarker map={map} position={searchMarkerPosition} options={searchMarkerOptions} />

      {/* Save Location Dialog */}
      <LocationDialog
        open={isSaveDialogOpen}
        locationName={locationName}
        isPublic={isPublic}
        setLocationName={setLocationName}
        setIsPublic={setIsPublic}
        // Show current candidate coordinates in the dialog for editing
        lat={(selectedLocation ?? destination ?? searchMarkerPosition ?? origin)?.lat ?? null}
        lng={(selectedLocation ?? destination ?? searchMarkerPosition ?? origin)?.lng ?? null}
        setLat={(v) => {
          if (v == null) return
          // Keep a controlled "selectedLocation" when user edits fields
          setSelectedLocation((prev) => {
            const base = prev ?? destination ?? searchMarkerPosition ?? origin
            return { lat: v, lng: base?.lng ?? 0 }
          })
          // Update the visible temporary marker and map viewport
          const baseLng = (selectedLocation ?? destination ?? searchMarkerPosition ?? origin)?.lng
          if (map && baseLng != null) {
            map.panTo({ lat: v, lng: baseLng })
            map.setZoom(15)
          }
          setSearchMarkerPosition((prev) => ({ lat: v, lng: prev?.lng ?? baseLng ?? 0 }))
        }}
        setLng={(v) => {
          if (v == null) return
          setSelectedLocation((prev) => {
            const base = prev ?? destination ?? searchMarkerPosition ?? origin
            return { lat: base?.lat ?? 0, lng: v }
          })
          const baseLat = (selectedLocation ?? destination ?? searchMarkerPosition ?? origin)?.lat
          if (map && baseLat != null) {
            map.panTo({ lat: baseLat, lng: v })
            map.setZoom(15)
          }
          setSearchMarkerPosition((prev) => ({ lat: prev?.lat ?? baseLat ?? 0, lng: v }))
        }}
        onCancel={() => {
          // Ensure dialog closes and inputs reset so it does not persist on page load
          setIsSaveDialogOpen(false)
          setSelectedLocation(null)
          // do not clear destination/search marker; only close the UI
        }}
        onSave={async () => {
          if (!user) {
            toast({ title: "Login required", description: "Please login to save.", variant: "destructive" })
            router.push("/login") // Redirect to login page
            return
          }
          // Prefer user-edited selectedLocation if present
          const candidate = selectedLocation ?? destination ?? searchMarkerPosition ?? origin
          if (!candidate) {
            toast({ title: "No coordinates", description: "Pick a spot on the map first.", variant: "destructive" })
            return
          }
          try {
            const { data, error } = await supabase
              .from("locations")
              .insert([
                {
                  user_id: user.id,
                  name: locationName || "Saved location",
                  lat: candidate.lat,
                  lng: candidate.lng,
                  is_public: isPublic,
                },
              ])
              .select()
            if (error) throw error
            const newLocation = data?.[0]
            if (newLocation) {
              setMarkers((prev) => [...prev, newLocation])
            }
            toast({
              title: "Location saved",
              description: `${locationName || "Saved location"} at ${formatLocation(candidate.lat, candidate.lng)}`,
            })
            setIsSaveDialogOpen(false)
            setSelectedLocation(null)
            setLocationName("")
          } catch (e: any) {
            toast({ title: "Failed to save location", description: e.message, variant: "destructive" })
          }
        }}
      />
    </div>
  )
}
