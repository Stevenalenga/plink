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