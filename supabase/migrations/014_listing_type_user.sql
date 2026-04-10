-- Pet minder service listings use listing_type = 'user' (Find a Pet Minder search).
-- Legacy rows may still use 'minder_listing'; the app accepts both.
ALTER TYPE listing_type ADD VALUE IF NOT EXISTS 'user';

COMMENT ON TYPE listing_type IS
  'owner_listing = owner seeking minder; user = minder service ad (search); minder_listing = legacy minder ad.';
