import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      // Anonymous user - only public locations
      const supabase = createServerSupabaseClient()
      const { data, error } = await supabase
        .from('locations')
        .select(`
          *,
          users (
            id,
            name,
            avatar_url
          )
        `)
        .eq('visibility', 'public')

      if (error) throw error
      return NextResponse.json(data)
    }

    // For authenticated users, we need to set the auth context
    const token = authHeader.replace('Bearer ', '')
    const supabase = createServerSupabaseClient(token)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    let query = supabase
      .from('locations')
      .select(`
        *,
        users (
          id,
          name,
          avatar_url
        )
      `)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    // Apply visibility filters
    if (userId && userId !== user.id) {
      // Viewing another user's locations
      const { data: followData } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)

      const isFollowing = followData && followData.length > 0

      if (isFollowing) {
        // Following, can see public and followers
        query = query.in('visibility', ['public', 'followers'])
      } else {
        // Not following, only public
        query = query.eq('visibility', 'public')
      }
    }
    // If own locations, show all

    const { data, error } = await query
    if (error) throw error

    let filteredData = data || []
    
    // Filter locations with selective follower sharing
    if (userId && userId !== user.id) {
      // Check if any followers-only locations have selective sharing
      const followersLocations = filteredData.filter(loc => loc.visibility === 'followers')
      
      if (followersLocations.length > 0) {
        const locationIds = followersLocations.map(loc => loc.id)
        
        // Check which locations have selective sharing
        const { data: locationFollowers } = await supabase
          .from('location_followers')
          .select('location_id')
          .in('location_id', locationIds)
        
        const locationsWithSelectiveSharing = new Set(
          locationFollowers?.map(lf => lf.location_id) || []
        )
        
        // Check which locations the current user has access to
        const { data: userAccess } = await supabase
          .from('location_followers')
          .select('location_id')
          .in('location_id', locationIds)
          .eq('follower_id', user.id)
        
        const accessibleLocationIds = new Set(
          userAccess?.map(ua => ua.location_id) || []
        )
        
        // Filter: keep locations without selective sharing OR with explicit access
        filteredData = filteredData.filter(loc => {
          if (loc.visibility !== 'followers') return true
          if (!locationsWithSelectiveSharing.has(loc.id)) return true
          return accessibleLocationIds.has(loc.id)
        })
      }
    }

    return NextResponse.json(filteredData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createServerSupabaseClient(token)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { name, lat, lng, visibility = 'private', url, expires_at, selectedFollowers, accepts_bids = false } = await request.json()

    if (!name || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    if (!['public', 'followers', 'private'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 })
    }

    // Prepare location data
    const locationData: any = {
      user_id: user.id,
      name,
      lat,
      lng,
      visibility,
    }

    // Add optional fields
    if (url !== undefined) {
      locationData.url = url
    }

    // Handle expiration for ALL visibility types (user-controlled)
    if (expires_at !== undefined) {
      locationData.expires_at = expires_at
    }

    // Handle accepts_bids for public locations
    if (visibility === 'public' && accepts_bids !== undefined) {
      locationData.accepts_bids = accepts_bids
    }

    const { data, error } = await supabase
      .from('locations')
      .insert(locationData)
      .select()

    if (error) throw error

    const newLocation = data[0]

    // If selective followers are specified, add them to location_followers table
    if (visibility === 'followers' && selectedFollowers && Array.isArray(selectedFollowers) && selectedFollowers.length > 0) {
      const locationFollowersData = selectedFollowers.map(followerId => ({
        location_id: newLocation.id,
        follower_id: followerId,
      }))

      const { error: lfError } = await supabase
        .from('location_followers')
        .insert(locationFollowersData)

      if (lfError) {
        console.error('Error adding location followers:', lfError)
        // Don't throw - location was created successfully
      }
    }

    return NextResponse.json(newLocation)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}