import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Tables = {
  users: {
    id: string
    name: string
    email: string
    avatar_url: string | null
    created_at: string
    updated_at: string
  }
  locations: {
    id: string
    user_id: string
    name: string
    lat: number
    lng: number
    visibility: 'public' | 'followers' | 'private'
    url?: string | null  // Add this line for URL support
    created_at: string
    updated_at: string
  }
  routes: {
    id: string
    user_id: string
    name: string
    description: string | null
    visibility: 'public' | 'followers' | 'private'
    created_at: string
    updated_at: string
  }
  route_points: {
    id: string
    route_id: string
    lat: number
    lng: number
    order_index: number
    name: string | null
    created_at: string
  }
  followers: {
    id: string
    follower_id: string
    following_id: string
    created_at: string
  }
}
