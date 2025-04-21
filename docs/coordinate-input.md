# Coordinate Input Feature

## Overview

The Coordinate Input feature allows users to save locations by directly entering latitude and longitude coordinates, rather than clicking on the map. This is useful for:

- Adding locations with known coordinates
- Precisely positioning markers
- Adding locations that are outside the current map view

## Components

### CoordinateInput (`components/coordinate-input.tsx`)

A dialog component that collects and validates coordinate data.

#### Props:
- `onSaveLocation`: Callback function that receives the validated location data

#### State:
- `open`: Controls dialog visibility
- `latitude`: String value of the latitude input
- `longitude`: String value of the longitude input
- `locationName`: Name for the location
- `isPublic`: Boolean for public/private visibility
- `errors`: Validation error messages

#### Key Functions:
- `validateCoordinates()`: Ensures latitude is between -90 and 90, and longitude is between -180 and 180
- `handleSubmit()`: Processes form submission after validation

## Integration with Map Container

The `MapContainer` component integrates with the coordinate input feature through:

1. The `saveLocationFromCoordinates` function that:
   - Saves the location to Supabase
   - Adds a marker to the map
   - Centers the map on the new location
   - Shows a success notification

2. Positioning the `CoordinateInput` component in the top-right corner of the map

## User Interface

The coordinate input dialog includes:

- A text field for the location name
- Numeric input fields for latitude and longitude
- Validation error messages for invalid coordinates
- A toggle switch for public/private visibility
- Save and Cancel buttons

## Coordinate Formatting

When coordinates are saved, they are displayed in a human-readable format using the `formatLocation` utility:

- In info windows when clicking markers
- In the location list on the profile page
- In location details

The formatting converts decimal coordinates to degrees, minutes, seconds (DMS) format with directional indicators (N, S, E, W).

## Validation Rules

- **Latitude**: Must be a number between -90 and 90 degrees
- **Longitude**: Must be a number between -180 and 180 degrees
- **Name**: Optional, defaults to "Custom Location" if not provided

## Error Handling

- Invalid coordinates show error messages below the respective input fields
- The form cannot be submitted until all validation errors are resolved
- Network errors during saving are displayed as toast notifications

## Security

- Coordinate input is subject to the same authentication requirements as map-click location saving
- Users must be logged in to save locations
- Row-Level Security in Supabase ensures users can only modify their own locations
