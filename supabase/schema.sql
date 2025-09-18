-- Create tables for our application

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routes table
CREATE TABLE routes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Route points table (for storing waypoints in a route)
CREATE TABLE route_points (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  order_index INTEGER NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Followers table
CREATE TABLE followers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Add visibility columns
ALTER TABLE locations ADD COLUMN visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'followers', 'private'));
ALTER TABLE routes ADD COLUMN visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'followers', 'private'));

-- Migrate existing is_public to visibility
UPDATE locations SET visibility = CASE WHEN is_public THEN 'public' ELSE 'private' END;
UPDATE routes SET visibility = CASE WHEN is_public THEN 'public' ELSE 'private' END;

-- Drop old columns
ALTER TABLE locations DROP COLUMN is_public;
ALTER TABLE routes DROP COLUMN is_public;

-- Create RLS policies

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Locations table policies
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public locations"
  ON locations FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can view locations shared with followers"
  ON locations FOR SELECT
  USING (visibility = 'followers' AND auth.uid() IN (SELECT follower_id FROM followers WHERE following_id = user_id));

CREATE POLICY "Users can view their own locations"
  ON locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own locations"
  ON locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own locations"
  ON locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own locations"
  ON locations FOR DELETE
  USING (auth.uid() = user_id);

-- Routes table policies
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public routes"
  ON routes FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can view routes shared with followers"
  ON routes FOR SELECT
  USING (visibility = 'followers' AND auth.uid() IN (SELECT follower_id FROM followers WHERE following_id = user_id));

CREATE POLICY "Users can view their own routes"
  ON routes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routes"
  ON routes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routes"
  ON routes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routes"
  ON routes FOR DELETE
  USING (auth.uid() = user_id);

-- Route points table policies
ALTER TABLE route_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view points for public routes"
  ON route_points FOR SELECT
  USING (
    (SELECT visibility FROM routes WHERE id = route_id) = 'public'
  );

CREATE POLICY "Users can view points for routes shared with followers"
  ON route_points FOR SELECT
  USING (
    (SELECT visibility FROM routes WHERE id = route_id) = 'followers' AND auth.uid() IN (SELECT follower_id FROM followers WHERE following_id = (SELECT user_id FROM routes WHERE id = route_id))
  );

CREATE POLICY "Users can view points for their own routes"
  ON route_points FOR SELECT
  USING (
    (SELECT user_id FROM routes WHERE id = route_id) = auth.uid()
  );

CREATE POLICY "Users can insert points for their own routes"
  ON route_points FOR INSERT
  WITH CHECK (
    (SELECT user_id FROM routes WHERE id = route_id) = auth.uid()
  );

CREATE POLICY "Users can update points for their own routes"
  ON route_points FOR UPDATE
  USING (
    (SELECT user_id FROM routes WHERE id = route_id) = auth.uid()
  );

CREATE POLICY "Users can delete points for their own routes"
  ON route_points FOR DELETE
  USING (
    (SELECT user_id FROM routes WHERE id = route_id) = auth.uid()
  );

-- Followers table policies
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own followers/following"
  ON followers FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can follow others"
  ON followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON followers FOR DELETE
  USING (auth.uid() = follower_id);

-- Create functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for locations table
CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for routes table
CREATE TRIGGER update_routes_updated_at
BEFORE UPDATE ON routes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auth.users to create profile in public.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();
