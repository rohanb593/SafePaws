-- Persist GPS walk session stats when minder ends tracking (duration, distance, end time).

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS gps_session_duration_sec integer,
  ADD COLUMN IF NOT EXISTS gps_session_distance_m numeric,
  ADD COLUMN IF NOT EXISTS gps_session_ended_at timestamptz;

COMMENT ON COLUMN public.bookings.gps_session_duration_sec IS 'Elapsed seconds for the live GPS session (minder End session).';
COMMENT ON COLUMN public.bookings.gps_session_distance_m IS 'Approximate path distance in metres from GPS samples during the session.';
COMMENT ON COLUMN public.bookings.gps_session_ended_at IS 'When the minder ended the GPS session.';
