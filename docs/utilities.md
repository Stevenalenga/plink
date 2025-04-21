# Utility Functions

## Coordinate Formatting (`lib/format-coordinates.ts`)

Utilities for formatting geographic coordinates in human-readable formats.

### Functions:

#### `formatCoordinate(coordinate: number, isLatitude: boolean): string`

Formats a decimal coordinate value to degrees, minutes, seconds (DMS) format.

**Parameters:**
- `coordinate`: The decimal coordinate value
- `isLatitude`: Boolean indicating if the coordinate is latitude (true) or longitude (false)

**Returns:**
- Formatted string in DMS format with direction indicator (e.g., "40° 42' 51" N")

**Example:**
\`\`\`typescript
formatCoordinate(40.7128, true) // Returns "40° 42' 46" N"
formatCoordinate(-74.006, false) // Returns "74° 0' 21" W"
\`\`\`

#### `formatLocation(lat: number, lng: number): string`

Formats a location with latitude and longitude for display.

**Parameters:**
- `lat`: Latitude value
- `lng`: Longitude value

**Returns:**
- Formatted string with both coordinates in DMS format

**Example:**
\`\`\`typescript
formatLocation(40.7128, -74.006) // Returns "40° 42' 46" N, 74° 0' 21" W"
\`\`\`

### Usage:

These utilities are used throughout the application to display coordinates in a user-friendly format:

- In location info windows on the map
- In the location list on the profile page
- In location detail views

\`\`\`

Let's add documentation for the user flows, including the new coordinate input flow:
