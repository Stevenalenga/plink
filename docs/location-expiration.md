# Location Expiration Feature

## Overview
This feature allows **all locations** (public, followers-only, and private) to be automatically deleted after a specified time period, giving users complete control over their location lifespans.

## How It Works

### User Control
- **All visibility types**: Public, followers-only, and private locations can all have expiration set
- **Flexible options**:
  - **24 hours**: Quick temporary sharing (auto-deletes after 24 hours)
  - **Custom duration**: 1-720 hours (up to 30 days)
  - **Never expire**: Permanent until manually deleted
  
### Automatic Expiration
- Users explicitly choose expiration when creating/editing locations
- No automatic defaults - users decide for each location
- Private and followers-only locations can use temporary expiration
- Cleanup job runs hourly and deletes **all** expired locations (regardless of visibility)

## Use Cases

### Public Locations
- Share event locations that expire after the event
- Temporary meetup spots
- Short-term recommendations
- Limited-time promotions or announcements

### Followers-Only Locations
- Share home location temporarily with trusted followers
- Limited-time exclusive spots
- Temporary group gathering places
- Time-sensitive friend meetups

### Private Locations
- Personal reminders that auto-delete
- Temporary bookmarks
- Time-sensitive location notes
- Quick location saves that clean themselves up

## User Interface

### Creating Locations
All locations now show expiration options in the location dialog:

1. **Location Name** - Required field for the location
2. **Link** - Optional URL or internal link
3. **Coordinates** - Latitude and longitude
4. **Visibility** - Choose who can see the location:
   - Private (only you)
   - Followers only
   - Public (everyone)
5. **Auto-Delete After** - Set expiration:
   - **24 hours** - Temporary location (auto-deletes)
   - **Custom duration** - Set custom hours (1-720 hours)
   - **Never expire** - Permanent until manually deleted

### Editing Locations
When editing existing locations via the profile page:
- All fields can be updated including expiration settings
- Expiration settings are pre-populated based on current values
- Can change from permanent to temporary (or vice versa)

### Visual Indicators
Locations with expiration show:
- **⏱️ Orange badge** with countdown timer (e.g., "23h 45m left")
- Full expiration timestamp in location details
- Different badge colors distinguish link vs expiration status
- Real-time countdown updates

## Technical Implementation

### Database
- `locations` table has `expires_at` timestamp column
- Column accepts NULL for permanent locations
- Database trigger updated to allow user control (no auto-setting)
- Cleanup job runs via cron to delete expired locations

### Frontend Components

#### LocationDialog (`components/mapscomponents/location-dialog.tsx`)
- Expiration UI shown for ALL visibility types
- State management: `expirationOption` and `customHours`
- Calculates `expires_at` ISO timestamp on save
- Passes `expires_at` to parent save handler

#### LocationEditDialog (`components/LocationEditDialog.tsx`)
- Pre-populates expiration settings from existing location
- Calculates remaining hours for custom durations
- Updates `expires_at` field on save

#### Profile Page (`app/(routes)/profile/page.tsx`)
- Displays expiration badges for all locations
- Shows countdown timer in badge
- Shows full expiration date in details
- Handles `expires_at` in update operations

### Backend API

#### POST `/api/locations`
- Accepts `expires_at` parameter for all visibility types
- No visibility-based restrictions on expiration
- Stores ISO timestamp in database

#### Cleanup Job
- Runs hourly to delete expired locations
- Deletes locations where `expires_at < NOW()`
- Works for all visibility types

## Benefits

### For Users
- 🧹 **Auto-cleanup**: Temporary locations delete themselves
- 🎯 **Flexibility**: Choose permanence per location
- 🔒 **Privacy**: Even private locations can auto-delete
- ⏱️ **Time-sensitive**: Perfect for events and meetups
- 📱 **Clean interface**: No clutter from old locations

### For Platform
- 📉 **Reduced clutter**: Auto-removal of stale data
- 🔐 **Better privacy**: Users control their data lifetime
- 💾 **Storage efficiency**: Automatic cleanup reduces database size
- ⚡ **Performance**: Fewer locations to query and display
- 🎯 **User satisfaction**: More control over their data

## Migration

To apply this feature to an existing database:

```bash
# Run the migration SQL file
psql $DATABASE_URL -f supabase/migrations/20241016000001_update_expiration_all_types.sql
```

The migration:
1. Drops the old auto-expiration trigger
2. Creates new trigger that doesn't auto-set expiration
3. Preserves existing `expires_at` values
4. Allows user-controlled expiration for all visibility types

## Examples

### Example 1: Creating a Temporary Public Event
```typescript
// User creates a public meetup that expires in 24 hours
{
  name: "Coffee Meetup @ Downtown",
  visibility: "public",
  expirationOption: "24h"
  // Result: expires_at = now + 24 hours
}
```

### Example 2: Private Temporary Bookmark
```typescript
// User saves a parking spot that expires in 3 hours
{
  name: "Parking spot level 3",
  visibility: "private",
  expirationOption: "custom",
  customHours: 3
  // Result: expires_at = now + 3 hours
}
```

### Example 3: Permanent Followers-Only Location
```typescript
// User shares their home with followers permanently
{
  name: "My Home",
  visibility: "followers",
  expirationOption: "never"
  // Result: expires_at = null
}
```

## Best Practices

### For Users
1. **Use 24h for events** - Perfect for one-time meetups
2. **Use custom for specific needs** - Set exact duration needed
3. **Use permanent for favorites** - Important locations you want to keep
4. **Review expiring locations** - Check profile page for countdown timers
5. **Edit to extend** - Can update expiration before it expires

### For Developers
1. **Always pass `expires_at`** - Include in create/update calls
2. **Handle NULL properly** - NULL means permanent (never expires)
3. **Calculate on client** - Calculate ISO timestamp before API call
4. **Show visual feedback** - Display countdown timers for UX
5. **Test cleanup job** - Ensure expired locations are removed

## Troubleshooting

### Location Not Auto-Deleting
- Check cleanup job is running (should run hourly)
- Verify `expires_at` timestamp is in the past
- Check database logs for errors

### Expiration Not Showing in UI
- Verify location has `expires_at` field populated
- Check component is fetching all fields from database
- Ensure type casting for `expires_at` field

### Custom Hours Not Saving
- Verify `customHours` is between 1-720
- Check API is receiving `expires_at` parameter
- Verify database column accepts timestamp values

## Future Enhancements

Potential improvements to consider:
- **Extend before expiry** - One-click extension button
- **Expiration notifications** - Alert before location expires
- **Default preferences** - Set default expiration per visibility type
- **Bulk operations** - Set expiration for multiple locations
- **Analytics** - Track expiration usage patterns
