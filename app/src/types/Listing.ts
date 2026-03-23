// Listing (RQ33, RQ34, RQ35, RQ36)
// Any user can post either listing type — owner_listing to find a minder,
// minder_listing to advertise minding services.

export interface Listing {
  id: string
  user_id: string
  location: string
  description: string
  listing_type: 'owner_listing' | 'minder_listing'
  animal: string | null
  time: string | null
  price: number | null
  rating: number | null
  created_at: string
}

export type OwnerListing = Listing & { listing_type: 'owner_listing'; animal: string; time: string }
export type MinderListing = Listing & { listing_type: 'minder_listing'; price: number; rating: number }
