-- Listings no longer use `listing_type`; any authenticated user can create a listing.
ALTER TABLE public.listings DROP COLUMN IF EXISTS listing_type;

DROP TYPE IF EXISTS public.listing_type;
