# Selective Follower Sharing for Locations

## Overview
This feature allows users to share "followers-only" locations with specific followers instead of all followers. This provides granular control over location sharing and enhances privacy.

## How It Works

### Default Behavior
- **Without selective sharing**: When a location is set to "followers" visibility, ALL followers can see it
- **With selective sharing**: Only specific chosen followers can see the location

### User Experience
1. User creates or edits a location
2. Sets visibility to "Followers Only"
3. Toggles "Share with specific followers"
4. Selects which followers should see the location
5. Saves the location

## Database Schema

### `location_followers` Table
Junction table that tracks which followers have access to specific locations.

```sql
CREATE TABLE location_followers (
  id UUID PRIMARY KEY,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(location_id, follower_id)
);
```

**Key Points**:
- `location_id`: The location being shared
- `follower_id`: The follower user who has access
- Cascade deletes when location or user is deleted
- Unique constraint prevents duplicate entries

### Row Level Security (RLS)
- Users can only view selective sharing for their own locations
- Users can only grant access to their actual followers
- Users can revoke access they've granted

## Implementation Details

### Frontend Components

#### FollowerSelector Component
**Location**: `components/FollowerSelector.tsx`

**Features**:
- Fetches user's followers
- Displays followers with avatars and names
- Checkboxes for selection
- "Select All" / "Deselect All" toggle
- Shows selection count
- Contextual help message
- Loading and empty states

**Props**:
```typescript
interface FollowerSelectorProps {
  locationId?: string        // For editing existing locations
  selectedFollowers: string[]  // Array of follower user IDs
  onSelectionChange: (followerIds: string[]) => void
}
```

#### LocationDialog Integration
**Location**: `components/mapscomponents/location-dialog.tsx`

**Changes**:
- Added selective sharing toggle (Switch component)
- Conditionally shows FollowerSelector when:
  - Visibility is "followers"
  - Selective sharing toggle is ON
- Passes selected followers to onSave callback

#### LocationEditDialog Integration
**Location**: `components/LocationEditDialog.tsx`

**Changes**:
- Same as LocationDialog
- Pre-loads existing selective followers when editing
- Resets selection when visibility changes

### Backend API

#### POST `/api/locations`
Creates a new location with optional selective follower sharing.

**Request Body**:
```typescript
{
  name: string
  lat: number
  lng: number
  visibility: 'public' | 'followers' | 'private'
  url?: string
  expires_at?: string | null
  selectedFollowers?: string[]  // Array of follower user IDs
}
```

**Logic**:
1. Creates location in `locations` table
2. If `visibility === 'followers'` and `selectedFollowers` provided:
   - Inserts entries into `location_followers` table
   - One entry per selected follower

#### PATCH `/api/locations/[id]`
Updates an existing location and its selective follower access.

**Request Body**:
```typescript
{
  name?: string
  url?: string
  visibility?: 'public' | 'followers' | 'private'
  expires_at?: string | null
  selectedFollowers?: string[]
}
```

**Logic**:
1. Verifies user owns the location
2. Updates location fields
3. Handles selective followers:
   - If `visibility === 'followers'` and `selectedFollowers` provided:
     - Deletes all existing `location_followers` entries
     - Inserts new entries for selected followers
   - If `visibility !== 'followers'`:
     - Deletes all `location_followers` entries (cleanup)

#### GET `/api/locations`
Retrieves locations with selective follower filtering.

**Logic**:
1. Fetches locations based on visibility rules
2. For "followers" visibility locations:
   - Checks if location has selective sharing (entries in `location_followers`)
   - If selective sharing exists:
     - Only shows location if current user is in `location_followers`
   - If no selective sharing:
     - Shows to all followers (default behavior)

## Use Cases

### 1. Private Home Address
**Scenario**: User wants to share home address with close friends only

**Steps**:
1. Create location with "Followers Only" visibility
2. Enable selective sharing
3. Select only close friends
4. Other followers won't see this location

### 2. Temporary Event Location
**Scenario**: User hosts a party and invites specific followers

**Steps**:
1. Create location with 24h expiration
2. Set visibility to "Followers Only"
3. Enable selective sharing
4. Select party invitees
5. Location auto-deletes after 24 hours

### 3. Exclusive Recommendation
**Scenario**: User finds a great restaurant and wants to share with select followers

**Steps**:
1. Create location with "Followers Only" visibility
2. Enable selective sharing
3. Select followers who would appreciate it
4. Add URL to restaurant website

## User Interface

### Location Creation Dialog
```
┌─────────────────────────────────────┐
│ Add Location by Coordinates        │
├─────────────────────────────────────┤
│ Name: [________________]            │
│ Link: [________________]            │
│ Latitude: [_________]               │
│ Longitude: [_________]              │
│                                     │
│ Visibility: [Followers Only ▼]     │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ Share with specific followers   ││
│ │                          [OFF]  ││
│ └─────────────────────────────────┘│
│                                     │
│ Auto-Delete After: [Never expire ▼]│
│                                     │
│ [Cancel]              [Save]        │
└─────────────────────────────────────┘
```

