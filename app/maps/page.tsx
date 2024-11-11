'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useLoadScript, GoogleMap } from '@react-google-maps/api'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Search, User, MessageSquare, Bell, Settings, Save } from 'lucide-react'
import Link from 'next/link'
import CustomMarker, { CustomMarkerProps } from '@/components/ui/custom-teardrop-marker'
import ErrorMessage from '@/errors/errors'

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 64px)', 
}

const center = {
  lat: 0,
  lng: 0,
}

interface SavedMarker extends CustomMarkerProps {
  name: string
  description: string
  context: string
}

export default function MapPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null)
  const [markers, setMarkers] = useState<CustomMarkerProps[]>([
    { lat: 0, lng: 0, imageUrl: 'https://picsum.photos/200' },
  ])
  const [savedMarkers, setSavedMarkers] = useState<SavedMarker[]>([])
  const [currentPlace, setCurrentPlace] = useState<{lat: number, lng: number} | null>(null)
  const [saveFormData, setSaveFormData] = useState({
    name: '',
    description: '',
    context: '',
  })
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ['places'],
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
        if (places && places.length > 0) {
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
            setCurrentPlace(newMarker)
            setSaveFormData(prev => ({ ...prev, name: places[0].name || '' }))
            // Update searchQuery with the full place name or formatted address
            setSearchQuery(places[0].formatted_address || places[0].name || '')
          }
        } else {
          setErrorMessage('No results found for your search.')
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
        // Update searchQuery with the full place name or formatted address
        setSearchQuery(places[0].formatted_address || places[0].name || '')
      } else {
        setErrorMessage('No results found for your search.')
      }
    }
  }

  const handleSaveMarker = () => {
    if (currentPlace) {
      const newSavedMarker: SavedMarker = {
        ...currentPlace,
        ...saveFormData,
        imageUrl: 'https://picsum.photos/200', // or any appropriate image URL
      }
      setSavedMarkers(prev => [...prev, newSavedMarker])
      setSaveFormData({ name: '', description: '', context: '' })
    }
  }

  if (loadError) return <ErrorMessage message="Error loading maps. Please check your internet connection." />
  if (!isLoaded) return <div className="flex items-center justify-center h-screen">Loading maps...</div>

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
      <main className="flex-1 flex flex-col">
        <div id="search-container" className="p-4 flex items-center space-x-2">
          <form onSubmit={handleSearch} className="flex items-center space-x-2 flex-grow">
            <Input
              id="search-input"
              type="text"
              placeholder="Search for places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" variant="default">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          </form>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Save className="h-5 w-5" />
                <span className="sr-only">Save location</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Save Location</h4>
                  <p className="text-sm text-muted-foreground">
                    Fill in the details to save this location.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={saveFormData.name}
                    onChange={(e) => setSaveFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter location name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    value={currentPlace?.lat.toFixed(6) || ''}
                    readOnly
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    value={currentPlace?.lng.toFixed(6) || ''}
                    readOnly
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={saveFormData.description}
                    onChange={(e) => setSaveFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter location description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="context">Context</Label>
                  <Input
                    id="context"
                    value={saveFormData.context}
                    onChange={(e) => setSaveFormData(prev => ({ ...prev, context: e.target.value }))}
                    placeholder="Enter location context"
                  />
                </div>
                <Button onClick={handleSaveMarker}>Save Marker</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div style={mapContainerStyle}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={2}
            onLoad={(map) => setMap(map)}
          >
            {markers.map((marker, index) => (
              <CustomMarker key={index} {...marker} />
            ))}
          </GoogleMap>
        </div>
        {errorMessage && <ErrorMessage message={errorMessage} />}
      </main>
    </div>
  )
}