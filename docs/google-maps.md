# Google Maps Integration

## Initialization

The map is initialized using the Google Maps JavaScript API via the `@googlemaps/js-api-loader` package:

\`\`\`typescript
const loader = new Loader({
  apiKey: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  version: "weekly",
  libraries: ["places"],
})

const google = await loader.load()
const googleMap = new google.maps.Map(mapRef.current, {
  center: { lat: 40.7128, lng: -74.006 }, // New York
  zoom: 12,
  styles: [/* custom styles */],
})
\`\`\`

## Key Features

### Location Markers

Markers are added to the map with custom styling based on privacy settings:

\`\`\`typescript
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
\`\`\`

### Info Windows

Info windows display location details when markers are clicked:

\`\`\`typescript
const infoWindow = new google.maps.InfoWindow({
  content: `<div><strong>${location.name}</strong><br/>${location.is_public ? "Public" : "Private"}</div>`,
})

marker.addListener("click", () => {
  infoWindow.open(map, marker)
})
\`\`\`

### Places Search

The search bar uses the Google Places API to find locations:

\`\`\`typescript
placesService.current.findPlaceFromQuery(
  request as google.maps.places.FindPlaceFromQueryRequest,
  (results, status) => {
    if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
      // Process results
    }
  }
)
\`\`\`

## Map Click Handling

The map listens for click events to allow users to save new locations:

\`\`\`typescript
googleMap.addListener("click", (event: google.maps.MapMouseEvent) => {
  if (isAuthenticated) {
    setSelectedLocation({
      lat: event.latLng!.lat(),
      lng: event.latLng!.lng(),
    })
  } else {
    // Show login required message
  }
})
