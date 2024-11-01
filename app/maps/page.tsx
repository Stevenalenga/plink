'use client';

/// <reference types="@types/google.maps" />

import { useState, useRef, useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from 'lucide-react'
import { SavedLocation, saveLocations, loadLocations } from './locations/savedLocations';
import { Header } from '@/components/ui/header';
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

const markerImages = [
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAJOSURBVFhH7ZY9aBRBFMf/m9vbvdvb3CUhiSaaIEYRFEkRFEkXbLSwsLCwsLGxsLCwsLCwsLCwsLCwsLAQBCEgCMEPCEKCkECCXnJ7l9vP2Zk3t3vnEXO5bHKFP3iw+2bem/f+O7PLDmm3298Gq+svEaF6aNjmkhZFRJ4KKVRx8jzPwD0/7EmWZRDCQwh+2FMCvjfLer0eGo0GXNeFZVkGz/OQJAlc1zXXKIqMXhAEiOPY6HVdN3q9D/UtOHrzCm5MPcDJ8XEcnJyEk6YmHIBpmiaEYYjFxUUsLCwYkjAMUa/XMTMzg62tLbTbbRNT1YIgDLF/7wj2jY2h5rqYmJhAq9XC9va2CXddF57nwfd9GIaBVquFer2Ozc1NQ+D7PjzPQ5qmJj8IAjiOY+JKo2qBYRhYXV3FxMTEP0f+L6gWKBJVVlGVlRmoWqBIVFlFVVZmoGqBIlFlFVVZmYGqBYpElVVUZWUGqhYoElVWUZWVGahaQNWCqgWKRJVVVGVlBqoWULWgagFVC6oWKBJVVlGVlRmoWkDVgqoFVC2oWqBIVFlFVVZmoGoBVQuqFlC1oGqBIlFlFVVZmYGqBVQtqFpA1YKqBYpElVVUZWUGqhZQtaBqAVULqhYoElVWUZWVGahaQNWCqgVULahaoEhUWUVVVmagagFVC6oWULWgaoEiUWUVVVmZgaoFVC2oWkDVgqoFikSVVVRlZQaqFlC1oGoBVQuqFigSVVZRlZUZqFpA1YKqBVQtqFqgSFRZRVVWZqBqAVULqhYoElVWUZWVGahaQNWCqgVULahaoEhUWUVVVmagagFVC6oWULWgaoEiUWUVVVmZgaoFVC2oWkDVgqoFikSVVVRlZQaqFlC1oGoBVQuqFigSVVZRlZUZqFpA1YKqBVQtqFqgSFRZRVVWZqBqAVULqhZQtaBqgSJRZRVV+RdJQXq5EngmCAAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAJTSURBVFhH7ZY9aBRBFMf/M7N7l9vLJblLCEiMGhHxC0XEgI2FhYVgYWFhYWNjYWFhYWFhYWFhYWFhIQhCQBCCIAQCEgJJCOaSu9zX7O3XvJm93STm9tgkV/iDB8vOzJv3/js7LDt0dXX1Zbfb3UGE6qFhm0taFBF5KqRQxcnzPAP3/LAnWZZBCA8h+GFPCfjeLOv1epifn4frurAsywAA0jSF67rmGkWR0QuCAHEcG73RaKDZbJp7fQvOXL+Mm9P3cXpiAoenp+GkqQkHYJqmCWEYYmlpCYuLi4YkDEPU63XMzs5ia2sL7XbbxFS1IAxDHNh3EPvHxtBwXUxOTqLVamF7e9uEu64Lz/Pg+z4Mw0Cr1UK9XsfGxoYh8H0fnueZvCAI4DiOiataoFqgSFRZRVVWZqBqgSJRZRVVWZmBqgWKRJVVVGVlBqoWKBJVVlGVlRmoWqBIVFlFVVZmoGqBIlFlFVVZmYGqBVQtqFqgSFRZRVVWZqBqAVULqhYoElVWUZWVGahaQNWCqgVULahaoEhUWUVVVmagagFVC6oWULWgaoEiUWUVVVmZgaoFVC2oWkDVgqoFikSVVVRlZQaqFlC1oGoBVQuqFigSVVZRlZUZqFpA1YKqBVQtqFqgSFRZRVVWZqBqAVULqhZQtaBqgSJRZRVVWZmBqgVULahagKoFVQsUiSqrqMrKDFQtoGpB1QJULahaoEhUWUVVVmagagFVC6oWoGpB1QJFosoqqrIyA1ULqFpQtQBVC6oWKBJVVlGVlRmoWkDVgqoFqFpQtUCRqLKKqvwLdYF6uYx5UqwAAAAASUVORK5CYII=',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAJQSURBVFhH7ZY9aBRBFMf/M7O3l9vL5e6SQyOKEo0KihEFCwsLCwsLGwsLCwsLCwsLCwsLCwsLQRAEQQgIQSAIAUHwK2o0yWUvX7tfu/Nm9jYX2L3bSxp/8GDZmXnz3n9nhmWHrq2tPe/1ejuIUD00bHNJiyIiT4UUqjh5nmfgnh/2JMsyCOEhBD/sSQHfm2WTyQSLi4twXReWZRkAQJqmcF3XXKMoMnpBECCOY6M3nU4xGo3MvbEFZ69fwq3ZOzg9PY3DjQacNDXhAEzTNCEMQywvL2NpaQlhGCIMQ9TrdczNzWFzcxOdTsfEVLUgDEMc2HcQ+ycn0XBdTE1NodVqYWtrywS7rgvP8+D7PgzDQKvVQr1ex/r6uiHwfR+e55m8IAjgOI6Jq1qgWqBIVFlFVVZmoGqBIlFlFVVZmYGqBYpElVVUZWUGqhYoElVWUZWVGahaQNWCqgWKRJVVVGVlBqoWULWgaoEiUWUVVVmZgaoFVC2oWqBIVFlFVVZmoGoBVQuqFlC1oGqBIlFlFVVZmYGqBVQtqFpA1YKqBYpElVVUZWUGqhZQtaBqAVULqhYoElVWUZWVGahaQNWCqgVULahaoEhUWUVVVmagagFVC6oWULWgaoEiUWUVVVmZgaoFVC2oWkDVgqoFikSVVVRlZQaqFlC1oGoBVQuqFigSVVZRlZUZqFpA1YKqBVQtqFqgSFRZRVVWZqBqAVULqhZQtaBqgSJRZRVVWZmBqgVULahagKoFVQsUiSqrqMrKDFQtoGpB1QJULahaoEhUWUVV/gWbRnq5+4qALwAAAABJRU5ErkJggg=='
];

const createCustomMarker = (latlng: google.maps.LatLng, map: google.maps.Map) => {
  const randomImage = markerImages[Math.floor(Math.random() * markerImages.length)];
  
  const markerSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
      <circle cx="20" cy="20" r="19" fill="white" stroke="#3498db" stroke-width="2"/>
      <image href="${randomImage}" width="36" height="36" x="2" y="2" clip-path="url(#circleView)" />
      <defs>
        <clipPath id="circleView">
          <circle cx="20" cy="20" r="18" />
        </clipPath>
      </defs>
    </svg>
  `;

  const marker = new google.maps.Marker({
    position: latlng,
    map,
    icon: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(markerSvg),
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 20),
    },
  });

  return marker;
};

export default function MapsPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [currentMarker, setCurrentMarker] = useState<google.maps.Marker | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const searchParams = useSearchParams();
  const [autocomplete, setAutocomplete] = useState<google.maps.places.AutocompleteService | null>(null);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: "weekly",
        libraries: ["places"]
      });

      const { Map } = await loader.importLibrary('maps');
      const { AutocompleteService } = await loader.importLibrary('places') as google.maps.PlacesLibrary;

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
        createCustomMarker(new google.maps.LatLng(location.lat, location.lng), map);
      });

      if (lat && lng && name) {
        createCustomMarker(new google.maps.LatLng(parseFloat(lat), parseFloat(lng)), map);
      }

      const autocompleteService = new AutocompleteService();
      setAutocomplete(autocompleteService);
    };

    initMap();
  }, [searchParams]);

  useEffect(() => {
    if (autocomplete && searchInput) {
      autocomplete.getPlacePredictions(
        { input: searchInput },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        }
      );
    } else {
      setSuggestions([]);
    }
  }, [searchInput, autocomplete]);

  const handleSuggestionSelect = (suggestion: google.maps.places.AutocompletePrediction) => {
    setSearchInput(suggestion.description);
    setSuggestions([]);
    handleSearch(suggestion.description);
  };

  const handleSearch = (address: string = searchInput) => {
    if (!map) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        map.setCenter(location);
        map.setZoom(15);
        if (currentMarker) {
          currentMarker.setMap(null);
        }
        const newMarker = createCustomMarker(location, map);
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
    createCustomMarker(new google.maps.LatLng(newLocation.lat, newLocation.lng), map);
    setCurrentMarker(null);
    setSearchInput('');
  };

  return (
    <div className="h-screen flex flex-col">
      <Header savedLocations={savedLocations} />
      <div className="p-4 flex flex-col space-y-2">
        <div className="flex space-x-2">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Search location"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.place_id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    {suggestion.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button onClick={() => handleSearch()}>
            <Search className="h-4 w-4" />
          </Button>
          <Button onClick={handleAddLocation} disabled={!currentMarker}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div ref={mapRef} className="flex-grow" />
    </div>
  );
}
