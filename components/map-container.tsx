"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Plus, MapPin, RouteIcon, Share2 } from "lucide-react"
import { useUser } from "@/hooks/use-user"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { NEXT_PUBLIC_GOOGLE_MAPS_API_KEY } from "@/app/env"
import { useRouter } from "next/navigation"
import { Loader } from "@googlemaps/js-api-loader"

type Location = {
  id: string
  name: string
  lat: number
  lng: number
  is_public: boolean
  user_id: string
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
  const googleMarkers = useRef<Map<string, google.maps.Marker>>(new Map())
  const infoWindows = useRef<Map<string, google.maps.InfoWindow>>(new Map())

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
  }, [map, toast, user])

  const addMarkerToMap = useCallback(
    (location: Location) => {
      if (!map) return

      // Skip if marker already exists
      if (googleMarkers.current.has(location.id)) return

      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map,
        title: location.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: location.is_public ? "#22c55e" : "#64748b",
          fillOpacity: 1,
          strokeWeight: 0,
          scale: 8,
        },
      })

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `<div><strong>${location.name}</strong><br/>${location.is_public ? "Public" : "Private"}</div>`,
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

  useEffect(() => {
    if (!NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      toast({
        title: "API Key Missing",
        description: "Google Maps API key is not configured",
        variant: "destructive",
      })
      return
    }

    const initializeMap = async () => {
      const loader = new Loader({
        apiKey: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["places"],
      })

      try {
        const google = await loader.load()

        if (!mapRef.current) return

        const googleMap = new google.maps.Map(mapRef.current, {
          center: { lat: 40.7128, lng: -74.006 }, // New York
          zoom: 12,
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

        // Add click listener to map
        googleMap.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (isAuthenticated) {
            setSelectedLocation({
              lat: event.latLng!.lat(),
              lng: event.latLng!.lng(),
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
  }, [isAuthenticated, toast])

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

      // Add marker to map
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

  return (
    <div className="h-full relative">
      <div ref={mapRef} className="map-container" />

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
