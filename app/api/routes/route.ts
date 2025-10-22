import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      // Anonymous user - only public routes
      const supabase = createServerSupabaseClient()
      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          users (
            id,
            name,
            avatar_url
          ),
          route_points (*)
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })

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
    const scope = searchParams.get('scope') // 'public', 'following', or 'all'

    let query = supabase
      .from('routes')
      .select(`
        *,
        users (
          id,
          name,
          avatar_url
        ),
        route_points (*)
      `)

    if (userId) {
      // Filter by specific user
      query = query.eq('user_id', userId)
    } else if (scope === 'public') {
      // Only public routes
      query = query.eq('visibility', 'public')
    } else if (scope === 'following') {
      // Routes from users I'm following
      const { data: following } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id)

      const followingIds = following?.map(f => f.following_id) || []
      
      if (followingIds.length > 0) {
        query = query
          .in('user_id', followingIds)
          .in('visibility', ['public', 'followers'])
      } else {
        // Not following anyone, return empty
        return NextResponse.json([])
      }
    } else {
      // Default: only user's own routes
      query = query.eq('user_id', user.id)
    }

    // Apply visibility filters for other users' routes
    if (userId && userId !== user.id) {
      const { data: followData } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)

      const isFollowing = followData && followData.length > 0

      if (isFollowing) {
        query = query.in('visibility', ['public', 'followers'])
      } else {
        query = query.eq('visibility', 'public')
      }
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error

    let filteredData = data || []
    
    // Filter routes with selective follower sharing
    if (userId && userId !== user.id) {
      const followersRoutes = filteredData.filter(route => route.visibility === 'followers')
      
      if (followersRoutes.length > 0) {
        const routeIds = followersRoutes.map(route => route.id)
        
        // Check which routes have selective sharing
        const { data: routeFollowers } = await supabase
          .from('route_followers')
          .select('route_id')
          .in('route_id', routeIds)
        
        const routesWithSelectiveSharing = new Set(
          routeFollowers?.map(rf => rf.route_id) || []
        )
        
        // Check which routes the current user has access to
        const { data: userAccess } = await supabase
          .from('route_followers')
          .select('route_id')
          .in('route_id', routeIds)
          .eq('follower_id', user.id)
        
        const accessibleRouteIds = new Set(
          userAccess?.map(ua => ua.route_id) || []
        )
        
        // Filter: keep routes without selective sharing OR with explicit access
        filteredData = filteredData.filter(route => {
          if (route.visibility !== 'followers') return true
          if (!routesWithSelectiveSharing.has(route.id)) return true
          return accessibleRouteIds.has(route.id)
        })
      }
    }

    // Sort route_points by order_index
    filteredData = filteredData.map(route => ({
      ...route,
      route_points: (route.route_points || []).sort((a: any, b: any) => a.order_index - b.order_index)
    }))

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

    const { 
      name, 
      description, 
      visibility = 'private', 
      url, 
      expires_at, 
      distance,
      estimated_duration,
      points, 
      selectedFollowers 
    } = await request.json()

    if (!name || !points || !Array.isArray(points) || points.length < 2) {
      return NextResponse.json({ 
        error: 'Invalid data: name and at least 2 points are required' 
      }, { status: 400 })
    }

    if (!['public', 'followers', 'private'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 })
    }

    // Prepare route data
    const routeData: any = {
      user_id: user.id,
      name,
      visibility,
    }

    // Add optional fields
    if (description !== undefined) routeData.description = description
    if (url !== undefined) routeData.url = url
    if (expires_at !== undefined) routeData.expires_at = expires_at
    if (distance !== undefined) routeData.distance = distance
    if (estimated_duration !== undefined) routeData.estimated_duration = estimated_duration

    // Insert route
    const { data: routeResult, error: routeError } = await supabase
      .from('routes')
      .insert(routeData)
      .select()

    if (routeError) throw routeError

    const newRoute = routeResult[0]

    // Insert route points
    const routePointsData = points.map((point: any, index: number) => ({
      route_id: newRoute.id,
      lat: point.lat,
      lng: point.lng,
      order_index: index,
      name: point.name || null,
    }))

    const { data: pointsResult, error: pointsError } = await supabase
      .from('route_points')
      .insert(routePointsData)
      .select()

    if (pointsError) throw pointsError

    // If selective followers are specified, add them to route_followers table
    if (visibility === 'followers' && selectedFollowers && Array.isArray(selectedFollowers) && selectedFollowers.length > 0) {
      const routeFollowersData = selectedFollowers.map(followerId => ({
        route_id: newRoute.id,
        follower_id: followerId,
      }))

      const { error: rfError } = await supabase
        .from('route_followers')
        .insert(routeFollowersData)

      if (rfError) {
        console.error('Error adding route followers:', rfError)
        // Don't throw - route was created successfully
      }
    }

    // Return route with points
    const responseData = {
      ...newRoute,
      route_points: pointsResult.sort((a: any, b: any) => a.order_index - b.order_index)
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
