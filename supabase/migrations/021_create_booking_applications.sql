-- Job applications: minder proposes work against an owner listing before a `bookings` row exists.
-- Matches src/types/Booking.ts BookingApplication + useBookings.ts

CREATE TABLE IF NOT EXISTS public.booking_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  minder_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  minder_listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  proposed_price numeric NOT NULL,
  proposed_start_time timestamptz NOT NULL,
  proposed_end_time timestamptz NOT NULL,
  proposed_notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_applications_owner_listing_id_idx
  ON public.booking_applications (owner_listing_id);

CREATE INDEX IF NOT EXISTS booking_applications_minder_id_idx
  ON public.booking_applications (minder_id);

ALTER TABLE public.booking_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Minders insert own applications"
  ON public.booking_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = minder_id);

CREATE POLICY "Minder or listing owner can read application"
  ON public.booking_applications FOR SELECT
  TO authenticated
  USING (
    auth.uid() = minder_id
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = owner_listing_id AND l.user_id = auth.uid()
    )
  );

CREATE POLICY "Minder or listing owner can update application"
  ON public.booking_applications FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = minder_id
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = owner_listing_id AND l.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.booking_applications IS
  'Minder job proposals; owner accepts → creates row in bookings (see useBookings.acceptApplication).';
