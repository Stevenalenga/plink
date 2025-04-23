"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Plus, MapPin, RouteIcon, Share2, Search } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { NEXT_PUBLIC_GOOGLE_MAPS_API_KEY } from "@/app/env"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader } from "@googlemaps/js-api-loader"
// Import the CoordinateInput component at the top of the file
import { CoordinateInput } from "@/components/coordinate-input"
// Import the format utility at the top of the file
import { formatLocation } from "@/lib/format-coordinates"

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

export function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isPublic, setIsPublic] = useState(true)
  const [locationName, setLocationName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { user, isAuthenticated } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Use refs for objects that need to persist between renders but don't affect rendering
  const googleMarkers = useRef<Map<string, google.maps.Marker>>(new Map())
  const infoWindows = useRef<Map<string, google.maps.InfoWindow>>(new Map())
  const tempMarkerRef = useRef<google.maps.Marker | null>(null)
  const routePolylineRef = useRef<google.maps.Polyline | null>(null)
  const routeMarkersRef = useRef<google.maps.Marker[]>([])
  const mapClickListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const googleRef = useRef<typeof google | null>(null)

  const [searchInput, setSearchInput] = useState("")
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const placesService = useRef<google.maps.places.PlacesService | null>(null)

  // Function to create a temporary marker when clicking on the map
  const createTempMarker = useCallback(
    (position: google.maps.LatLngLiteral) => {
      if (!map || !googleRef.current) return

      // Remove previous temp marker if it exists
      if (tempMarkerRef.current) {
        tempMarkerRef.current.setMap(null)
      }

      // Create new temp marker
      tempMarkerRef.current = new googleRef.current.maps.Marker({
        position,
        map,
        animation: googleRef.current.maps.Animation.DROP,
        icon: {
          path: googleRef.current.maps.SymbolPath.CIRCLE,
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
      if (!map || !googleRef.current) return

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
      routePolylineRef.current = new googleRef.current.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#3b82f6",
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map,
      })

      // Add markers for start and end points
      const startMarker = new googleRef.current.maps.Marker({
        position: path[0],
        map,
        title: "Start",
        icon: {
          path: googleRef.current.maps.SymbolPath.CIRCLE,
          fillColor: "#22c55e", // Green for start
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
          scale: 8,
        },
      })

      const endMarker = new googleRef.current.maps.Marker({
        position: path[path.length - 1],
        map,
        title: "End",
        icon: {
          path: googleRef.current.maps.SymbolPath.CIRCLE,
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
        const waypointMarker = new googleRef.current.maps.Marker({
          position: path[i],
          map,
          title: `Waypoint ${i}`,
          icon: {
            path: googleRef.current.maps.SymbolPath.CIRCLE,
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
      const bounds = new googleRef.current.maps.LatLngBounds()
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

  // Define addMarkerToMap before it's used
  const addMarkerToMap = useCallback(
    (location: Location) => {
      if (!map || !googleRef.current) return

      // Skip if marker already exists
      if (googleMarkers.current.has(location.id)) return

      const marker = new googleRef.current.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map,
        title: location.name,
        // Updated marker configuration
        icon: {
          url: `data:image/svg+xml,${encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="${location.is_public ? "#22c55e" : "#64748b"}"/>
            </svg>
          `)}`,
          scaledSize: new googleRef.current.maps.Size(24, 24),
          anchor: new googleRef.current.maps.Point(12, 12),
        },
      })

      // Add info window
      const infoWindow = new googleRef.current.maps.InfoWindow({
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

      marker.addListener("click", () => {
        // Close all other info windows
        infoWindows.current.forEach((window) => window.close())
        infoWindow.open(map, marker)
      })

      // Store references
      googleMarkers.current.set(location.id, marker)
      infoWindows.current.set(location.id, infoWindow)
    },
    [map],
  )

  const handlePlaceSelect = async (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current || !map || !googleRef.current) return

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

    const request = {
      input: value,
      types: ["geocode", "establishment"],
      componentRestrictions: { country: "za" }, // Change this to your desired country code
    }

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setSuggestions(predictions)
      } else {
        setSuggestions([])
      }
    })
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

      // Add marker to map
      addMarkerToMap(newLocation)

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

      // Add markers to map
      if (map) {
        allLocations.forEach((location) => {
          addMarkerToMap(location)
        })
      }
    } catch (error: any) {
      toast({
        title: "Error loading locations",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [map, toast, user, addMarkerToMap])

  // Initialize map only once
  useEffect(() => {
    if (!NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      toast({
        title: "API Key Missing",
        description: "Google Maps API key is not configured",
        variant: "destructive",
      })
      return
    }

    let googleMap: google.maps.Map | null = null

    const initializeMap = async () => {
      const loader = new Loader({
        apiKey: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["places"],
      })

      try {
        const google = await loader.load()
        googleRef.current = google

        if (!mapRef.current) return

        googleMap = new google.maps.Map(mapRef.current, {
          center: { lat: -28.4793, lng: 24.6727 }, // Center of South Africa
          zoom: 6,
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
      // Clear all markers and info windows
      googleMarkers.current.forEach((marker) => marker.setMap(null))
      infoWindows.current.forEach((window) => window.close())
      googleMarkers.current.clear()
      infoWindows.current.clear()
    }
  }, [isAuthenticated, toast])

  // Check for URL parameters to center the map or display a route
  useEffect(() => {
    if (!map || !googleRef.current) return

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

      // Add permanent marker to map
      addMarkerToMap(newLocation)

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

  // Memoize the dialog to prevent unnecessary re-renders
  const locationDialog = useMemo(
    () => (
      <Dialog
        open={!!selectedLocation}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLocation(null)
            // Remove temporary marker when dialog is closed without saving
            if (tempMarkerRef.current) {
              tempMarkerRef.current.setMap(null)
              tempMarkerRef.current = null
            }
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Location</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Location Name</Label>
              <Input
                id="name"
                placeholder="Enter a name for this location"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
              <Label htmlFor="public">Make this location public</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedLocation(null)
                // Remove temporary marker when canceling
                if (tempMarkerRef.current) {
                  tempMarkerRef.current.setMap(null)
                  tempMarkerRef.current = null
                }
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveLocation}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
    [selectedLocation, locationName, isPublic, saveLocation],
  )

  const dialogMemo = useMemo(() => locationDialog, [locationDialog])

  return (
    <div className="h-full relative"
    role="region"
    aria-label="Map container"
    aria-busy={isLoading}>
      
      <div ref={mapRef} className="map-container" />

      {/* Search input */}
      <div className="absolute top-4 left-4 z-10 w-64">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search locations..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-white shadow-lg"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

          {suggestions.length > 0 && (
            <Card className="absolute mt-1 w-full shadow-lg z-50">
              <ul className="py-2 max-h-64 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.place_id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    onClick={() => handlePlaceSelect(suggestion)}
                  >
                    {suggestion.description}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {/* Add the coordinate input button in the top right corner */}
      <div className="absolute top-4 right-4 z-10">
        <CoordinateInput onSaveLocation={saveLocationFromCoordinates} />
      </div>

      {/* Floating action buttons */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Dialog open={!!selectedLocation} onOpenChange={(open) => !open && setSelectedLocation(null)}>
          <DialogTrigger asChild>
            <Button size="icon" className="rounded-full shadow-lg">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Location</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Location Name</Label>
                <Input
                  id="name"
                  placeholder="Enter a name for this location"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
                <Label htmlFor="public">Make this location public</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedLocation(null)}>
                Cancel
              </Button>
              <Button onClick={saveLocation}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button size="icon" variant="outline" className="rounded-full shadow-lg" onClick={() => router.push("/routes")}>
          <RouteIcon className="h-5 w-5" />
        </Button>

        <Button
          size="icon"
          variant="outline"
          className="rounded-full shadow-lg"
          onClick={() => router.push("/explore")}
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Saved locations panel */}
      <Card className="absolute left-4 bottom-4 w-64 shadow-lg">
        <div className="p-4">
          <h3 className="font-semibold mb-2 flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            Saved Locations
          </h3>
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : markers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved locations yet</p>
            ) : (
              <ul className="space-y-2">
                {markers.map((marker) => (
                  <li key={marker.id} className="text-sm flex items-center justify-between">
                    <span className="truncate">{marker.name}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${marker.is_public ? "bg-green-500" : "bg-slate-500"}`}
                    ></span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
