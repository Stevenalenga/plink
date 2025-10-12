-- Migration: Add expires_at column to locations table
-- Date: 2024-10-12
-- Description: Adds automatic expiration support for locations

-- Add expires_at column for automatic deletion after 24 hours
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on expires_at field (used by cleanup job)
CREATE INDEX IF NOT EXISTS idx_locations_expires_at ON locations(expires_at) 
WHERE expires_at IS NOT NULL;

-- Update existing public locations to expire 24 hours from now (migration)
-- Note: This is optional - you can skip this if you don't want existing locations to expire
-- UPDATE locations 
-- SET expires_at = NOW() + INTERVAL '24 hours'
-- WHERE visibility = 'public' AND expires_at IS NULL;

-- Create a function to automatically set expires_at for public locations
CREATE OR REPLACE FUNCTION set_location_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- If location is public and expires_at is not set, set it to 24 hours from now
  IF NEW.visibility = 'public' AND NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '24 hours';
  -- If location is changed to public and expires_at is not set
  ELSIF NEW.visibility = 'public' AND OLD.visibility != 'public' AND NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '24 hours';
  -- If location is changed from public to private/followers, clear expires_at
  ELSIF NEW.visibility != 'public' AND OLD.visibility = 'public' THEN
    NEW.expires_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set expiration on insert/update
DROP TRIGGER IF EXISTS trigger_set_location_expiration ON locations;
CREATE TRIGGER trigger_set_location_expiration
BEFORE INSERT OR UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION set_location_expiration();

-- Add comment to the column for documentation
COMMENT ON COLUMN locations.expires_at IS 'Timestamp when the location should be automatically deleted. Automatically set to 24 hours after creation for public locations.';
