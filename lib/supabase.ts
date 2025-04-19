import { createClient } from "@supabase/supabase-js"
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } from "@/app/env"

if (!NEXT_PUBLIC_SUPABASE_URL) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
if (!NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY")

export const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

export type Tables = {
  users: {
    id: string
    name: string
    email: string
    avatar_url: string | null
    created_at: string
  }
  locations: {
    id: string
    user_id: string
    name: string
    lat: number
    lng: number
    is_public: boolean
    created_at: string
  }
  routes: {
    id: string
    user_id: string
    name: string
    description: string
    is_public: boolean
    created_at: string
  }
  route_points: {
    id: string
    route_id: string
    lat: number
    lng: number
    order: number
  }
}
