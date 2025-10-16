# Quick Start: Selective Follower Sharing

## 🚀 Apply This Feature in 3 Steps

### Step 1: Run Database Migration (Required)

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `supabase/migrations/20241016000002_add_selective_follower_sharing.sql`
5. Paste and click **Run**

**Option B: Using Supabase CLI**
```bash
supabase db push
```

**Option C: Using psql**
```bash
psql $DATABASE_URL -f supabase/migrations/20241016000002_add_selective_follower_sharing.sql
```

### Step 2: Deploy Code (Automatic)

All code changes are already in place. Just deploy your application:

```bash
# Build and deploy (example for Next.js)
npm run build
# or
pnpm build

# Deploy to your hosting platform
vercel deploy
# or your preferred deployment method
```

### Step 3: Test the Feature

**Quick Test**:
1. **Create a location**:
   - Go to the map
   - Click to add a location
   - Set visibility to "Followers Only"
   - Toggle "Share with specific followers" ON
   - Select 2-3 followers
   - Save

2. **Verify**:
   - Check your profile page
   - Edit the location
   - Verify selected followers are preserved

3. **Test access**:
   - Log in as a selected follower → should see location
   - Log in as non-selected follower → should NOT see location

## ✅ Success Indicators

You'll know it's working when:
- ✅ Toggle switch appears under "Followers Only" visibility
- ✅ Follower list loads with avatars and names
- ✅ Selection persists when editing
- ✅ Non-selected followers can't see the location

## 🎯 What Changed?

### Database
- New table: `location_followers` (tracks selective access)
- New indexes for performance
- RLS policies for security

### UI Changes
- **Location Creation Dialog**: New "Share with specific followers" toggle
- **Edit Location Dialog**: Same toggle with pre-populated selections
- **Wider Dialogs**: Increased width to fit follower selector

### API Changes
- `POST /api/locations`: Accepts `selectedFollowers` array
- `PATCH /api/locations/[id]`: New endpoint for updates
- `GET /api/locations`: Filters by selective permissions

## 📝 Usage Examples

### Share Home with Close Friends Only
```
1. Create location named "My Home"
2. Set visibility: Followers Only
3. Toggle: "Share with specific followers" ON
4. Select: Close friends only
5. Save
```

### Event Invitation
```
1. Create location for event
2. Set visibility: Followers Only
3. Toggle selective sharing ON
4. Select event invitees
5. Set expiration: 24 hours
6. Save
```

### Exclusive Recommendation
```
1. Create location for restaurant
2. Add link to restaurant website
3. Set visibility: Followers Only
4. Toggle selective sharing ON
5. Select followers who would enjoy it
6. Save
```

## ⚠️ Important Notes

### Backward Compatibility
- **Empty selection** = All followers can see (default behavior)
- **No entries in `location_followers`** = All followers can see
- Existing locations work exactly as before

### Combining Features
- ✅ Works with expiration (24h, custom, never)
- ✅ Works with URLs/links
- ✅ Works with all coordinate input methods
- ✅ Independent of other location features

### Performance
- Efficient with proper database indexes
- Minimal overhead (only for "followers" visibility)
- Scales to hundreds of followers

## 🐛 Troubleshooting

### Toggle not appearing
- **Check**: Is visibility set to "Followers Only"?
- **Solution**: Only appears for followers visibility

### Followers not loading
- **Check**: Do you have any followers?
- **Solution**: Need at least one follower to use this feature

### Selection not saving
- **Check**: Browser console for errors
- **Solution**: Verify API endpoint is accessible

### Access still granted after deselection
- **Check**: Did you save the changes?
- **Solution**: Must click "Save" to persist changes

## 📚 Full Documentation

For detailed information, see:
- **Implementation Details**: `docs/SELECTIVE_SHARING_IMPLEMENTATION.md`
- **Feature Documentation**: `docs/selective-follower-sharing.md`
- **Migration File**: `supabase/migrations/20241016000002_add_selective_follower_sharing.sql`

## 🎉 That's It!

Your selective follower sharing feature is now live. Users can:
- Choose specific followers for each location
- Maintain privacy with granular control
- Combine with expiration for time-limited sharing
- Easily manage selections when editing

Happy sharing! 🗺️
