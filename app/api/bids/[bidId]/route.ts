import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { UpdateBidPayload } from '@/types'

// PATCH /api/bids/[bidId] - Update a bid (bidder updates amount/message, owner updates status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { bidId: string } }
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
    const bidId = params.bidId

    // Get the existing bid
    const { data: existingBid, error: bidError } = await supabase
      .from('bids')
      .select(`
        *,
        location:locations (
          user_id,
          expires_at
        )
      `)
      .eq('id', bidId)
      .single()

    if (bidError || !existingBid) {
      return NextResponse.json(
        { error: 'Bid not found.' },
        { status: 404 }
      )
    }

    const body: UpdateBidPayload = await request.json()
    const isBidder = existingBid.bidder_id === userId
    const isLocationOwner = existingBid.location.user_id === userId

    if (!isBidder && !isLocationOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to update this bid.' },
        { status: 403 }
      )
    }

    // Bidders can only update their own pending bids (amount and message)
    if (isBidder) {
      if (existingBid.status !== 'pending') {
        return NextResponse.json(
          { error: 'You can only update pending bids.' },
          { status: 400 }
        )
      }

      if (new Date(existingBid.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'This bid has expired.' },
          { status: 400 }
        )
      }

      // Check if location has expired
      if (existingBid.location.expires_at && new Date(existingBid.location.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'The location for this bid has expired.' },
          { status: 400 }
        )
      }

      const updates: any = {}
      
      if (typeof body.amount === 'number') {
        if (body.amount <= 0) {
          return NextResponse.json(
            { error: 'Amount must be a positive number.' },
            { status: 400 }
          )
        }
        updates.amount = body.amount
      }

      if (body.message !== undefined) {
        if (body.message && body.message.length > 500) {
          return NextResponse.json(
            { error: 'Message cannot exceed 500 characters.' },
            { status: 400 }
          )
        }
        updates.message = body.message || null
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json(
          { error: 'No valid fields to update.' },
          { status: 400 }
        )
      }

      const { data: updatedBid, error: updateError } = await supabase
        .from('bids')
        .update(updates)
        .eq('id', bidId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating bid:', updateError)
        return NextResponse.json(
          { error: 'Failed to update bid.' },
          { status: 500 }
        )
      }

      return NextResponse.json(updatedBid)
    }

    // Location owners can update bid status
    if (isLocationOwner) {
      if (!body.status) {
        return NextResponse.json(
          { error: 'Status is required.' },
          { status: 400 }
        )
      }

      if (!['accepted', 'rejected'].includes(body.status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be "accepted" or "rejected".' },
          { status: 400 }
        )
      }

      // Can't update already accepted/rejected bids
      if (existingBid.status === 'accepted' || existingBid.status === 'rejected') {
        return NextResponse.json(
          { error: 'This bid has already been processed.' },
          { status: 400 }
        )
      }

      const { data: updatedBid, error: updateError } = await supabase
        .from('bids')
        .update({ status: body.status })
        .eq('id', bidId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating bid status:', updateError)
        return NextResponse.json(
          { error: 'Failed to update bid status.' },
          { status: 500 }
        )
      }

      return NextResponse.json(updatedBid)
    }

    return NextResponse.json(
      { error: 'Unauthorized action.' },
      { status: 403 }
    )
  } catch (error) {
    console.error('Error in PATCH /api/bids/[bidId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/bids/[bidId] - Delete a bid (bidder only, pending only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { bidId: string } }
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
    const bidId = params.bidId

    // Get the existing bid
    const { data: existingBid, error: bidError } = await supabase
      .from('bids')
      .select('id, bidder_id, status')
      .eq('id', bidId)
      .single()

    if (bidError || !existingBid) {
      return NextResponse.json(
        { error: 'Bid not found.' },
        { status: 404 }
      )
    }

    if (existingBid.bidder_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this bid.' },
        { status: 403 }
      )
    }

    if (existingBid.status !== 'pending') {
      return NextResponse.json(
        { error: 'You can only delete pending bids.' },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabase
      .from('bids')
      .delete()
      .eq('id', bidId)

    if (deleteError) {
      console.error('Error deleting bid:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete bid.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/bids/[bidId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
