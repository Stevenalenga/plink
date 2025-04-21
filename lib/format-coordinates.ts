/**
 * Formats decimal coordinates to degrees, minutes, seconds format
 * @param coordinate The decimal coordinate value
 * @param isLatitude Whether the coordinate is latitude (true) or longitude (false)
 * @returns Formatted coordinate string
 */
export function formatCoordinate(coordinate: number, isLatitude: boolean): string {
  const absolute = Math.abs(coordinate)
  const degrees = Math.floor(absolute)
  const minutesNotTruncated = (absolute - degrees) * 60
  const minutes = Math.floor(minutesNotTruncated)
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60)

  const direction = isLatitude ? (coordinate >= 0 ? "N" : "S") : coordinate >= 0 ? "E" : "W"

  return `${degrees}° ${minutes}' ${seconds}" ${direction}`
}

/**
 * Formats a location with latitude and longitude for display
 * @param lat Latitude value
 * @param lng Longitude value
 * @returns Formatted coordinates string
 */
export function formatLocation(lat: number, lng: number): string {
  return `${formatCoordinate(lat, true)}, ${formatCoordinate(lng, false)}`
}
