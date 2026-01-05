import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// GET /api/bids/location/[locationId] - Get all bids for a specific location (owner only)
export async function GET(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const locationId = params.locationId

    // Verify user owns the location
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, user_id')
      .eq('id', locationId)
      .single()

    if (locationError || !location) {
      return NextResponse.json(
        { error: 'Location not found.' },
        { status: 404 }
      )
    }

    if (location.user_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to view bids for this location.' },
        { status: 403 }
      )
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // Optional: filter by status

    let query = supabase
      .from('bids')
      .select(`
        *,
        bidder:users!bidder_id (
          id,
          name,
          avatar_url,
          email
        )
      `)
      .eq('location_id', locationId)
      .order('amount', { ascending: false }) // Highest bids first
      .order('created_at', { ascending: true }) // Then by earliest

    // Apply status filter if provided
    if (status && ['pending', 'accepted', 'rejected', 'expired'].includes(status)) {
      query = query.eq('status', status)
    }

    const { data: bids, error } = await query

    if (error) {
      console.error('Error fetching location bids:', error)
      return NextResponse.json(
        { error: 'Failed to fetch bids.' },
        { status: 500 }
      )
    }

    // Check if 24 hours have passed to reveal full bidder info
    const now = new Date()
    const bidsWithPrivacy = bids?.map(bid => {
      const expiresAt = new Date(bid.expires_at)
      const hasExpired = now > expiresAt
      
      // If bid hasn't expired yet, hide sensitive bidder info
      if (!hasExpired && bid.bidder) {
        return {
          ...bid,
          bidder: {
            id: bid.bidder.id,
            name: 'Anonymous Bidder',
            avatar_url: null,
            email: undefined, // Hide email until expired
          }
        }
      }
      
      return bid
    })

    return NextResponse.json(bidsWithPrivacy || [])
  } catch (error) {
    console.error('Error in GET /api/bids/location/[locationId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
