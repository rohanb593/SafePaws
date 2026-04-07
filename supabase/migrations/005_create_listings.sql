-- Creates the 'listings' table
--
-- Columns: id (uuid PK), user_id (FK → profiles.id), profile, location (NOT NULL),
--          description, listing_type ('owner_listing' | 'minder_listing'),
--          animal (text, nullable), time (text, nullable),
--          price (numeric, nullable), rating (numeric, nullable), created_at
--
-- RLS policies:
--   SELECT: all authenticated users
--   INSERT/DELETE: only the listing owner (auth.uid() = user_id)
--
-- Satisfies: RQ33, RQ34, RQ35, RQ36
CREATE TYPE listing_type AS ENUM ('owner_listing', 'minder_listing');

CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  listing_type listing_type NOT NULL,
  animal text,
  time text,
  price numeric,
  rating numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read listings"
  ON public.listings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
