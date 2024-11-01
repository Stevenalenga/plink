'use client';

/// <reference types="@types/google.maps" />

import { useState, useRef, useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from 'lucide-react'
import { SavedLocation, saveLocations, loadLocations } from './locations/savedLocations';
import { Header } from '@/components/ui/Header';
import { useSearchParams } from 'next/navigation';

const libraries: ("places")[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '100vh',
};

const center = {
  lat: 43.6532,
  lng: -79.3832,
};

export default function MapsPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [currentMarker, setCurrentMarker] = useState<google.maps.Marker | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: "weekly",
        libraries: ["places"]
      });

      const { Map } = await loader.importLibrary('maps');
      const { Marker } = await loader.importLibrary('marker') as google.maps.MarkerLibrary;

      const locations = loadLocations();
      setSavedLocations(locations);

      const lat = searchParams.get('lat');
      const lng = searchParams.get('lng');
      const name = searchParams.get('name');

      const mapOptions: google.maps.MapOptions = {
        center: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : { lat: 0, lng: 0 },
        zoom: lat && lng ? 15 : 2
      };

      const map = new Map(mapRef.current!, mapOptions);
      setMap(map);

      locations.forEach(location => {
        new Marker({
          map: map,
          position: { lat: location.lat, lng: location.lng },
          title: location.name,
        });
      });

      if (lat && lng && name) {
        new Marker({
          map: map,
          position: { lat: parseFloat(lat), lng: parseFloat(lng) },
          title: name,
        });
      }
    };

    initMap();
  }, [searchParams]);

  const handleSearch = () => {
    if (!map) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchInput }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        map.setCenter(location);
        map.setZoom(15);
        if (currentMarker) {
          currentMarker.setMap(null);
        }
        const newMarker = new google.maps.Marker({
          map: map,
          position: location,
        });
        setCurrentMarker(newMarker);
      }
    });
  };

  const handleAddLocation = () => {
    if (!map || !currentMarker) return;

    const newLocation: SavedLocation = {
      name: searchInput,
      lat: currentMarker.getPosition()!.lat(),
      lng: currentMarker.getPosition()!.lng(),
    };

    const updatedLocations = [...savedLocations, newLocation];
    setSavedLocations(updatedLocations);
    saveLocations(updatedLocations);

    // Replace the current marker with a permanent one
    currentMarker.setMap(null);
    new google.maps.Marker({
      map: map,
      position: { lat: newLocation.lat, lng: newLocation.lng },
      title: newLocation.name,
    });
    setCurrentMarker(null);
    setSearchInput('');
  };

  return (
    <div className="h-screen flex flex-col">
      <Header savedLocations={savedLocations} />
      <div className="p-4 flex space-x-2">
        <Input
          type="text"
          placeholder="Search location"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
        <Button onClick={handleAddLocation} disabled={!currentMarker}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div ref={mapRef} className="flex-grow" />
    </div>
  );
}
