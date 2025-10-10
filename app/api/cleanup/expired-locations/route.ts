import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    // Calculate the cutoff time (24 hours ago)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Delete public locations older than 24 hours
    const { data, error } = await supabase
      .from('locations')
      .delete()
      .eq('visibility', 'public')
      .lt('created_at', cutoffTime)
      .select()

    if (error) {
      console.error('Error deleting expired locations:', error)
      throw error
    }

    const deletedCount = data?.length || 0
    
    console.log(`✅ Cleanup completed: Deleted ${deletedCount} expired public locations`)

    return NextResponse.json({ 
      success: true, 
      deleted: deletedCount,
      cutoffTime,
      message: `Deleted ${deletedCount} expired public location${deletedCount !== 1 ? 's' : ''}`,
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

    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Count expired locations
    const { count: expiredCount, error: expiredError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('visibility', 'public')
      .lt('created_at', cutoffTime)

    if (expiredError) throw expiredError

    // Count active public locations
    const { count: activeCount, error: activeError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('visibility', 'public')
      .gte('created_at', cutoffTime)

    if (activeError) throw activeError

    return NextResponse.json({
      expiredLocations: expiredCount || 0,
      activePublicLocations: activeCount || 0,
      cutoffTime,
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
