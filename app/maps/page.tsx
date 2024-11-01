'use client'

import { useState, useEffect, useRef } from 'react'
import { useLoadScript, GoogleMap, OverlayView } from '@react-google-maps/api'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User, MessageSquare, Bell, Settings } from 'lucide-react'
import Link from 'next/link'
import CustomMarker, {CustomMarkerProps} from '@/components/ui/custommarker'





const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 64px)', // Adjust based on your header height
}

const center = {
  lat: 0, // Default to center of the world
  lng: 0,
}





export default function MapPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null)
  const [markers, setMarkers] = useState<CustomMarkerProps[]>([
    { lat: 0, lng: 0, imageUrl: 'https://picsum.photos/200' },
  ])

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ['places'],
  })

  useEffect(() => {
    if (isLoaded && map) {
      const searchBox = new google.maps.places.SearchBox(
        document.getElementById('search-input') as HTMLInputElement
      )
      searchBoxRef.current = searchBox

      map.controls[google.maps.ControlPosition.TOP_RIGHT].push(
        document.getElementById('search-container') as HTMLElement
      )

      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces()
        if (places && places.length > 0 ) {
          const bounds = new google.maps.LatLngBounds()
          places.forEach((place) => {
            if (place.geometry && place.geometry.location) {
              bounds.extend(place.geometry.location)
            }
          })
          map.fitBounds(bounds)

          // Add a new marker for the searched location
          if (places[0].geometry && places[0].geometry.location) {
            const newMarker = {
              lat: places[0].geometry.location.lat(),
              lng: places[0].geometry.location.lng(),
              imageUrl: `https://picsum.photos/200?random=${Date.now()}`,
            }
            setMarkers((prevMarkers) => [...prevMarkers, newMarker])
          }
        }
      })
    }
  }, [isLoaded, map])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchBoxRef.current) {
      const places = searchBoxRef.current.getPlaces()
      if (places && places.length > 0) {
        const bounds = new google.maps.LatLngBounds()
        places.forEach((place) => {
          if (place.geometry && place.geometry.location) {
            bounds.extend(place.geometry.location)
          }
        })
        if (map) {
          map.fitBounds(bounds)
        }
      }
    }
  }

  if (loadError) return <div>Error loading maps</div>
  if (!isLoaded) return <div>Loading maps</div>

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            My Maps
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/profile">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </Button>
            </Link>
            <Link href="/messages">
              <Button variant="ghost" size="icon">
                <MessageSquare className="h-5 w-5" />
                <span className="sr-only">Messages</span>
              </Button>
            </Link>
            <Link href="/notifications">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-grow relative">
        <div id="search-container" className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md px-4">
          <form onSubmit={handleSearch} className="relative">
            <Input
              id="search-input"
              type="text"
              placeholder="Search for a place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 rounded-full"
              style={{ paddingRight: '2.5rem' }} // Ensure space for the search icon
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
              style={{ zIndex: 10 }} // Ensure the button is above the input
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </form>
        </div>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={3}
          center={center}
          onLoad={setMap}
        >
          {markers.map((marker, index) => (
            <OverlayView
              key={index}
              position={{ lat: marker.lat, lng: marker.lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            >
              <CustomMarker {...marker} />
            </OverlayView>
          ))}
        </GoogleMap>
      </main>
    </div>
  )
}