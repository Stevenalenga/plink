import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Creates a Supabase client for server-side use (API routes, server components)
 * This client uses the service role key for admin operations when available,
 * or falls back to anon key with proper JWT validation
 */
export function createServerSupabaseClient(token?: string) {
  // If we have a service role key, use it for admin operations
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  
  // Otherwise, create a client with the user's token
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: token ? {
        Authorization: `Bearer ${token}`,
      } : {},
    },
  })
  
  return client
}
