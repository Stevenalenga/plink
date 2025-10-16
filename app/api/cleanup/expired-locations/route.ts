import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * API Route to delete expired public locations (older than 24 hours)
 * 
 * This can be called:
 * 1. By a cron job (Vercel Cron, GitHub Actions, etc.)
 * 2. Manually for testing/maintenance
 * 
 * Security: Requires CRON_SECRET in authorization header
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // Allow internal calls or properly authenticated external calls
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current time for comparison
    const now = new Date().toISOString()

    // Create server client for admin operations
    const supabase = createServerSupabaseClient()

    // Delete locations that have passed their expiration time
    const { data, error } = await supabase
      .from('locations')
      .delete()
      .not('expires_at', 'is', null)
      .lt('expires_at', now)
      .select()

    if (error) {
      console.error('Error deleting expired locations:', error)
      throw error
    }

    const deletedCount = data?.length || 0
    
    console.log(`✅ Cleanup completed: Deleted ${deletedCount} expired locations`)

    return NextResponse.json({ 
      success: true, 
      deleted: deletedCount,
      checkedAt: now,
      message: `Deleted ${deletedCount} expired location${deletedCount !== 1 ? 's' : ''}`,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Cleanup error:', error)
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 })
  }
}

/**
 * GET endpoint to check status of public locations
 * Useful for monitoring and debugging
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // Allow authenticated access
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date().toISOString()

    // Create server client for admin operations
    const supabase = createServerSupabaseClient()

    // Count expired locations (those with expires_at in the past)
    const { count: expiredCount, error: expiredError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .not('expires_at', 'is', null)
      .lt('expires_at', now)

    if (expiredError) throw expiredError

    // Count locations with expiration set (not yet expired)
    const { count: activeWithExpiration, error: activeError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .not('expires_at', 'is', null)
      .gte('expires_at', now)

    if (activeError) throw activeError

    // Count total public locations
    const { count: publicCount, error: publicError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('visibility', 'public')

    if (publicError) throw publicError

    return NextResponse.json({
      expiredLocations: expiredCount || 0,
      activeLocationsWithExpiration: activeWithExpiration || 0,
      totalPublicLocations: publicCount || 0,
      checkedAt: now,
      message: `${expiredCount || 0} location(s) eligible for deletion`,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
