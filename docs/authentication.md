# Authentication

## Authentication Flow

1. **Sign Up**:
   - User enters email, password, and name
   - `signUp()` function in UserProvider calls Supabase Auth
   - On success, a new record is created in the `users` table via database trigger
   - User is automatically logged in

2. **Sign In**:
   - User enters email and password
   - `signIn()` function in UserProvider calls Supabase Auth
   - On success, user session is stored and auth state is updated

3. **Sign Out**:
   - User clicks logout button
   - `signOut()` function in UserProvider calls Supabase Auth
   - Auth state is cleared

4. **Password Reset**:
   - User clicks "Forgot password?" link on login page
   - User enters email address on forgot password page
   - `resetPassword()` function sends a password reset email via Supabase Auth
   - User clicks link in email and is redirected to reset password page
   - User enters new password
   - `updatePassword()` function updates the password via Supabase Auth

5. **Session Management**:
   - UserProvider initializes by checking for existing session
   - Supabase Auth listener updates auth state on changes
   - Protected routes check auth state and redirect if needed

## Protected Routes

Routes like `/profile` check authentication status and redirect to login if the user is not authenticated:

\`\`\`typescript
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.push("/login")
  }
}, [isAuthenticated, router, isLoading])
\`\`\`

## User Context

The UserProvider exposes these values to the application:

- `user`: Current user object or null
- `session`: Current session object or null
- `isAuthenticated`: Boolean indicating if user is logged in
- `isLoading`: Boolean indicating if auth state is being loaded
- `signIn`: Function to log in a user
- `signUp`: Function to create a new user
- `signOut`: Function to log out a user
- `resetPassword`: Function to send a password reset email
- `updatePassword`: Function to update a user's password

\`\`\`

Let's also update the user flows documentation:
