import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { CreateBidPayload } from '@/types'

// Rate limiting map (in-memory, resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 5 // 5 bids per minute per user

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (userLimit.count >= MAX_REQUESTS) {
    return false
  }

  userLimit.count++
  return true
}

// POST /api/bids - Create a new bid
export async function POST(request: NextRequest) {
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

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const body: CreateBidPayload = await request.json()

    // Validate input
    if (!body.location_id || typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid bid data. Amount must be a positive number.' },
        { status: 400 }
      )
    }

    // Validate message length if provided
    if (body.message && body.message.length > 500) {
      return NextResponse.json(
        { error: 'Message cannot exceed 500 characters.' },
        { status: 400 }
      )
    }

    // Check if location exists, is public, accepts bids, and is not expired
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, user_id, visibility, accepts_bids, expires_at')
      .eq('id', body.location_id)
      .single()

    if (locationError || !location) {
      return NextResponse.json(
        { error: 'Location not found.' },
        { status: 404 }
      )
    }

    if (location.user_id === userId) {
      return NextResponse.json(
        { error: 'You cannot bid on your own location.' },
        { status: 400 }
      )
    }

    if (location.visibility !== 'public') {
      return NextResponse.json(
        { error: 'Only public locations accept bids.' },
        { status: 400 }
      )
    }

    if (!location.accepts_bids) {
      return NextResponse.json(
        { error: 'This location does not accept bids.' },
        { status: 400 }
      )
    }

    if (location.expires_at && new Date(location.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This location has expired.' },
        { status: 400 }
      )
    }

    // Check if user already has a pending bid on this location
    const { data: existingBid } = await supabase
      .from('bids')
      .select('id, status')
      .eq('location_id', body.location_id)
      .eq('bidder_id', userId)
      .eq('status', 'pending')
      .single()

    if (existingBid) {
      return NextResponse.json(
        { error: 'You already have a pending bid on this location. Please update your existing bid instead.' },
        { status: 400 }
      )
    }

    // Create the bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert([
        {
          location_id: body.location_id,
          bidder_id: userId,
          amount: body.amount,
          message: body.message || null,
        },
      ])
      .select()
      .single()

    if (bidError) {
      console.error('Error creating bid:', bidError)
      return NextResponse.json(
        { error: 'Failed to create bid.' },
        { status: 500 }
      )
    }

    return NextResponse.json(bid, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/bids:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
