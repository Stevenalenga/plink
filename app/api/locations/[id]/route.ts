import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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

    const { name, url, visibility, expires_at, selectedFollowers } = await request.json()
    const locationId = params.id

    // Verify ownership
    const { data: location, error: ownerError } = await supabase
      .from('locations')
      .select('user_id')
      .eq('id', locationId)
      .single()

    if (ownerError || !location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    if (location.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update location
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (url !== undefined) updateData.url = url
    if (visibility !== undefined) updateData.visibility = visibility
    if (expires_at !== undefined) updateData.expires_at = expires_at

    const { data: updatedLocation, error: updateError } = await supabase
      .from('locations')
      .update(updateData)
      .eq('id', locationId)
      .select()
      .single()

    if (updateError) throw updateError

    // Handle selective follower sharing
    if (visibility === 'followers' && selectedFollowers !== undefined) {
      // Delete existing location_followers entries
      await supabase
        .from('location_followers')
        .delete()
        .eq('location_id', locationId)

      // Add new entries if selectedFollowers is provided and not empty
      if (Array.isArray(selectedFollowers) && selectedFollowers.length > 0) {
        const locationFollowersData = selectedFollowers.map(followerId => ({
          location_id: locationId,
          follower_id: followerId,
        }))

        const { error: lfError } = await supabase
          .from('location_followers')
          .insert(locationFollowersData)

        if (lfError) {
          console.error('Error updating location followers:', lfError)
        }
      }
    } else if (visibility !== 'followers') {
      // If visibility changed from followers to something else, clean up
      await supabase
        .from('location_followers')
        .delete()
        .eq('location_id', locationId)
    }

    return NextResponse.json(updatedLocation)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
