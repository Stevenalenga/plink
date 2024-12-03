'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLoadScript, GoogleMap } from '@react-google-maps/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Search, Save } from 'lucide-react';
import CustomMarker from '@/components/ui/custom-teardrop-marker';
import ErrorMessage from '@/errors/errors';
import { LocationDetails } from './location-details';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Navbar } from '@/components/ui/navbar';

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 64px)',
  position: 'relative' as const,
};

const center = {
  lat: 0,
  lng: 0,
};

interface SavedMarker {
  lat: number;
  lng: number;
  imageUrl: string;
  name: string;
  description: string;
  context: string;
}

interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  date: string;
}

const MapsPage = () => {
  const { isAuthenticated, authToken } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const [markers, setMarkers] = useState<SavedMarker[]>([
    { lat: 0, lng: 0, imageUrl: 'https://picsum.photos/200', name: 'Default Location', description: 'This is a default location', context: '' },
  ]);
  const [savedMarkers, setSavedMarkers] = useState<SavedMarker[]>([]);
  const [currentPlace, setCurrentPlace] = useState<SavedMarker | null>(null);
  const [saveFormData, setSaveFormData] = useState({
    name: '',
    description: '',
    context: '',
  });
  const [selectedLocation, setSelectedLocation] = useState<SavedMarker | null>(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ['places'],
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mockComments: Comment[] = [
    { id: '1', user: 'Alice', avatar: 'https://picsum.photos/id/1/200', text: 'Great place!', date: '2023-06-01' },
    { id: '2', user: 'Bob', avatar: 'https://picsum.photos/id/2/200', text: 'I love visiting here.', date: '2023-06-02' },
    { id: '3', user: 'Charlie', avatar: 'https://picsum.photos/id/3/200', text: 'Highly recommended!', date: '2023-06-03' },
  ];

  useEffect(() => {
    if (!isAuthenticated || !authToken) {
      console.log('User not authenticated or no token, redirecting to login');
      router.push('/login');
    } else {
      console.log('User authenticated with token, staying on maps page');
      // Fetch markers from API here based on authToken
      const mockMarkers = [
        { lat: 37.7749, lng: -122.4194, name: 'Marker 1', description: 'Description 1', imageUrl: '/marker1.png', context: '' },
        { lat: 34.0522, lng: -118.2437, name: 'Marker 2', description: 'Description 2', imageUrl: '/marker2.png', context: '' },
      ];
      setMarkers(mockMarkers);
    }
  }, [isAuthenticated, authToken, router]);

  useEffect(() => {
    if (isLoaded && map) {
      const searchBox = new google.maps.places.SearchBox(
        document.getElementById('search-input') as HTMLInputElement
      );
      searchBoxRef.current = searchBox;
      map.controls[google.maps.ControlPosition.TOP_RIGHT].push(
        document.getElementById('search-container') as HTMLElement
      );
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        if (places && places.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          places.forEach((place) => {
            if (place.geometry && place.geometry.location) {
              bounds.extend(place.geometry.location);
            }
          });
          map.fitBounds(bounds);
          if (places[0].geometry && places[0].geometry.location) {
            const newMarker: SavedMarker = {
              lat: places[0].geometry.location.lat(),
              lng: places[0].geometry.location.lng(),
              imageUrl: `https://picsum.photos/200?random=${Date.now()}`,
              name: places[0].name || 'Unnamed Location',
              description: places[0].formatted_address || 'No description available',
              context: '',
            };
            setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
            setCurrentPlace(newMarker);
            setSaveFormData(prev => ({ ...prev, name: places[0].name || '' }));
            setSearchQuery(places[0].formatted_address || places[0].name || '');
          }
        } else {
          setErrorMessage('No results found for your search.');
        }
      });
    }
  }, [isLoaded, map]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchBoxRef.current) {
      const places = searchBoxRef.current.getPlaces();
      if (places && places.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        places.forEach((place) => {
          if (place.geometry && place.geometry.location) {
            bounds.extend(place.geometry.location);
          }
        });
        if (map) {
          map.fitBounds(bounds);
        }
        setSearchQuery(places[0].formatted_address || places[0].name || '');
      } else {
        setErrorMessage('No results found for your search.');
      }
    }
  };

  const handleSaveMarker = () => {
    if (currentPlace) {
      const newSavedMarker: SavedMarker = {
        ...currentPlace,
        ...saveFormData,
        imageUrl: currentPlace.imageUrl || `https://picsum.photos/200?random=${Date.now()}`,
      };
      setSavedMarkers(prev => [...prev, newSavedMarker]);
      setMarkers(prev => [...prev, newSavedMarker]);
      setSaveFormData({ name: '', description: '', context: '' });
    }
  };

  const handleMarkerClick = (marker: SavedMarker) => {
    setSelectedLocation(marker);
  };

  if (loadError) return <ErrorMessage error={new Error("Error loading maps. Please check your internet connection.")} reset={() => window.location.reload()} />;
  if (!isLoaded) return <div className="flex items-center justify-center h-screen">Loading maps...</div>;

  return (
    <div className="flex flex-col h-screen relative">
      <header className="flex justify-between items-center p-4 bg-primary text-primary-foreground">
        <h1 className="text-2xl font-bold">Maps</h1>
        <div className="flex items-center space-x-4">
          <div id="search-container" className="relative">
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <Input
                id="search-input"
                type="text"
                placeholder="Search for places..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pr-10"
              />
              <Button 
                type="submit"
                className="absolute right-0 top-0 bottom-0"
                variant="ghost"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
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
      </header>
      <main className="flex-1 relative">
        <div style={mapContainerStyle}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={2}
            onLoad={(map) => setMap(map)}
          >
            {markers.map((marker, index) => (
              <CustomMarker 
                key={index} 
                lat={marker.lat}
                lng={marker.lng}
                imageUrl={marker.imageUrl}
                onClick={() => handleMarkerClick(marker)}
              />
            ))}
          </GoogleMap>
        </div>
        {errorMessage && <ErrorMessage error={new Error(errorMessage)} reset={() => setErrorMessage(null)} />}
        {selectedLocation && (
          <LocationDetails
            name={selectedLocation.name}
            description={selectedLocation.description}
            comments={mockComments}
          />
        )}
      </main>
      <Navbar />
    </div>
  );
}

export default MapsPage;