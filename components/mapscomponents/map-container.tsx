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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { UserSearchComponent } from "@/components/UserSearchComponent"
import { Users } from "lucide-react"

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
  visibility: 'public' | 'followers' | 'private'
  user_id: string
  url?: string | null
  users?: {
    id: string
    name: string
    avatar_url: string | null
  }
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
    // Check if Google Maps is already fully loaded
    if (typeof window !== "undefined" && window.google && window.google.maps && window.google.maps.Map) {
      resolve()
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // Poll for API readiness with timeout
      let attempts = 0
      const maxAttempts = 200 // 10 seconds at 50ms intervals
      const checkApiReady = () => {
        if (window.google && window.google.maps && window.google.maps.Map) {
          resolve()
        } else if (attempts >= maxAttempts) {
          reject(new Error("Google Maps API not fully loaded after waiting for existing script"))
        } else {
          attempts++
          setTimeout(checkApiReady, 50)
        }
      }
      checkApiReady()
      existingScript.addEventListener("error", () => reject(new Error("Existing Google Maps script failed to load")))
      return
    }

    // Create and load new script
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`
    script.async = true
    script.defer = true
    
    let loadAttempts = 0
    const maxLoadAttempts = 200 // 10 seconds
    
    const checkAfterLoad = () => {
      if (window.google && window.google.maps && window.google.maps.Map) {
        resolve()
      } else if (loadAttempts >= maxLoadAttempts) {
        reject(new Error("Google Maps API not fully loaded after 10 seconds"))
      } else {
        loadAttempts++
        setTimeout(checkAfterLoad, 50)
      }
    }
    
    script.onload = () => {
      // Start polling immediately after script loads
      checkAfterLoad()
    }
    
    script.onerror = () => reject(new Error("Failed to load Google Maps script from Google servers"))
    
    document.head.appendChild(script)
  })
}

export function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any | null>(null)
  const [markers, setMarkers] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [visibility, setVisibility] = useState<"public" | "followers" | "private">("private")
  const [locationName, setLocationName] = useState("")
  const [locationUrl, setLocationUrl] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isLocationEnabled, setIsLocationEnabled] = useState(false)
  // Explicit UI state to force-open dialog (start closed)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState<boolean>(false)
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState<boolean>(false)
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

  // Load locations only for logged-in users
  const loadLocations = useCallback(async () => {
    if (!user) {
      setMarkers([])
      return
    }
    
    try {
      setIsLoading(true)
      console.log("Loading locations for user:", user.id)
      
      // Check if session is still valid and refresh if needed
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error("Session invalid, attempting refresh...")
        const { error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.error("Failed to refresh session:", refreshError)
          toast({
            title: "Session expired",
            description: "Please log in again",
            variant: "destructive",
          })
          router.push("/login")
          return
        }
        console.log("Session refreshed successfully")
      }
      
      // First get the list of users being followed
      // Note: This might fail if the followers table doesn't exist yet
      let followingIds: string[] = [];
      try {
        const { data: following, error: followingError } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', user.id)
        
        if (followingError) {
          console.error("Error loading following list:", followingError)
          // Don't throw error, just continue with empty following list
        } else {
          followingIds = following?.map(f => f.following_id) || []
          console.log("Following IDs:", followingIds)
        }
      } catch (followErr) {
        console.error("Exception loading following list:", followErr)
        // Continue with empty following list
      }

      // Build the OR filter for locations query
      let query = supabase
        .from("locations")
        .select(`
          *,
          users (
            id,
            name,
            avatar_url
          )
        `)
      
      // If no followers table exists yet or no following users, just get public locations and own locations
      if (followingIds.length === 0) {
        query = query.or(`visibility.eq.public,user_id.eq.${user.id}`)
      } else {
        // Include followers-only locations from people user follows
        query = query.or(`visibility.eq.public,user_id.eq.${user.id},and(visibility.eq.followers,user_id.in.(${followingIds.join(",")}))`)
      }
      
      const { data: allLocations, error: locationsError } = await query
        .order("created_at", { ascending: false })
      
      if (locationsError) {
        // Check if it's a JWT error
        if (locationsError.code === 'PGRST301' || locationsError.code === 'PGRST303') {
          console.error("JWT error detected, redirecting to login")
          toast({
            title: "Session expired",
            description: "Please log in again",
            variant: "destructive"
          })
          router.push("/login")
          return
        }
        
        console.error("Error loading locations:", locationsError)
        console.error("Error details:", JSON.stringify(locationsError, null, 2))
        console.error("Error message:", locationsError.message)
        console.error("Error code:", locationsError.code)
        console.error("Error hint:", locationsError.hint)
        // Show toast but don't throw to prevent app crash
        toast({
          title: "Error loading locations",
          description: locationsError.message || "Failed to load locations",
          variant: "destructive"
        })
        // Return early rather than throwing
        setIsLoading(false)
        return
      }

      console.log("Loaded locations:", allLocations)
      setMarkers(allLocations || [])
      
    } catch (error: any) {
      console.error("Error loading locations:", error)
      toast({
        title: "Error loading locations",
        description: error.message || "Failed to load locations",
        variant: "destructive",
      })
      // Set empty markers to prevent UI from waiting for data
      setMarkers([])
    } finally {
      setIsLoading(false)
    }
  }, [toast, user, router])

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

  // Initialize map only once
  useEffect(() => {
    if (!NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      toast({
        title: "Configuration Error",
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
        setIsLoading(false)
        return
      }

      try {
        // Load Google Maps script with robust error handling
        await loadGoogleMapsScript(NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string)

        // Final verification before creating map
        if (!window.google || !window.google.maps || !window.google.maps.Map) {
          throw new Error("Google Maps API verification failed - please check your API key and network connection")
        }

        // Create the map
        googleMap = new window.google.maps.Map(mapRef.current, {
          center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
          zoom: 10,
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

        // Initialize services
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
            const clickedPosition = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            }
            
            console.log("Map clicked, opening dialog with position:", clickedPosition);
            
            // Set the search marker position to provide visual feedback
            setSearchMarkerPosition(clickedPosition);
            
            // Set the selected location for the dialog
            setSelectedLocation(clickedPosition);
            
            // Reset form fields before opening
            setLocationName("");
            setLocationUrl("");
            setVisibility("private");
            
            // Force dialog to open
            setIsSaveDialogOpen(true);
          } else {
            toast({
              title: "Login Required",
              description: "Please log in to save locations on the map",
              variant: "destructive",
            })
          }
        })

        // Clear loading state
        setIsLoading(false)

      } catch (error: any) {
        console.error("Google Maps initialization failed:", error)
        toast({
          title: "Map Loading Failed",
          description: error.message || "Unable to load Google Maps. Please check your connection and try again.",
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
      
      // Clear directions if active
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
      }
    }
  }, [isAuthenticated, toast])

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
      console.log("Map and user ready, loading locations")
      loadLocations()
    } else if (!user) {
      console.log("No user, clearing markers")
      setMarkers([]) // Clear markers if logged out
    }
  }, [map, user, loadLocations])

  // Debug effect to monitor markers state
  useEffect(() => {
    console.log("Current markers:", markers)
  }, [markers])
  
  // Debug dialog state
  useEffect(() => {
    console.log("Dialog open state:", isSaveDialogOpen);
    console.log("Selected location:", selectedLocation);
  }, [isSaveDialogOpen, selectedLocation])

  const saveLocationFromCoordinates = async (locationData: {
    lat: number
    lng: number
    name: string
    isPublic: boolean
    url?: string
  }) => {
    if (!user) return

    try {
      // Validate URL if provided
      let validatedUrl = locationData.url ? locationData.url.trim() : null
      if (validatedUrl) {
        if (!validatedUrl.startsWith('http') && !validatedUrl.startsWith('/')) {
          validatedUrl = 'https://' + validatedUrl
        }
      }
      
      // Save to Supabase — use 'visibility' column (map uses visibility enum)
      const { data, error } = await supabase
        .from("locations")
        .insert([
          {
            user_id: user.id,
            name: locationData.name,
            lat: locationData.lat,
            lng: locationData.lng,
            visibility: locationData.isPublic ? "public" : "private",
            url: validatedUrl || null, // Ensure null instead of empty string
          },
        ])
        .select(`
          *,
          users (
            id,
            name,
            avatar_url
          )
        `)

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

  // Calculate and render route
  const calculateRoute = useCallback(
    (from: { lat: number; lng: number }, to: { lat: number; lng: number }, mode: typeof travelMode, silent = false) => {
      if (!directionsServiceRef.current || !directionsRendererRef.current || !map) return

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
            
            const route = result.routes[0]
            if (route) {
              const leg = route.legs[0]
              setRouteInfo({
                distanceText: leg.distance.text,
                durationText: leg.duration.text,
              })
            }
          } else if (!silent) {
            toast({
              title: "Route calculation failed",
              description: `Status: ${status}`,
              variant: "destructive",
            })
          }
          // Keep last result for saving if available
          if (result) {
            lastDirectionsResultRef.current = result
          }
        },
      )
    },
    [map, toast]
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

  // Handle search input changes for Google Places autocomplete
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (!value.trim() || !autocompleteService.current) {
      setSuggestions([])
      return
    }

    // Add a small delay to avoid too many API calls (debouncing)
    const timeoutId = window.setTimeout(() => {
      const request = {
        input: value,
        types: ["geocode", "establishment"],
        componentRestrictions: undefined, // No country restriction
      }
      autocompleteService.current!.getPlacePredictions(request, (predictions: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setSuggestions(predictions || [])
        } else {
          console.warn("Autocomplete predictions failed:", status)
          setSuggestions([])
        }
      })
    }, 300)

    // Cleanup timeout on unmount or value change
    return () => clearTimeout(timeoutId)
  }, [autocompleteService])

  // Handle place selection from autocomplete suggestions
  const handlePlaceSelect = useCallback(async (prediction: any) => {
    if (!placesService.current || !map) return

    const request = {
      placeId: prediction.place_id,
      fields: ["geometry", "name", "formatted_address"],
    }

    placesService.current.getDetails(request, (place: any, status: any) => {
      if (window.google && status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
        const position = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        }

        // Center map on selected place
        map.panTo(position)
        map.setZoom(15)

        // Set as destination for navigation
        setDestination(position)

        // Create temporary marker
        setSearchMarkerPosition(position)

        // Clear search input and suggestions
        setSearchInput(place.name || "")
        setSuggestions([])

        // Show toast with place info
        toast({
          title: place.name || "Location selected",
          description: place.formatted_address || "Ready for navigation",
        })
      } else {
        toast({
          title: "Place details failed",
          description: `Status: ${status}`,
          variant: "destructive",
        })
      }
    })
  }, [placesService, map, toast, isAuthenticated])

  // Handle live location updates from browser geolocation
  const handleLocationUpdate = useCallback(
    (position: { lat: number; lng: number }) => {
      setOrigin(position)

      // If the save dialog is open, keep its coordinates in sync with live location updates
      if (isSaveDialogOpen) {
        setSelectedLocation({ lat: position.lat, lng: position.lng })
        setSearchMarkerPosition(position)
        if (map) {
          map.panTo(position)
          map.setZoom(15)
        }
      }

      // If navigating, recalculate route with updated position (silent to avoid toast spam)
      if (isNavigating && destination) {
        if (calculateRoute) {
          calculateRoute(position, destination, travelMode, true)
        }
      }
    },
    [isSaveDialogOpen, map, isNavigating, destination, travelMode, calculateRoute]
  )

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Clear suggestions when clicking outside the search input area
    if (suggestions.length > 0) {
      setSuggestions([])
    }
  }, [suggestions.length])

  return (
    <div 
      className="h-full relative" 
      role="region" 
      aria-label="Map container" 
      aria-busy={isLoading}
      onClick={handleContainerClick}
    >
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
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  onClick={() => handlePlaceSelect(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-accent text-sm border-b border-border last:border-b-0"
                >
                  <div className="font-medium">{suggestion.structured_formatting.main_text}</div>
                  <div className="text-xs text-muted-foreground">
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

      {/* Location Control Button + Add Location button (top-right cluster) */}
      <div
        className="
          absolute top-4 right-4 z-[2147483644]
          supports-[padding:max(0px)]:pr-[max(1rem,env(safe-area-inset-right))]
          supports-[padding:max(0px)]:pt-[max(1rem,env(safe-area-inset-top))]
          flex flex-col items-end gap-3
        "
      >
        <div className="pointer-events-auto">
          <LocationControl onToggle={setIsLocationEnabled} />
        </div>
        
        {/* Search Users Button */}
        <div className="pointer-events-auto">
          <button
            aria-label="Search users"
            onClick={() => setIsSearchDialogOpen(true)}
            className="
              h-12 w-12 rounded-full shadow-lg
              bg-white dark:bg-neutral-800 text-primary
              hover:bg-gray-100 dark:hover:bg-neutral-700
              flex items-center justify-center
              border border-border
              transition-colors
            "
            title="Search users"
          >
            <Users className="h-5 w-5" />
          </button>
        </div>

        {/* Moved Add (+) next to My Location (stacked with small gap) */}
        <div className="pointer-events-auto">
          <button
            aria-label="Add location"
            onClick={() => {
              console.log("Add location button clicked");
              const loc = destination ?? searchMarkerPosition ?? origin;
              if (loc) {
                console.log("Using location:", loc);
                setSelectedLocation({ lat: loc.lat, lng: loc.lng });
                setIsSaveDialogOpen(true);
                if (map) {
                  map.panTo(loc);
                  map.setZoom(15);
                }
              } else {
                console.log("No location available, opening empty dialog");
                setIsSaveDialogOpen(true);
                toast({
                  title: "No location selected",
                  description:
                    "Click on the map or search a place to choose a location. You can also enable live location.",
                });
              }
            }}
            className="
              h-12 w-12 rounded-full shadow-lg
              bg-primary text-primary-foreground
              hover:bg-primary/90
              flex items-center justify-center text-2xl leading-none
              border border-border
              transition-colors
            "
            style={{ lineHeight: 0 }}
            title="Add location"
          >
            <span className="select-none" aria-hidden="true">
              +
            </span>
          </button>
        </div>
      </div>

      <div ref={mapRef} className="w-full h-full" />

      {/* Live Location Component */}
      <LiveLocation
        map={map}
        isEnabled={isLocationEnabled}
        onLocationUpdate={handleLocationUpdate}
      />

      {/* Render saved location markers using SavedLocationMarker */}
      {markers.map((location) => (
        <SavedLocationMarker
          key={location.id}
          map={map}
          id={location.id}
          position={{ lat: location.lat, lng: location.lng }}
          title={location.name}
          visibility={location.visibility}
          onClick={() => {
            // Close all other info windows
            infoWindows.current.forEach((window) => window.close())

            // Create or get info window for this location
            let infoWindow = infoWindows.current.get(location.id)
            if (!infoWindow) {
              const hasLink = location.url && location.url.trim() !== ""
              let linkElement = ""
              
              if (hasLink) {
                const url = location.url!
                const isInternal = url.startsWith('/')
                const displayText = isInternal ? 'View Details' : 'Visit Link'
                const linkTarget = isInternal ? '' : 'target="_blank" rel="noopener noreferrer"'
                
                // Enhanced link display with description
                const urlDisplay = isInternal 
                  ? url 
                  : url.replace(/^https?:\/\//, '').replace(/\/$/, '')
                
                linkElement = `
                  <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="color: #3b82f6;">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <span style="font-weight: 500; color: #374151; font-size: 0.875rem;">${displayText}</span>
                    </div>
                    <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 6px;">
                      ${isInternal ? 'Internal page' : 'External website'}
                    </div>
                    <a href="${url}" ${linkTarget} 
                       style="display: inline-block; color: #3b82f6; text-decoration: underline; font-size: 0.875rem; font-weight: 500; word-break: break-all; max-width: 100%; overflow: hidden; text-overflow: ellipsis;"
                       onclick="if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage('navigate:${url}'); return false;}">
                      ${urlDisplay}
                    </a>
                  </div>
                `
              }
              
              infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="min-width: 280px; max-width: 300px; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.4;">
                    <div style="font-weight: 600; font-size: 1.125rem; margin-bottom: 8px; color: #1f2937;">
                      ${location.name}
                    </div>
                    <div style="color: #6b7280; font-size: 0.875rem; margin-bottom: 12px; font-family: monospace;">
                      ${formatLocation(location.lat, location.lng)}
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 8px; background-color: #f9fafb; border-radius: 6px;">
                      <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${
                        location.visibility === 'public' ? '#22c55e' : location.visibility === 'followers' ? '#f59e0b' : '#64748b'
                      }; flex-shrink: 0;"></div>
                      <div>
                        <div style="font-size: 0.875rem; color: #374151; font-weight: 500;">
                          ${location.visibility === 'public' ? 'Public' : location.visibility === 'followers' ? 'Followers Only' : 'Private'}
                        </div>
                        <div style="font-size: 0.75rem; color: #6b7280;">
                          ${location.visibility === 'public' ? 'Visible to everyone' : 
                            location.visibility === 'followers' ? 'Visible to your followers' : 'Only visible to you'}
                        </div>
                      </div>
                    </div>
                    
                    ${linkElement}
                    
                    ${location.users && location.user_id !== user?.id ? `
                      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 0.875rem; color: #6b7280; display: flex; align-items: center; gap: 8px;">
                        <div style="width: 24px; height: 24px; border-radius: 50%; background-image: url('${location.users?.avatar_url || ''}'); background-size: cover; background-color: #e5e7eb;"></div>
                        <div>
                          <div style="font-weight: 500; color: #374151;">Shared by ${location.users.name}</div>
                          <div style="font-size: 0.75rem;">${location.visibility === 'public' ? 'Public location' : 'Shared with followers'}</div>
                        </div>
                      </div>
                    ` : ''}
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

      {/* Removed bottom-right Add (+); moved to top-right cluster near My Location */}

      {/* Temporary search marker */}
      <SearchMarker map={map} position={searchMarkerPosition} options={searchMarkerOptions} />

      {/* Save Location Dialog */}
      <LocationDialog
        open={isSaveDialogOpen}
        locationName={locationName}
        locationUrl={locationUrl}
        visibility={visibility}
        setLocationName={setLocationName}
        setLocationUrl={setLocationUrl}
        setVisibility={setVisibility}
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
        onSave={async (validatedUrl: string | null) => {  // Receive URL directly
          // No need to validate again since dialog already did it
          
          if (!user) {
            toast({ title: "Login required", description: "Please login to save.", variant: "destructive" })
            router.push("/login")
            return
          }
          
          // Prefer user-edited selectedLocation if present
          const candidate = selectedLocation ?? destination ?? searchMarkerPosition ?? origin
          if (!candidate || typeof candidate.lat !== "number" || typeof candidate.lng !== "number") {
            toast({
              title: "Invalid coordinates",
              description: "Please enter valid latitude and longitude.",
              variant: "destructive",
            })
            return
          }
          
          console.log("Saving location:", { 
            user_id: user.id, 
            name: locationName, 
            lat: candidate.lat, 
            lng: candidate.lng, 
            visibility,
            url: validatedUrl // This will correctly pass null or the validated URL
          })
          
          try {
            const { data, error } = await supabase
              .from("locations")
              .insert([
                {
                  user_id: user.id,
                  name: locationName || "Saved location",
                  lat: candidate.lat,
                  lng: candidate.lng,
                  visibility: visibility,
                  url: validatedUrl, // Will be null for empty strings
                },
              ])
              .select(`
                *,
                users (
                  id,
                  name,
                  avatar_url
                )
              `)
            
            if (error) throw error
            
            const newLocation = data?.[0]
            if (newLocation) {
              setMarkers((prev) => [...prev, newLocation])
            }
            
            toast({
              title: "Location saved",
              description: `${locationName || "Saved location"} at ${formatLocation(candidate.lat, candidate.lng)} ${validatedUrl ? 'with link' : ''}`,
            })
            
            // Reset form
            console.log("Closing dialog after saving location");
            setIsSaveDialogOpen(false);
            setSelectedLocation(null);
            setLocationName("");
            setLocationUrl("")
          } catch (e: any) {
            console.error("Error saving location:", e)
            toast({ title: "Failed to save location", description: e.message, variant: "destructive" })
          }
        }}
      />

      {/* Search Users Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Search Users</DialogTitle>
            <DialogDescription>
              Find other users to connect with and view their shared locations
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <UserSearchComponent onClose={() => setIsSearchDialogOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
