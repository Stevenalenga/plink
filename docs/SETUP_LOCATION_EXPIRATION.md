# Location Expiration - Setup Guide

## Quick Setup Instructions

Follow these steps to enable automatic location expiration in your MYMAPS application.

### Step 1: Run Database Migration

1. Connect to your Supabase project
2. Run the migration file:

```bash
psql $DATABASE_URL -f supabase/migrations/20241012000001_add_expires_at.sql
```

Or in Supabase Studio:
- Go to SQL Editor
- Copy the contents of `supabase/migrations/20241012000001_add_expires_at.sql`
- Execute the SQL

### Step 2: Set Environment Variable

Add the `CRON_SECRET` to your environment variables:

**.env.local** (Local development):
```env
CRON_SECRET=your-secure-random-string-here
```

**Vercel** (Production):
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add: `CRON_SECRET` with a secure random value
4. Redeploy your application

Generate a secure secret:
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 3: Verify Vercel Cron Configuration

The `vercel.json` file should already have:
```json
{
  "crons": [
    {
      "path": "/api/cleanup/expired-locations",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs the cleanup every hour. Adjust the schedule if needed:
- `0 * * * *` - Every hour
- `*/30 * * * *` - Every 30 minutes
- `0 */6 * * *` - Every 6 hours

### Step 4: Deploy

Deploy your changes:
```bash
git add .
git commit -m "Add location expiration feature"
git push
```

Vercel will automatically deploy and enable the cron job.

### Step 5: Test the Feature

#### Test Location Creation
1. Log in to your application
2. Create a new public location
3. Notice the expiration options (24h, custom, never)
4. Save the location
5. Check the profile page - you should see the expiration countdown

#### Test Cleanup API
```bash
# Check status (see what would be deleted)
curl https://your-app.vercel.app/api/cleanup/expired-locations \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Run cleanup manually
curl -X POST https://your-app.vercel.app/api/cleanup/expired-locations \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### Test with Expired Location
1. Create a public location
2. In Supabase Studio, manually update the `expires_at` to a past time:
   ```sql
   UPDATE locations 
   SET expires_at = NOW() - INTERVAL '1 hour'
   WHERE id = 'your-location-id';
   ```
3. Call the cleanup API
4. Verify the location is deleted

### Step 6: Monitor Cron Jobs

In Vercel:
1. Go to your project dashboard
2. Click "Cron" in the sidebar
3. Monitor execution logs and status

## What Changed

### Database
- ✅ Added `expires_at` column to locations table
- ✅ Added index for performance
- ✅ Created trigger to auto-set expiration for public locations
- ✅ Created function to handle expiration logic

### Backend
- ✅ Updated `/api/locations` POST endpoint to accept `expires_at`
- ✅ Updated cleanup API to use `expires_at` column
- ✅ Enhanced cleanup API with better status reporting

### Frontend
- ✅ Updated LocationDialog with expiration options
- ✅ Updated LocationEditDialog with expiration settings
- ✅ Added expiration countdown badges in profile
- ✅ Added privacy warnings for public locations
- ✅ Updated map-container to handle expiration

### Documentation
- ✅ Created comprehensive documentation
- ✅ Added setup guide
- ✅ Updated schema documentation

## Troubleshooting

### Cron Job Not Running
- Verify `CRON_SECRET` is set in Vercel environment variables
- Check Vercel Cron dashboard for errors
- Ensure your plan supports Cron jobs (Hobby plan and above)

### Locations Not Expiring
- Run the cleanup API manually to test
- Check if `expires_at` is being set correctly in database
- Verify the database trigger is installed

### Type Errors
- Run `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts`
- This regenerates types with the new `expires_at` column

### Migration Errors
- If migration fails, check if column already exists
- Use `IF NOT EXISTS` clauses (already in migration file)
- Manually verify in Supabase Studio

## Rollback

If you need to rollback:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS trigger_set_location_expiration ON locations;

-- Remove function
DROP FUNCTION IF EXISTS set_location_expiration();

-- Remove column (⚠️ This deletes data!)
ALTER TABLE locations DROP COLUMN IF EXISTS expires_at;

-- Remove index
DROP INDEX IF EXISTS idx_locations_expires_at;
```

## Support

For issues or questions:
1. Check the logs in Vercel dashboard
2. Review `docs/location-expiration.md` for detailed documentation
3. Verify environment variables are set correctly
4. Test the cleanup API endpoint manually