### With Selective Sharing Enabled
```
┌─────────────────────────────────────┐
│ Share with specific followers       │
│                          [ON]        │
├─────────────────────────────────────┤
│ Select Followers (2 of 5 selected)  │
│ [Select All]                        │
│                                     │
│ ┌─────────────────────────────────┐│
│ │ ☑ John Doe                      ││
│ │   john@example.com              ││
│ │                                 ││
│ │ ☑ Jane Smith                    ││
│ │   jane@example.com              ││
│ │                                 ││
│ │ ☐ Bob Johnson                   ││
│ │   bob@example.com               ││
│ └─────────────────────────────────┘│
│                                     │
│ ℹ️ Only 2 selected followers will  │
│    see this location.               │
└─────────────────────────────────────┘
```

## Benefits

### For Users
- 🎯 **Granular Control**: Choose exactly who sees each location
- 🔒 **Enhanced Privacy**: Don't share everything with all followers
- 👥 **Flexible Sharing**: Different locations for different groups
- 🎉 **Event Management**: Invite specific people to events
- 💡 **Smart Recommendations**: Share relevant locations with interested followers

### For Platform
- ✨ **Differentiated Feature**: More advanced than simple public/private
- 👍 **User Satisfaction**: More control = happier users
- 🔐 **Better Privacy**: Reduces oversharing concerns
- 📈 **Engagement**: Users more likely to share with granular control

## Technical Considerations

### Performance
- **Efficient Queries**: Indexes on `location_id` and `follower_id`
- **Batch Operations**: Multiple followers inserted in single query
- **Minimal Overhead**: Only queried for "followers" visibility locations

### Edge Cases Handled
1. **No followers selected**: Treated as "all followers" (default behavior)
2. **Visibility change**: Cleans up `location_followers` entries
3. **User unfollows**: RLS policies prevent access even if entry exists
4. **Location deletion**: Cascade deletes clean up `location_followers`
5. **User deletion**: Cascade deletes clean up all references

### Security
- **RLS Policies**: Enforce permissions at database level
- **Ownership Validation**: Only location owner can modify selective sharing
- **Follower Validation**: Can only select actual followers
- **Token Verification**: All API calls require valid auth token

## Testing Scenarios

### Basic Functionality
1. ✅ Create location with selective followers
2. ✅ Edit location to add/remove selective followers
3. ✅ Change visibility from "followers" to "public" (cleans up entries)
4. ✅ Change visibility from "public" to "followers" with selection

### Access Control
1. ✅ Selected follower can see location
2. ✅ Non-selected follower cannot see location
3. ✅ Location owner can always see their location
4. ✅ Public users cannot see "followers" locations

### Edge Cases
1. ✅ Empty selection behaves as "all followers"
2. ✅ Deleting location removes selective follower entries
3. ✅ User unfollowing still respects selective sharing
4. ✅ Multiple edits correctly update selections

## Future Enhancements

Potential improvements to consider:
1. **Follower Groups**: Create reusable groups of followers
2. **Quick Select**: "Select recent followers", "Select active followers"
3. **Bulk Operations**: Apply selective sharing to multiple locations
4. **Access Analytics**: See who has viewed shared locations
5. **Notification System**: Notify selected followers of new locations
6. **Expiration Per Follower**: Different expiration times per follower

## Migration Guide

### Applying the Migration
```bash
# Using Supabase CLI
supabase db push

# Or using psql
psql $DATABASE_URL -f supabase/migrations/20241016000002_add_selective_follower_sharing.sql
```

### Rollback Plan
If needed, rollback by dropping the table:
```sql
DROP TABLE IF EXISTS location_followers CASCADE;
```

This won't affect existing locations - they'll just fall back to default "all followers" behavior.

## Documentation Links
- **User Guide**: How to use selective sharing
- **API Reference**: `/docs/api-reference.md`
- **Database Schema**: `/supabase/schema.sql`
- **Component Docs**: Individual component README files

## Support

### Common Questions

**Q: What happens if I don't select any followers?**  
A: The location will be visible to all your followers (default behavior).

**Q: Can I change who sees a location later?**  
A: Yes, edit the location and update the selected followers.

**Q: What if a follower unfollows me?**  
A: They'll immediately lose access to your followers-only locations.

**Q: Can I combine with expiration?**  
A: Yes! Set expiration independently of selective sharing.

**Q: Is there a limit to how many followers I can select?**  
A: No hard limit, but UI is optimized for reasonable numbers.

## Conclusion

Selective follower sharing provides users with fine-grained control over location visibility, enhancing privacy while maintaining the social aspects of the platform. The implementation is efficient, secure, and user-friendly.
