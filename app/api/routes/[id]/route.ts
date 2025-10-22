import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const routeId = params.id

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
        .eq('id', routeId)
        .eq('visibility', 'public')
        .single()

      if (error) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 })
      }

      // Sort route points
      const sortedData = {
        ...data,
        route_points: (data.route_points || []).sort((a: any, b: any) => a.order_index - b.order_index)
      }

      return NextResponse.json(sortedData)
    }

    // For authenticated users
    const token = authHeader.replace('Bearer ', '')
    const supabase = createServerSupabaseClient(token)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

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
      .eq('id', routeId)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }

    // Check if user has access
    if (data.visibility === 'private' && data.user_id !== user.id) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }

    if (data.visibility === 'followers' && data.user_id !== user.id) {
      // Check if user is a follower
      const { data: followData } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', data.user_id)

      const isFollowing = followData && followData.length > 0

      if (!isFollowing) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 })
      }

      // Check selective sharing
      const { data: routeFollowers } = await supabase
        .from('route_followers')
        .select('route_id')
        .eq('route_id', routeId)

      if (routeFollowers && routeFollowers.length > 0) {
        // Has selective sharing, check if user has access
        const { data: userAccess } = await supabase
          .from('route_followers')
          .select('id')
          .eq('route_id', routeId)
          .eq('follower_id', user.id)

        if (!userAccess || userAccess.length === 0) {
          return NextResponse.json({ error: 'Route not found' }, { status: 404 })
        }
      }
    }

    // Sort route points
    const sortedData = {
      ...data,
      route_points: (data.route_points || []).sort((a: any, b: any) => a.order_index - b.order_index)
    }

    return NextResponse.json(sortedData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      url, 
      visibility, 
      expires_at, 
      distance,
      estimated_duration,
      points,
      selectedFollowers 
    } = await request.json()
    const routeId = params.id

    // Verify ownership
    const { data: route, error: ownerError } = await supabase
      .from('routes')
      .select('user_id')
      .eq('id', routeId)
      .single()

    if (ownerError || !route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }

    if (route.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update route
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (url !== undefined) updateData.url = url
    if (visibility !== undefined) updateData.visibility = visibility
    if (expires_at !== undefined) updateData.expires_at = expires_at
    if (distance !== undefined) updateData.distance = distance
    if (estimated_duration !== undefined) updateData.estimated_duration = estimated_duration

    const { data: updatedRoute, error: updateError } = await supabase
      .from('routes')
      .update(updateData)
      .eq('id', routeId)
      .select()
      .single()

    if (updateError) throw updateError

    // Update route points if provided
    if (points !== undefined && Array.isArray(points)) {
      // Delete existing points
      await supabase
        .from('route_points')
        .delete()
        .eq('route_id', routeId)

      // Insert new points
      if (points.length > 0) {
        const routePointsData = points.map((point: any, index: number) => ({
          route_id: routeId,
          lat: point.lat,
          lng: point.lng,
          order_index: index,
          name: point.name || null,
        }))

        await supabase
          .from('route_points')
          .insert(routePointsData)
      }
    }

    // Handle selective follower sharing
    if (visibility === 'followers' && selectedFollowers !== undefined) {
      // Delete existing route_followers entries
      await supabase
        .from('route_followers')
        .delete()
        .eq('route_id', routeId)

      // Add new entries if selectedFollowers is provided and not empty
      if (Array.isArray(selectedFollowers) && selectedFollowers.length > 0) {
        const routeFollowersData = selectedFollowers.map(followerId => ({
          route_id: routeId,
          follower_id: followerId,
        }))

        const { error: rfError } = await supabase
          .from('route_followers')
          .insert(routeFollowersData)

        if (rfError) {
          console.error('Error updating route followers:', rfError)
        }
      }
    } else if (visibility !== 'followers') {
      // If visibility changed from followers to something else, clean up
      await supabase
        .from('route_followers')
        .delete()
        .eq('route_id', routeId)
    }

    // Get updated route with points
    const { data: finalRoute } = await supabase
      .from('routes')
      .select(`
        *,
        route_points (*)
      `)
      .eq('id', routeId)
      .single()

    const responseData = {
      ...finalRoute,
      route_points: (finalRoute?.route_points || []).sort((a: any, b: any) => a.order_index - b.order_index)
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const routeId = params.id

    // Verify ownership
    const { data: route, error: ownerError } = await supabase
      .from('routes')
      .select('user_id')
      .eq('id', routeId)
      .single()

    if (ownerError || !route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }

    if (route.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete route (cascade will handle route_points and route_followers)
    const { error: deleteError } = await supabase
      .from('routes')
      .delete()
      .eq('id', routeId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
