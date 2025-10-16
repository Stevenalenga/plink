import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'followers' or 'following'

    if (!type || !['followers', 'following'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

    let query
    if (type === 'followers') {
      query = supabaseServer
        .from('followers')
        .select(`
          id,
          follower_id,
          created_at,
          users!followers_follower_id_fkey (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('following_id', user.id)
    } else {
      query = supabaseServer
        .from('followers')
        .select(`
          id,
          following_id,
          created_at,
          users!followers_following_id_fkey (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('follower_id', user.id)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { followingId } = await request.json()
    if (!followingId) {
      return NextResponse.json({ error: 'followingId is required' }, { status: 400 })
    }

    if (followingId === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('followers')
      .insert({
        follower_id: user.id,
        following_id: followingId,
      })
      .select()

    if (error) {
      if (error.code === '23505') { // unique violation
        return NextResponse.json({ error: 'Already following this user' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data[0])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}