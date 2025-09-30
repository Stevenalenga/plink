# Apply RLS Policy Fix

## Quick Steps to Fix the Database

### Option 1: Supabase Dashboard (Recommended)
1. Open your browser and go to: https://hvlkftfieinpwddhriia.supabase.co
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the following SQL:

```sql
-- Fix RLS policies for users table to allow viewing public user information
-- This is needed so that location markers can show user details for public locations

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Create new policy that allows viewing all user profiles
CREATE POLICY "Users can view all user profiles"
  ON users FOR SELECT
  USING (true);
```

5. Click "Run" (or press Ctrl+Enter / Cmd+Enter)
6. You should see "Success. No rows returned"
7. Done! 🎉

### Option 2: Install Supabase CLI (For Future Migrations)

If you want to use the CLI for future migrations:

```powershell
# Install Supabase CLI using npm
npm install -g supabase

# Or using Scoop (Windows package manager)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Then you can run:
```powershell
# Link to your project
supabase link --project-ref hvlkftfieinpwddhriia

# Apply migration
supabase db push
```

## Verify the Fix

After applying the SQL:

1. **Clear your browser cache or do a hard refresh** (Ctrl+Shift+R on Windows)
2. **Log out and log back in** to get a fresh token
3. **Navigate to the map page**
4. **Check the browser console** - you should see:
   - "Loading locations for user: [your-user-id]"
   - "Loaded locations: [array of locations]"
   - NO "JWT expired" errors

## Troubleshooting

If markers still don't show:

1. **Check Console Logs:**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for any error messages

2. **Verify User is Authenticated:**
   - Console should show "Loading locations for user: [id]"
   - If you see "Session invalid", log out and log back in

3. **Check if you have any locations:**
   - Go to SQL Editor in Supabase
   - Run: `SELECT * FROM locations;`
   - If empty, create a test location on the map

4. **Verify RLS Policy Applied:**
   - Go to SQL Editor
   - Run: `SELECT * FROM pg_policies WHERE tablename = 'users';`
   - Should see "Users can view all user profiles" policy

## What Changed

The implementation includes:

✅ **lib/supabase.ts** - Added automatic token refresh
✅ **components/user-provider.tsx** - Enhanced auth state handling  
✅ **components/mapscomponents/map-container.tsx** - Added JWT error handling
✅ **supabase/migrations/20250101000000_fix_users_rls_policy.sql** - RLS policy fix

All code changes are complete. You only need to apply the SQL migration now!
