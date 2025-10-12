import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      // Anonymous user - only public locations
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
    // This is simplified - in production, you'd validate the JWT
    const token = authHeader.replace('Bearer ', '')
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

      if (followData && followData.length > 0) {
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

    return NextResponse.json(data)
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
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { name, lat, lng, visibility = 'private', url, expires_at } = await request.json()

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

    // Handle expiration - database trigger will set default for public, but we respect user preference
    if (expires_at !== undefined) {
      locationData.expires_at = expires_at
    }

    const { data, error } = await supabase
      .from('locations')
      .insert(locationData)
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}