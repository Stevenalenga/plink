'use client';

import React, { useState, useEffect } from 'react';
import { useLoadScript, GoogleMap } from '@react-google-maps/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import CustomMarker from '@/components/ui/custom-teardrop-marker';
import ErrorMessage from '@/errors/errors';
import { LocationDetails } from './location-details';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Navbar } from '@/components/ui/navbar';

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 64px)', // Adjust for header height
};

const center = {
  lat: 37.7749,
  lng: -122.4194,
};

const mockComments = [
  {
    id: '1',
    user: 'John Doe',
    avatar: '/avatars/johndoe.png',
    text: 'Great place!',
    date: new Date().toISOString(),
  },
  {
    id: '2',
    user: 'Jane Smith',
    avatar: '/avatars/janesmith.png',
    text: 'Beautiful scenery!',
    date: new Date().toISOString(),
  },
];

const MapsPage = () => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  });

  const { isAuthenticated, authToken } = useAuth();
  const router = useRouter();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<{ lat: number; lng: number; name: string; description: string; imageUrl: string; }[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; name: string; description: string; imageUrl: string; } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !authToken) {
      console.log('User not authenticated or no token, redirecting to login');
      router.push('/login');
    } else {
      console.log('User authenticated with token, staying on maps page');
      // Fetch markers from API here based on authToken
      const mockMarkers = [
        { lat: 37.7749, lng: -122.4194, name: 'Marker 1', description: 'Description 1', imageUrl: '/marker1.png' },
        { lat: 34.0522, lng: -118.2437, name: 'Marker 2', description: 'Description 2', imageUrl: '/marker2.png' },
      ];
      setMarkers(mockMarkers);
    }
  }, [isAuthenticated, authToken, router]);

  const handleSearch = () => {
    // Implement search logic here
    console.log('Search query:', searchQuery);
  };

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading maps</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex justify-between items-center p-4 bg-primary text-primary-foreground">
        <h1 className="text-2xl font-bold">Maps</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pr-10"
            />
            <Button 
              onClick={handleSearch}
              className="absolute right-0 top-0 bottom-0"
              variant="ghost"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Navbar />
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
                onClick={() => setSelectedLocation(marker)}
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
    </div>
  );
}

export default MapsPage;

