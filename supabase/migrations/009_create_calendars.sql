-- Creates the 'calendars' table
--
-- Columns: id (uuid PK), minder_id (uuid UNIQUE FK → profiles.id),
--          available_timing (jsonb default '[]'),  ← TimeSlot[]
--          booked_timing (jsonb default '[]')       ← TimeSlot[]
--
-- One-to-one with PetMinder (minder_id is UNIQUE)
--
-- RLS policies:
--   SELECT: all authenticated users (needed for booking availability check)
--   UPDATE: only the minder (auth.uid() = minder_id)
--   INSERT: only the minder
--
-- Satisfies: RQ12, RQ20
CREATE TABLE public.calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  minder_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  available_timing jsonb NOT NULL DEFAULT '[]',
  booked_timing jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read calendars"
  ON public.calendars FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Minder can insert their own calendar"
  ON public.calendars FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = minder_id);

CREATE POLICY "Minder can update their own calendar"
  ON public.calendars FOR UPDATE
  TO authenticated
  USING (auth.uid() = minder_id);

CREATE TABLE public.favourites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  minder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, minder_id)
);

ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read their own favourites"
  ON public.favourites FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert favourites"
  ON public.favourites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete favourites"
  ON public.favourites FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE TABLE public.gps_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid UNIQUE NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gps_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requester and minder can read GPS"
  ON public.gps_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = booking_id
      AND (requester_id = auth.uid() OR minder_id = auth.uid())
    )
  );

CREATE POLICY "Minder can upsert GPS location"
  ON public.gps_locations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = booking_id
      AND minder_id = auth.uid()
    )
  );

CREATE POLICY "Minder can update GPS location"
  ON public.gps_locations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = booking_id
      AND minder_id = auth.uid()
    )
  );
  
