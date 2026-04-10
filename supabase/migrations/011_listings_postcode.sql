-- Postcode for listings — used by Find a Pet Minder search (ilike filter).
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS postcode text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.listings.postcode IS 'Area/postcode for search filtering (stored alongside free-text location).';
