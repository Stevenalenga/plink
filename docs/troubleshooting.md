# Troubleshooting Guide

## Common Issues

### Authentication Problems

#### Issue: User can't log in
- Check if email and password are correct
- Verify Supabase URL and anon key are correct
- Check browser console for errors
- Ensure the user exists in Supabase Auth

#### Issue: Session not persisting
- Check if cookies are enabled in the browser
- Verify that the Supabase client is properly initialized
- Check for any CORS issues

### Map Display Issues

#### Issue: Map doesn't load
- Verify Google Maps API key is correct
- Check if the API key has the necessary permissions
- Look for JavaScript errors in the console
- Ensure the map container has a defined height

#### Issue: Markers don't appear
- Check if marker data is being fetched correctly
- Verify the marker coordinates are valid
- Check if the map is centered correctly

### Data Fetching Issues

#### Issue: Can't save locations
- Verify user is authenticated
- Check Supabase RLS policies
- Look for validation errors in the console
- Ensure all required fields are provided

#### Issue: Can't see saved locations
- Check if locations are being fetched correctly
- Verify RLS policies allow access
- Check if the user has any saved locations

## Debugging Tips

### Client-Side Debugging

\`\`\`typescript
// Add this to troubleshoot authentication issues
useEffect(() => {
  console.log("Auth state:", { user, isAuthenticated, isLoading })
}, [user, isAuthenticated, isLoading])

// Add this to troubleshoot map issues
useEffect(() => {
  console.log("Map state:", { map, markers })
}, [map, markers])
\`\`\`

### Supabase Debugging

- Use the Supabase dashboard to inspect database tables
- Check the Auth section for user accounts
- Review logs for API calls and errors
- Test queries directly in the SQL editor

### Google Maps Debugging

- Use the Google Cloud Console to check API usage
- Verify API key restrictions
- Test the API key with a simple map example
- Check for errors in the browser console

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
