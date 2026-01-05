import { Tables } from '@/lib/supabase'

export type User = Tables['users']
export type Location = Tables['locations']
export type Route = Tables['routes']
export type RoutePoint = Tables['route_points']
export type Follower = Tables['followers']

export type Visibility = 'public' | 'followers' | 'private'

export type UserWithFollowerInfo = User & {
  followersCount: number
  followingCount: number
  isFollowing?: boolean
}

export type FollowAction = 'follow' | 'unfollow'

// Enhanced Route types with navigation features
export interface EnhancedRoute extends Route {
  url?: string | null
  expires_at?: string | null
  distance?: number | null
  estimated_duration?: number | null
  points?: RoutePoint[]
}

export interface SavedRoute extends EnhancedRoute {
  points: RoutePoint[]
}

// Navigation types
export interface NavigationState {
  isNavigating: boolean
  currentRoute: SavedRoute | null
  currentWaypointIndex: number
  distanceToNextWaypoint: number
  totalDistanceRemaining: number
  estimatedTimeRemaining: number
}

export interface RouteWaypoint {
  lat: number
  lng: number
  name?: string
  order: number
}

export interface NavigationPosition {
  lat: number
  lng: number
  accuracy?: number
  heading?: number
  speed?: number
  timestamp: number
}

// Route follower types
export interface RouteFollower {
  id: string
  route_id: string
  follower_id: string
  created_at: string
}

export interface LocationFollower {
  id: string
  location_id: string
  follower_id: string
  created_at: string
}

// Bidding types
export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'expired'

export interface Bid {
  id: string
  location_id: string
  bidder_id: string
  amount: number
  message?: string | null
  status: BidStatus
  created_at: string
  expires_at: string
  updated_at: string
}

export interface BidWithBidder extends Bid {
  bidder: {
    id: string
    name: string
    avatar_url: string | null
    email?: string
  }
}

export interface BidWithLocation extends Bid {
  location: {
    id: string
    name: string
    lat: number
    lng: number
    user_id: string
    visibility: Visibility
    accepts_bids: boolean
  }
}

export interface CreateBidPayload {
  location_id: string
  amount: number
  message?: string
}

export interface UpdateBidPayload {
  amount?: number
  message?: string
  status?: BidStatus
}