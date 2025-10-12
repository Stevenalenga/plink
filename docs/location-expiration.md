# Location Expiration Feature

## Overview
This feature allows locations to be automatically deleted after a specified time period, enhancing privacy and security for public locations.

## How It Works

### Database Schema
- A new `expires_at` column (TIMESTAMP WITH TIME ZONE) has been added to the `locations` table
- An index on `expires_at` improves query performance for the cleanup job
- A database trigger automatically sets `expires_at` to 24 hours from creation for public locations

### Automatic Expiration
- **Public locations**: By default, set to expire 24 hours after creation
- **Private/Followers locations**: No expiration by default (expires_at = NULL)
- Users can customize the expiration duration when creating or editing locations

### Cleanup Process
- A cron job runs every hour via Vercel Cron (`/api/cleanup/expired-locations`)
- The job deletes all locations where `expires_at` is in the past
- The cleanup API can be called manually or monitored via GET endpoint

## User Interface

### Creating Locations
When creating a public location, users can choose:
- **24 hours** (Recommended) - Location expires after 24 hours
- **Custom duration** - Set custom hours (1-720 hours / 30 days)
- **Never expire** - Location persists indefinitely

### Editing Locations
Users can modify expiration settings when editing locations:
- Change from expiring to never expire (and vice versa)
- Update custom expiration duration
- View remaining time until expiration

### Visual Indicators
- Badge showing time remaining (e.g., "12h 30m left")
- Warning messages explaining privacy implications
- Full expiration timestamp in location details

## API Endpoints

### POST /api/cleanup/expired-locations
Deletes all expired locations. Requires `CRON_SECRET` in Authorization header.

**Response:**
```json
{
  "success": true,
  "deleted": 5,
  "checkedAt": "2024-10-12T10:00:00.000Z",
  "message": "Deleted 5 expired locations"
}
```

### GET /api/cleanup/expired-locations
Returns status of expired and active locations. Requires authentication.

**Response:**
```json
{
  "expiredLocations": 3,
  "activeLocationsWithExpiration": 15,
  "totalPublicLocations": 42,
  "checkedAt": "2024-10-12T10:00:00.000Z",
  "message": "3 location(s) eligible for deletion"
}
```

## Database Migration

Run the migration to add the `expires_at` column:

```sql
-- Migration file: supabase/migrations/20241012000001_add_expires_at.sql
-- This adds:
-- 1. expires_at column to locations table
-- 2. Index for performance
-- 3. Trigger to auto-set expiration for public locations
-- 4. Function to handle expiration logic
```

## Environment Variables

### Required
- `CRON_SECRET`: Secret token for authenticating cron job requests

Add to your `.env.local`:
```
CRON_SECRET=your-secure-random-string
```

## Deployment

### Vercel
The cron job is configured in `vercel.json`:
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

This runs the cleanup job every hour.

### Other Platforms
If not using Vercel Cron:
1. Set up a scheduled task using your platform's cron/scheduler
2. Make POST request to `/api/cleanup/expired-locations`
3. Include `Authorization: Bearer YOUR_CRON_SECRET` header

## Privacy Considerations

### Why Auto-Delete?
- **Privacy**: Public locations are visible to everyone; limiting their lifespan reduces exposure
- **Security**: Prevents accumulation of stale location data
- **Best Practice**: Encourages users to share location information temporarily

### User Control
- Users can opt out by selecting "Never expire"
- Clear warnings about privacy implications of indefinite public locations
- Easy to extend expiration by editing the location

## Testing

### Manual Cleanup Test
```bash
curl -X POST https://your-domain.com/api/cleanup/expired-locations \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Check Status
```bash
curl https://your-domain.com/api/cleanup/expired-locations \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Expiration
1. Create a public location
2. Manually set `expires_at` to past time in database
3. Run cleanup endpoint
4. Verify location is deleted

## Future Enhancements

Potential improvements:
- Email notifications before location expires
- Bulk expiration management
- Default expiration preferences in user settings
- Analytics on expired locations
- Archive instead of delete option
