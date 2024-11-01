export interface SavedLocation {
  name: string;
  lat: number;
  lng: number;
}

export function saveLocations(locations: SavedLocation[]): void {
  localStorage.setItem('savedLocations', JSON.stringify(locations));
}

export function loadLocations(): SavedLocation[] {
  const savedLocationsString = localStorage.getItem('savedLocations');
  return savedLocationsString ? JSON.parse(savedLocationsString) : [];
}
