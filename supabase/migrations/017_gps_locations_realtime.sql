-- Owner live map uses Realtime (postgres_changes) on this table.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'gps_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gps_locations;
  END IF;
END $$;
