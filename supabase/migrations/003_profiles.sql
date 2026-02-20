-- Migration 003: Profiles table
-- Stores user profile data for both owners and employees

CREATE TABLE profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                 user_role NOT NULL,
  full_name            TEXT NOT NULL,
  phone                TEXT UNIQUE,
  avatar_url           TEXT,
  bio                  TEXT,
  -- PostGIS geography for distance calculations (SRID 4326 = WGS84 GPS)
  location             geography(Point, 4326),
  city                 TEXT,
  state                TEXT,
  location_updated_at  TIMESTAMPTZ DEFAULT NOW(),
  kyc_status           kyc_status NOT NULL DEFAULT 'NOT_SUBMITTED',
  kyc_verified_at      TIMESTAMPTZ,
  -- Denormalized rating (updated on each new review)
  avg_rating           NUMERIC(3,2) DEFAULT 0,
  total_reviews        INT DEFAULT 0,
  is_active            BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for location-based queries
CREATE INDEX idx_profiles_location ON profiles USING GIST (location);
CREATE INDEX idx_profiles_role     ON profiles (role);
CREATE INDEX idx_profiles_city     ON profiles (city);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
