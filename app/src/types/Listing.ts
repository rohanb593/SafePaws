// Listing, OwnerListing, MinderListing (RQ33, RQ34, RQ35, RQ36)
//
// Table: listings
// Columns:
//   id: string (uuid, primary key)
//   user_id: string (uuid, FK → profiles.id)
//   profile: string
//   location: string                        (required, RQ36)
//   description: string
//   listing_type: 'owner_listing' | 'minder_listing'
//   animal: string | null                   (OwnerListing only)
//   time: string | null                     (OwnerListing only)
//   price: number | null                    (MinderListing only)
//   rating: number | null                   (MinderListing only)
//   created_at: string
//
// RLS: anyone authenticated can read; only owner can insert/delete their own
//
// Exports: Listing interface, OwnerListing type, MinderListing type
