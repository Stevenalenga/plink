# Quick Start: Apply Location Expiration Feature

## Step 1: Apply Database Migration

Run this migration to enable user-controlled expiration for all location types:

```bash
# If using Supabase CLI
supabase db push

# Or connect directly to your database
psql $DATABASE_URL -f supabase/migrations/20241016000001_update_expiration_all_types.sql
```

### Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20241016000001_update_expiration_all_types.sql`
4. Paste and run the SQL

## Step 2: Test the Feature

### Create a Test Location
1. Go to the map page
2. Click to add a location
3. Fill in location details
4. Select any visibility (private, followers, public)
5. Choose expiration:
   - **24 hours** - Quick test
   - **Custom** - Try 1-2 hours for testing
   - **Never expire** - Permanent location
6. Save the location

### Verify in Profile
1. Navigate to your profile page
2. Check the "My Locations" tab
3. Look for the orange ⏱️ badge with countdown timer
4. Verify the expiration timestamp is displayed

### Edit and Update
1. Click the edit button on a location
2. Change the expiration setting
3. Save changes
4. Verify the countdown updates

## Step 3: Verify Cleanup (Optional)

To test that expired locations are automatically deleted:

1. Create a location with 1-hour expiration
2. Wait 1+ hours (or manually update `expires_at` in database to past time)
3. Run cleanup job or wait for scheduled run
4. Verify location is deleted

### Manual Cleanup Test
```sql
-- Manually trigger cleanup by updating a test location
UPDATE locations 
SET expires_at = NOW() - INTERVAL '1 hour' 
WHERE id = 'your-test-location-id';

-- Then delete expired locations (this is what the cron job does)
DELETE FROM locations 
WHERE expires_at IS NOT NULL 
AND expires_at < NOW();
```

## What Changed?

### Before
- Only public locations had expiration (auto-set to 24 hours)
- Private and followers-only locations were always permanent
- No user control over expiration

### After
- ✅ ALL visibility types can have expiration
- ✅ Users choose expiration (24h, custom, or never)
- ✅ Visual countdown timers
- ✅ Full control over location lifespans

## Troubleshooting

### Migration Fails
**Error**: "trigger already exists"
```sql
-- Drop existing trigger first
DROP TRIGGER IF EXISTS trigger_set_location_expiration ON locations;
DROP FUNCTION IF EXISTS set_location_expiration();
```

### Expiration Not Showing
- Verify migration ran successfully
- Check that frontend components are deployed
- Clear browser cache and reload

### Locations Not Auto-Deleting
- Verify cleanup cron job is configured and running
- Check database for locations with `expires_at` in the past
- Manually run cleanup SQL to test

## Need Help?

- **Documentation**: See `docs/location-expiration.md` for full details
- **Implementation**: See `docs/IMPLEMENTATION_SUMMARY.md` for technical details
- **Database Schema**: See `supabase/schema.sql` for database structure

## Success Checklist

- [x] Database migration applied
- [x] Can create locations with expiration for all visibility types
- [x] Countdown timers display correctly
- [x] Can edit expiration settings
- [x] Cleanup job is configured and working

Once all items are checked, the feature is fully deployed! 🎉
