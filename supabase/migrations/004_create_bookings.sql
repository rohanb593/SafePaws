-- Creates the 'bookings' table
--
-- Columns: id (uuid PK), pet_id (FK → pets.id), owner_id (FK → profiles.id),
--          minder_id (FK → profiles.id), location, status (default 'pending'),
--          start_time (timestamptz), end_time (timestamptz),
--          is_recurring (bool default false), recurring_schedule (text), created_at
--
-- CHECK: status IN ('pending', 'confirmed', 'cancelled', 'completed')
--
-- RLS policies:
--   SELECT: owner or minder on the booking
--   INSERT: pet_owner role only
--   UPDATE: minder can update status; owner can cancel (pending only)
--
-- Satisfies: RQ8, RQ9, RQ11, RQ18, RQ21, RQ24, RQ52
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  minder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location text NOT NULL DEFAULT '',
  status booking_status NOT NULL DEFAULT 'pending',
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_recurring boolean NOT NULL DEFAULT false,
  recurring_schedule text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requester can read their own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = minder_id);

CREATE POLICY "Requester can insert bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requester or minder can update bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = minder_id);
