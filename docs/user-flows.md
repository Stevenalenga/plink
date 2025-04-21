# User Flows

## Location Management Flows

### Saving a Location by Clicking on the Map

1. User navigates to the main map view
2. User clicks on a point on the map
3. A dialog opens with fields for:
   - Location name (optional, defaults to "Unnamed location")
   - Privacy toggle (public/private)
4. User fills in details and clicks "Save"
5. Location is saved to the database and appears on the map
6. A success notification is shown

### Saving a Location by Entering Coordinates

1. User navigates to the main map view
2. User clicks the "Add by Coordinates" button in the top-right corner
3. A dialog opens with fields for:
   - Location name (optional, defaults to "Custom Location")
   - Latitude (required, must be between -90 and 90)
   - Longitude (required, must be between -180 and 180)
   - Privacy toggle (public/private)
4. User fills in details and clicks "Save Location"
5. If coordinates are valid:
   - Location is saved to the database
   - Map centers on the new location
   - A marker appears on the map
   - A success notification is shown
6. If coordinates are invalid:
   - Error messages appear under the invalid fields
   - User must correct errors before saving

### Viewing Saved Locations

1. User navigates to the profile page
2. User selects the "My Locations" tab
3. A list of saved locations appears with:
   - Location name
   - Formatted coordinates (in DMS format)
   - Privacy status (public/private)
   - Action buttons (view on map, share, delete)

### Deleting a Location

1. User navigates to the profile page
2. User selects the "My Locations" tab
3. User clicks the delete button on a location
4. Location is removed from the database and the list
5. A success notification is shown

## Authentication Flows

### Sign Up

1. User navigates to the login page
2. User selects the "Sign Up" tab
3. User enters email, password, and name
4. On submission, a new account is created
5. User is automatically logged in and redirected to the map

### Sign In

1. User navigates to the login page
2. User enters email and password
3. On submission, user is authenticated
4. User is redirected to the map

### Sign Out

1. User clicks the logout button on the profile page
2. User session is terminated
3. User is redirected to the login page

### Password Reset

1. User clicks "Forgot password?" link on the login page
2. User enters their email address on the forgot password page
3. User clicks "Send Reset Link" button
4. A success message confirms that a reset email has been sent
5. User receives an email with a password reset link
6. User clicks the link and is redirected to the reset password page
7. User enters a new password and confirms it
8. On submission, the password is updated
9. User is redirected to the map with the new password active
