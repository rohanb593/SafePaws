// Listing — maps to Supabase `listings` (RQ33–RQ36)

import type { ListingAvailability } from './availability'

export interface Listing {
  id: string
  user_id: string
  location: string
  /** Used for Find a Pet Minder search filter (separate from free-text location). */
  postcode?: string
  description: string
  animal: string | null
  /** Structured weekly hours; `time` is a legacy summary string for older rows. */
  availability?: ListingAvailability | null
  time: string | null
  price: number | null
  rating: number | null
  created_at: string
  /** Set client-side when sorting search results by distance to a filter postcode. */
  distanceKm?: number
}
