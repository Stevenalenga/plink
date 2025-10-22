"use client"

import { useState, useEffect, useCallback } from "react"
import { SavedRoute, NavigationState, NavigationPosition } from "@/types"

const WAYPOINT_REACHED_THRESHOLD = 50 // meters

export function useRouteNavigation() {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    currentRoute: null,
    currentWaypointIndex: 0,
    distanceToNextWaypoint: 0,
    totalDistanceRemaining: 0,
    estimatedTimeRemaining: 0,
  })

  const [userPosition, setUserPosition] = useState<NavigationPosition | null>(null)

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }, [])

  // Calculate total remaining distance from current position
  const calculateRemainingDistance = useCallback(
    (currentPos: { lat: number; lng: number }, waypointIndex: number, route: SavedRoute): number => {
      if (!route.points || waypointIndex >= route.points.length) return 0

      let totalDistance = 0

      // Distance to next waypoint
      const nextWaypoint = route.points[waypointIndex]
      totalDistance += calculateDistance(currentPos.lat, currentPos.lng, nextWaypoint.lat, nextWaypoint.lng)

      // Distance between remaining waypoints
      for (let i = waypointIndex; i < route.points.length - 1; i++) {
        const wp1 = route.points[i]
        const wp2 = route.points[i + 1]
        totalDistance += calculateDistance(wp1.lat, wp1.lng, wp2.lat, wp2.lng)
      }

      return totalDistance
    },
    [calculateDistance]
  )

  // Start navigation
  const startNavigation = useCallback((route: SavedRoute) => {
    if (!route.points || route.points.length < 2) {
      console.error("Route must have at least 2 waypoints")
      return
    }

    setNavigationState({
      isNavigating: true,
      currentRoute: route,
      currentWaypointIndex: 0,
      distanceToNextWaypoint: 0,
      totalDistanceRemaining: route.distance || 0,
      estimatedTimeRemaining: route.estimated_duration || 0,
    })
  }, [])

  // Stop navigation
  const stopNavigation = useCallback(() => {
    setNavigationState({
      isNavigating: false,
      currentRoute: null,
      currentWaypointIndex: 0,
      distanceToNextWaypoint: 0,
      totalDistanceRemaining: 0,
      estimatedTimeRemaining: 0,
    })
    setUserPosition(null)
  }, [])

  // Update user position
  const updateUserPosition = useCallback((position: NavigationPosition) => {
    setUserPosition(position)
  }, [])

  // Update navigation state when user position changes
  useEffect(() => {
    if (!navigationState.isNavigating || !navigationState.currentRoute || !userPosition) {
      return
    }

    const route = navigationState.currentRoute
    const currentWaypointIndex = navigationState.currentWaypointIndex

    // Check if route is completed
    if (currentWaypointIndex >= route.points.length - 1) {
      return
    }

    const targetWaypoint = route.points[currentWaypointIndex]
    const distanceToTarget = calculateDistance(
      userPosition.lat,
      userPosition.lng,
      targetWaypoint.lat,
      targetWaypoint.lng
    )

    // Check if waypoint is reached
    if (distanceToTarget <= WAYPOINT_REACHED_THRESHOLD) {
      const nextIndex = currentWaypointIndex + 1

      // If not the last waypoint, move to next
      if (nextIndex < route.points.length) {
        const nextWaypoint = route.points[nextIndex]
        const distanceToNext = calculateDistance(
          userPosition.lat,
          userPosition.lng,
          nextWaypoint.lat,
          nextWaypoint.lng
        )

        const totalRemaining = calculateRemainingDistance(userPosition, nextIndex, route)

        setNavigationState((prev) => ({
          ...prev,
          currentWaypointIndex: nextIndex,
          distanceToNextWaypoint: distanceToNext,
          totalDistanceRemaining: totalRemaining,
        }))
      } else {
        // Route completed
        setNavigationState((prev) => ({
          ...prev,
          currentWaypointIndex: nextIndex,
          distanceToNextWaypoint: 0,
          totalDistanceRemaining: 0,
          estimatedTimeRemaining: 0,
        }))
      }
    } else {
      // Update distances
      const totalRemaining = calculateRemainingDistance(userPosition, currentWaypointIndex, route)

      setNavigationState((prev) => ({
        ...prev,
        distanceToNextWaypoint: distanceToTarget,
        totalDistanceRemaining: totalRemaining,
      }))
    }
  }, [navigationState, userPosition, calculateDistance, calculateRemainingDistance])

  // Get current target waypoint
  const getCurrentTargetWaypoint = useCallback(() => {
    if (!navigationState.isNavigating || !navigationState.currentRoute) {
      return null
    }

    const route = navigationState.currentRoute
    const index = navigationState.currentWaypointIndex

    if (index >= route.points.length) {
      return null
    }

    return route.points[index]
  }, [navigationState])

  // Calculate bearing to target (for arrow direction)
  const calculateBearing = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δλ = ((lng2 - lng1) * Math.PI) / 180

    const y = Math.sin(Δλ) * Math.cos(φ2)
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)

    const θ = Math.atan2(y, x)
    return ((θ * 180) / Math.PI + 360) % 360 // Convert to degrees
  }, [])

  // Get bearing to current target
  const getBearingToTarget = useCallback(() => {
    const target = getCurrentTargetWaypoint()
    if (!target || !userPosition) {
      return 0
    }

    return calculateBearing(userPosition.lat, userPosition.lng, target.lat, target.lng)
  }, [getCurrentTargetWaypoint, userPosition, calculateBearing])

  return {
    ...navigationState,
    userPosition,
    startNavigation,
    stopNavigation,
    updateUserPosition,
    getCurrentTargetWaypoint,
    getBearingToTarget,
    calculateDistance,
  }
}
