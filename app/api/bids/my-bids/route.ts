import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/bids/my-bids - Get all bids created by the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // Optional: filter by status

    let query = supabase
      .from('bids')
      .select(`
        *,
        location:locations (
          id,
          name,
          lat,
          lng,
          user_id,
          visibility,
          accepts_bids,
          users:user_id (
            id,
            name,
            avatar_url
          )
        )
      `)
      .eq('bidder_id', userId)
      .order('created_at', { ascending: false })

    // Apply status filter if provided
    if (status && ['pending', 'accepted', 'rejected', 'expired'].includes(status)) {
      query = query.eq('status', status)
    }

    const { data: bids, error } = await query

    if (error) {
      console.error('Error fetching user bids:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bids.' },
        { status: 500 }
      )
    }

    return NextResponse.json(bids || [])
  } catch (error) {
    console.error('Error in GET /api/bids/my-bids:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
